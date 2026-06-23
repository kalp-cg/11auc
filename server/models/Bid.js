const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema({
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: [true, 'Bid amount is required'],
    min: [0, 'Bid amount cannot be negative']
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Optional index for faster query on recent bids
bidSchema.index({ itemId: 1, amount: -1 });

module.exports = mongoose.model('Bid', bidSchema);
