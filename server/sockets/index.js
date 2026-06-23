const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Room = require('../models/Room');
const Item = require('../models/Item');
const Bid = require('../models/Bid');
const { validateBid } = require('../services/auctionService');
const timerService = require('./timer');

// In-memory active presence tracker
// Key: roomCode, Value: Set of active userIds
const activePresence = {};

const initSockets = (server) => {
  const io = socketIO(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // JWT socket authentication handshake middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-passwordHash');

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = user;
      next();
    } catch (err) {
      console.error('Socket Auth Error:', err.message);
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.user;
    let currentRoomCode = null;

    console.log(`Socket client verified: ${user.username} (${socket.id})`);

    // Handler: Join Room
    socket.on('join_room', async ({ roomCode }) => {
      if (!roomCode) return;
      const code = roomCode.toUpperCase();
      currentRoomCode = code;

      socket.join(code);

      // Add to presence list
      if (!activePresence[code]) {
        activePresence[code] = new Set();
      }
      activePresence[code].add(user._id.toString());

      // Broadcast updated presence list (usernames)
      sendPresenceUpdate(io, code);

      // Log system join message
      io.to(code).emit('chat_message', {
        userId: 'system',
        username: 'SYSTEM',
        message: `${user.username.toUpperCase()} ENTERED THE SECTOR`,
        timestamp: new Date()
      });
    });

    // Handler: Leave Room
    socket.on('leave_room', () => {
      if (!currentRoomCode) return;
      const code = currentRoomCode;

      socket.leave(code);

      if (activePresence[code]) {
        activePresence[code].delete(user._id.toString());
      }

      sendPresenceUpdate(io, code);

      io.to(code).emit('chat_message', {
        userId: 'system',
        username: 'SYSTEM',
        message: `${user.username.toUpperCase()} DISCONNECTED FROM SECTOR`,
        timestamp: new Date()
      });

      currentRoomCode = null;
    });

    // Handler: Chat Messages
    socket.on('send_message', ({ message }) => {
      if (!currentRoomCode || !message || !message.trim()) return;

      io.to(currentRoomCode).emit('chat_message', {
        userId: user._id,
        username: user.username,
        message: message.trim(),
        timestamp: new Date()
      });
    });

    // Handler: Start Auction (Admin only)
    socket.on('start_auction', async () => {
      if (!currentRoomCode) return;

      try {
        const room = await Room.findOne({ code: currentRoomCode });
        if (!room) return;

        // Verify admin
        if (room.adminId.toString() !== user._id.toString()) {
          return socket.emit('error_message', 'Only admin can start the auction');
        }

        // Trigger authoritative timing loop
        await timerService.startRoomTimer(io, currentRoomCode);
      } catch (err) {
        console.error('Socket start_auction error:', err);
      }
    });

    // Handler: Pause Auction (Admin only)
    socket.on('pause_auction', async () => {
      if (!currentRoomCode) return;
      try {
        const room = await Room.findOne({ code: currentRoomCode });
        if (room && room.adminId.toString() === user._id.toString()) {
          const success = timerService.pauseTimer(currentRoomCode);
          if (success) {
            io.to(currentRoomCode).emit('auction_paused', { isPaused: true });
          }
        }
      } catch (err) {
        console.error('Socket pause error:', err);
      }
    });

    // Handler: Resume Auction (Admin only)
    socket.on('resume_auction', async () => {
      if (!currentRoomCode) return;
      try {
        const room = await Room.findOne({ code: currentRoomCode });
        if (room && room.adminId.toString() === user._id.toString()) {
          const success = timerService.resumeTimer(currentRoomCode);
          if (success) {
            io.to(currentRoomCode).emit('auction_resumed', { isPaused: false });
          }
        }
      } catch (err) {
        console.error('Socket resume error:', err);
      }
    });

    // Handler: Skip Item (Admin only)
    socket.on('skip_item', async () => {
      if (!currentRoomCode) return;
      try {
        const room = await Room.findOne({ code: currentRoomCode });
        if (room && room.adminId.toString() === user._id.toString()) {
          timerService.forceSkipItem(io, currentRoomCode);
        }
      } catch (err) {
        console.error('Socket skip error:', err);
      }
    });

    // Handler: Place Bid (Client)
    socket.on('place_bid', async ({ amount }) => {
      if (!currentRoomCode || !amount) return;

      try {
        const code = currentRoomCode;
        const room = await Room.findOne({ code }).populate('items');
        if (!room) return;

        const timerState = timerService.activeTimers[code];
        if (!timerState) {
          return socket.emit('error_message', 'No active auction running in this room');
        }

        const currentItem = timerState.items[timerState.currentItemIndex];

        // 1. Calculate user's current budget spent in this room
        // Spend = Sum of winning bids on items they won + active high bid if they are highest bidder
        const wonItems = await Item.find({ roomId: room._id, winnerId: user._id, status: 'sold' });
        let currentSpend = wonItems.reduce((acc, it) => acc + it.winningBid, 0);

        // Add active bid if they are current leader
        if (
          timerState.currentHighestBidder &&
          timerState.currentHighestBidder._id.toString() === user._id.toString()
        ) {
          currentSpend += timerState.currentHighestBid;
        }

        const totalBudget = 100000; // Mock $100k wallet limit
        const remainingBudget = totalBudget - currentSpend;

        // 2. Validate proposed bid using core business service
        const validation = validateBid(
          amount,
          timerState.currentHighestBid,
          currentItem.startingPrice,
          remainingBudget,
          room.status,
          timerState.isPaused
        );

        if (!validation.valid) {
          return socket.emit('error_message', validation.error.toUpperCase());
        }

        // 3. Save new Bid record to MongoDB
        const bid = new Bid({
          roomId: room._id,
          itemId: currentItem._id,
          userId: user._id,
          amount
        });
        await bid.save();

        // 4. Update in-memory registry and broadcast update
        await timerService.handlePlacedBid(io, code, bid, user.username);
      } catch (err) {
        console.error('Bidding Socket Error:', err);
        socket.emit('error_message', 'TRANSACTION SERVER TIMEOUT. PLEASE RETRY.');
      }
    });

    // Handler: Disconnect
    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${user.username} (${socket.id})`);
      if (currentRoomCode) {
        const code = currentRoomCode;
        if (activePresence[code]) {
          activePresence[code].delete(user._id.toString());
        }
        sendPresenceUpdate(io, code);

        io.to(code).emit('chat_message', {
          userId: 'system',
          username: 'SYSTEM',
          message: `${user.username.toUpperCase()} DISCONNECTED FROM SECTOR`,
          timestamp: new Date()
        });
      }
    });
  });

  return io;
};

// Helper: Broadcast presence list usernames to active room channels
const sendPresenceUpdate = async (io, code) => {
  try {
    const userIds = activePresence[code] ? Array.from(activePresence[code]) : [];
    // Fetch usernames
    const users = await User.find({ _id: { $in: userIds } }).select('username');
    const onlineUsernames = users.map((u) => u.username);

    io.to(code).emit('presence_update', {
      onlineUsers: onlineUsernames
    });
  } catch (err) {
    console.error('Presence Update Error:', err);
  }
};

module.exports = { initSockets };
