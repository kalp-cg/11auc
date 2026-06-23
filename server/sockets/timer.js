const Room = require('../models/Room');
const Item = require('../models/Item');
const Bid = require('../models/Bid');
const User = require('../models/User');
const AuctionResult = require('../models/AuctionResult');

// In-memory registry of active timers per room
const activeTimers = {};

// Helper to get or create bot users in database
const getBotUsers = async () => {
  const bots = [
    { username: 'AlphaBidder', email: 'alpha@bot.net' },
    { username: 'CryptoKing', email: 'crypto@bot.net' },
    { username: 'AuctionBoss', email: 'boss@bot.net' }
  ];

  const botDocs = [];
  for (const bot of bots) {
    let doc = await User.findOne({ username: bot.username });
    if (!doc) {
      doc = await User.create({
        username: bot.username,
        email: bot.email,
        passwordHash: '$2a$10$botpasswordhashplaceholder' // Mock password hash
      });
    }
    botDocs.push(doc);
  }
  return botDocs;
};

// Start or restart countdown for a room
const startRoomTimer = async (io, roomCode) => {
  try {
    const code = roomCode.toUpperCase();
    const room = await Room.findOne({ code }).populate('items').populate('participants.userId');

    if (!room) return;

    // Fetch bots and ensure they are added to room participants for visual listing
    const bots = await getBotUsers();
    let updatedParticipants = [...room.participants];
    let changed = false;

    for (const bot of bots) {
      const exists = room.participants.some(
        (p) => p.userId && p.userId._id.toString() === bot._id.toString()
      );
      if (!exists) {
        updatedParticipants.push({ userId: bot._id });
        changed = true;
      }
    }

    room.participants = updatedParticipants;
    room.status = 'auction';
    room.currentItemIndex = 0;
    await room.save();

    // Set first item status as active and rest pending
    const items = await Item.find({ roomId: room._id }).sort({ order: 1 });
    for (let i = 0; i < items.length; i++) {
      items[i].status = i === 0 ? 'active' : 'pending';
      await items[i].save();
    }

    // Initialize timer state in memory
    if (activeTimers[code] && activeTimers[code].intervalId) {
      clearInterval(activeTimers[code].intervalId);
    }

    activeTimers[code] = {
      intervalId: null,
      timeLeft: 30,
      isPaused: false,
      currentItemIndex: 0,
      items,
      currentHighestBid: null,
      currentHighestBidder: null,
      bidHistory: []
    };

    // Broadcast initial state
    io.to(code).emit('timer_tick', {
      timeLeft: 30,
      currentItemIndex: 0,
      currentItem: items[0],
      currentHighestBid: null,
      currentHighestBidder: null,
      isPaused: false
    });

    // Run clock loop every 1 second
    activeTimers[code].intervalId = setInterval(() => clockTick(io, code), 1000);
  } catch (error) {
    console.error('Error starting room timer:', error);
  }
};

const clockTick = async (io, code) => {
  const timerState = activeTimers[code];
  if (!timerState) return;

  if (timerState.isPaused) {
    return;
  }

  // BOT SIMULATION RANDOM BID ROLL
  // Every second, 12% probability that a bot bids, if time is > 2 seconds
  if (timerState.timeLeft > 2 && Math.random() < 0.12) {
    try {
      const bots = await getBotUsers();
      const bot = bots[Math.floor(Math.random() * bots.length)];

      const currentItem = timerState.items[timerState.currentItemIndex];
      const minBid =
        timerState.currentHighestBid !== null
          ? timerState.currentHighestBid + 50
          : currentItem.startingPrice;

      // Mock bot wallets are unlimited ($100k+), so they always bid
      const botBid = new Bid({
        roomId: currentItem.roomId,
        itemId: currentItem._id,
        userId: bot._id,
        amount: minBid
      });
      await botBid.save();

      timerState.currentHighestBid = minBid;
      timerState.currentHighestBidder = {
        _id: bot._id,
        username: bot.username
      };

      const populatedBid = {
        _id: botBid._id,
        amount: botBid.amount,
        timestamp: botBid.timestamp,
        userId: {
          _id: bot._id,
          username: bot.username
        }
      };
      timerState.bidHistory.unshift(populatedBid);

      // Broadcast updated bid state
      io.to(code).emit('bid_update', {
        currentHighestBid: minBid,
        currentHighestBidder: timerState.currentHighestBidder,
        bidHistory: timerState.bidHistory
      });
    } catch (err) {
      console.error('Bot bidding error:', err);
    }
  }

  timerState.timeLeft -= 1;

  // Check if timer expired
  if (timerState.timeLeft <= 0) {
    clearInterval(timerState.intervalId);
    timerState.intervalId = null;
    resolveItem(io, code);
    return;
  }

  // Normal tick broadcast
  io.to(code).emit('timer_tick', {
    timeLeft: timerState.timeLeft,
    currentItemIndex: timerState.currentItemIndex,
    currentItem: timerState.items[timerState.currentItemIndex],
    currentHighestBid: timerState.currentHighestBid,
    currentHighestBidder: timerState.currentHighestBidder,
    isPaused: timerState.isPaused
  });
};

const resolveItem = async (io, code) => {
  const timerState = activeTimers[code];
  if (!timerState) return;

  try {
    const currentItem = timerState.items[timerState.currentItemIndex];
    const room = await Room.findOne({ code });

    if (timerState.currentHighestBid !== null) {
      // SOLD
      currentItem.status = 'sold';
      currentItem.winnerId = timerState.currentHighestBidder._id;
      currentItem.winningBid = timerState.currentHighestBid;
      await currentItem.save();

      io.to(code).emit('item_resolved', {
        item: currentItem,
        status: 'sold',
        winner: timerState.currentHighestBidder.username,
        amount: timerState.currentHighestBid
      });
    } else {
      // UNSOLD
      currentItem.status = 'unsold';
      await currentItem.save();

      io.to(code).emit('item_resolved', {
        item: currentItem,
        status: 'unsold'
      });
    }

    // Schedule next item transition after a 3-second delay
    setTimeout(() => {
      advanceAuction(io, code);
    }, 3000);
  } catch (error) {
    console.error('Error resolving item:', error);
  }
};

const advanceAuction = async (io, code) => {
  const timerState = activeTimers[code];
  if (!timerState) return;

  try {
    timerState.currentItemIndex += 1;

    if (timerState.currentItemIndex < timerState.items.length) {
      // Reset timer for the next item
      timerState.timeLeft = 30;
      timerState.currentHighestBid = null;
      timerState.currentHighestBidder = null;
      timerState.bidHistory = [];

      const nextItem = timerState.items[timerState.currentItemIndex];
      nextItem.status = 'active';
      await nextItem.save();

      // Start clock loop again
      timerState.intervalId = setInterval(() => clockTick(io, code), 1000);

      io.to(code).emit('timer_tick', {
        timeLeft: 30,
        currentItemIndex: timerState.currentItemIndex,
        currentItem: nextItem,
        currentHighestBid: null,
        currentHighestBidder: null,
        isPaused: false
      });

      // Clear client side bid history registry
      io.to(code).emit('bid_update', {
        currentHighestBid: null,
        currentHighestBidder: null,
        bidHistory: []
      });
    } else {
      // End of items -> COMPLETE AUCTION
      const room = await Room.findOne({ code }).populate('items');
      room.status = 'completed';
      await room.save();

      // Compile Auction Results
      const items = await Item.find({ roomId: room._id });
      const winners = [];
      const userSpendMap = {};

      for (const item of items) {
        if (item.status === 'sold' && item.winnerId) {
          winners.push({
            userId: item.winnerId,
            itemId: item._id,
            amount: item.winningBid
          });

          const userIdStr = item.winnerId.toString();
          userSpendMap[userIdStr] = (userSpendMap[userIdStr] || 0) + item.winningBid;
        }
      }

      const totalByUser = Object.keys(userSpendMap).map((userId) => ({
        userId,
        total: userSpendMap[userId]
      }));

      const results = new AuctionResult({
        roomId: room._id,
        winners,
        totalByUser
      });
      await results.save();

      // Populate names in results
      const populatedResults = await AuctionResult.findById(results._id)
        .populate('winners.userId', 'username')
        .populate('winners.itemId', 'name startingPrice')
        .populate('totalByUser.userId', 'username');

      io.to(code).emit('auction_completed', {
        results: populatedResults
      });

      // Clean up in memory timer registry
      delete activeTimers[code];
    }
  } catch (error) {
    console.error('Error advancing auction:', error);
  }
};

const pauseTimer = (code) => {
  const timerState = activeTimers[code.toUpperCase()];
  if (timerState) {
    timerState.isPaused = true;
    return true;
  }
  return false;
};

const resumeTimer = (code) => {
  const timerState = activeTimers[code.toUpperCase()];
  if (timerState && timerState.isPaused) {
    timerState.isPaused = false;
    return true;
  }
  return false;
};

const forceSkipItem = (io, code) => {
  const timerState = activeTimers[code.toUpperCase()];
  if (timerState) {
    if (timerState.intervalId) {
      clearInterval(timerState.intervalId);
    }
    timerState.timeLeft = 0;
    resolveItem(io, code.toUpperCase());
    return true;
  }
  return false;
};

const handlePlacedBid = async (io, code, bidDoc, username) => {
  const timerState = activeTimers[code.toUpperCase()];
  if (!timerState) return;

  timerState.currentHighestBid = bidDoc.amount;
  timerState.currentHighestBidder = {
    _id: bidDoc.userId,
    username
  };

  const populatedBid = {
    _id: bidDoc._id,
    amount: bidDoc.amount,
    timestamp: bidDoc.timestamp,
    userId: {
      _id: bidDoc.userId,
      username
    }
  };
  timerState.bidHistory.unshift(populatedBid);

  io.to(code.toUpperCase()).emit('bid_update', {
    currentHighestBid: bidDoc.amount,
    currentHighestBidder: timerState.currentHighestBidder,
    bidHistory: timerState.bidHistory
  });
};

module.exports = {
  startRoomTimer,
  pauseTimer,
  resumeTimer,
  forceSkipItem,
  handlePlacedBid,
  activeTimers
};
