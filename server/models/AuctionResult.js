const mongoose = require('mongoose');

const auctionResultSchema = new mongoose.Schema(
  {
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
      unique: true
    },
    winners: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true
        },
        itemId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Item',
          required: true
        },
        amount: {
          type: Number,
          required: true
        }
      }
    ],
    totalByUser: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true
        },
        total: {
          type: Number,
          required: true
        }
      }
    ],
    completedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('AuctionResult', auctionResultSchema);
