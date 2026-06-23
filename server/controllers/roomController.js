const Room = require('../models/Room');
const Item = require('../models/Item');
const AuctionResult = require('../models/AuctionResult');
const timerService = require('../sockets/timer');

// Helper to generate unique 6-character uppercase alphanumeric code
const generateRoomCode = async () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let isUnique = false;
  let code = '';

  while (!isUnique) {
    code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    // Check db
    const existing = await Room.findOne({ code });
    if (!existing) {
      isUnique = true;
    }
  }
  return code;
};

// Default seed items for new rooms to enable instant testing
const DEFAULT_ITEMS = [
  {
    name: 'Retro Jordan 1 Chicago (1985)',
    description: 'Original deadstock Jordan 1s in pristine condition.',
    startingPrice: 500,
    imageUrl: 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=400',
    order: 1
  },
  {
    name: 'Vintage Rolex Submariner',
    description: 'Ref 5513 matte dial from 1978. Service history included.',
    startingPrice: 8000,
    imageUrl: 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=400',
    order: 2
  },
  {
    name: 'Signed Lionel Messi Jersey',
    description: 'FC Barcelona 2015 Champions League final match-worn, signed jersey.',
    startingPrice: 1200,
    imageUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=400',
    order: 3
  },
  {
    name: 'Cyberpunk Digital Canvas Art',
    description: '1 of 1 premium digital neon print canvas.',
    startingPrice: 150,
    imageUrl: 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=400',
    order: 4
  },
  {
    name: 'Antique Leather Club Chair',
    description: '19th-century French tobacco leather club chair with rich patina.',
    startingPrice: 300,
    imageUrl: 'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=400',
    order: 5
  }
];

/**
 * @desc    Create a new auction room
 * @route   POST /api/rooms
 * @access  Private
 */
const createRoom = async (req, res, next) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Room name is required'
      });
    }

    const code = await generateRoomCode();

    // Create the room
    const room = new Room({
      name: name.trim(),
      code,
      adminId: req.user._id,
      participants: [{ userId: req.user._id }],
      status: 'lobby'
    });

    await room.save();

    // Create default items linked to this room
    const itemDocs = DEFAULT_ITEMS.map((item) => ({
      ...item,
      roomId: room._id
    }));

    const createdItems = await Item.insertMany(itemDocs);

    // Link items to room
    room.items = createdItems.map((item) => item._id);
    await room.save();

    res.status(201).json({
      success: true,
      room: {
        id: room._id,
        name: room.name,
        code: room.code,
        adminId: room.adminId,
        status: room.status
      },
      items: createdItems
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Join room by 6-char code
 * @route   POST /api/rooms/join
 * @access  Private
 */
const joinRoom = async (req, res, next) => {
  try {
    const { code } = req.body;

    if (!code || code.trim().length !== 6) {
      return res.status(400).json({
        success: false,
        error: 'Invalid 6-character room code'
      });
    }

    const searchCode = code.trim().toUpperCase();

    // Find the room
    const room = await Room.findOne({ code: searchCode });

    if (!room) {
      return res.status(404).json({
        success: false,
        error: 'Room not found. Please verify the code.'
      });
    }

    // Check if user is already a participant
    const isParticipant = room.participants.some(
      (p) => p.userId.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      room.participants.push({ userId: req.user._id });
      await room.save();
    }

    res.status(200).json({
      success: true,
      message: 'Joined room successfully',
      roomCode: room.code,
      roomId: room._id
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get room state & items details by code
 * @route   GET /api/rooms/:code
 * @access  Private
 */
const getRoomByCode = async (req, res, next) => {
  try {
    const { code } = req.params;

    if (!code || code.trim().length !== 6) {
      return res.status(400).json({
        success: false,
        error: 'Invalid 6-character room code'
      });
    }

    const searchCode = code.trim().toUpperCase();

    const room = await Room.findOne({ code: searchCode })
      .populate('adminId', 'username email')
      .populate('participants.userId', 'username email')
      .populate('items');

    if (!room) {
      return res.status(404).json({
        success: false,
        error: 'Room not found'
      });
    }

    // Verify requesting user is a participant of the room
    const isParticipant = room.participants.some(
      (p) => p.userId._id.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        error: 'You must join this room before retrieving details'
      });
    }

    res.status(200).json({
      success: true,
      room
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Start auction inside a room (Admin only)
 * @route   POST /api/rooms/:code/start
 * @access  Private
 */
const startAuction = async (req, res, next) => {
  try {
    const { code } = req.params;

    const room = await Room.findOne({ code: code.toUpperCase() });

    if (!room) {
      return res.status(404).json({
        success: false,
        error: 'Room not found'
      });
    }

    // Check if requesting user is the admin
    if (room.adminId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Only the room creator (Admin) can start the auction'
      });
    }

    if (room.status !== 'lobby') {
      return res.status(400).json({
        success: false,
        error: `Cannot start auction. Current state is: ${room.status}`
      });
    }

    if (room.items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot start auction: No items inside the room'
      });
    }

    // Update room status
    room.status = 'auction';
    room.currentItemIndex = 0;
    await room.save();

    // Set first item as active, others pending
    const items = await Item.find({ roomId: room._id }).sort({ order: 1 });
    if (items.length > 0) {
      items[0].status = 'active';
      await items[0].save();
    }

    // Trigger real-time timer initialization
    const io = req.app.get('io');
    if (io) {
      timerService.startRoomTimer(io, code);
    }

    res.status(200).json({
      success: true,
      message: 'Auction started successfully',
      status: room.status
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get finalized results for a room
 * @route   GET /api/rooms/:roomId/results
 * @access  Private
 */
const getRoomResults = async (req, res, next) => {
  try {
    const { roomId } = req.params;

    const results = await AuctionResult.findOne({ roomId })
      .populate('winners.userId', 'username email')
      .populate('winners.itemId', 'name startingPrice')
      .populate('totalByUser.userId', 'username email');

    if (!results) {
      return res.status(404).json({
        success: false,
        error: 'Auction results not compiled or room not completed yet'
      });
    }

    res.status(200).json({
      success: true,
      results
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRoom,
  joinRoom,
  getRoomByCode,
  startAuction,
  getRoomResults
};
