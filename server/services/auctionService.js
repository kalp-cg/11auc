/**
 * Validates if a bid is eligible to be placed.
 * Pure function with no side effects.
 *
 * @param {number} bidAmount - The proposed bid amount.
 * @param {number|null} currentHighestBid - The current highest bid (if any).
 * @param {number} startingPrice - The starting price of the active item.
 * @param {number} userWalletBalance - The bidder's wallet balance.
 * @param {string} roomStatus - The current room status ('lobby', 'auction', 'completed').
 * @param {boolean} isRoomPaused - Whether the room auction is paused.
 * @returns {Object} { valid: boolean, error?: string }
 */
const validateBid = (
  bidAmount,
  currentHighestBid,
  startingPrice,
  userWalletBalance,
  roomStatus,
  isRoomPaused
) => {
  if (roomStatus !== 'auction') {
    return { valid: false, error: 'Auction is not active in this room' };
  }

  if (isRoomPaused) {
    return { valid: false, error: 'Auction is currently paused' };
  }

  if (typeof bidAmount !== 'number' || isNaN(bidAmount) || bidAmount <= 0) {
    return { valid: false, error: 'Bid amount must be a positive number' };
  }

  const minRequiredBid = currentHighestBid !== null ? currentHighestBid + 1 : startingPrice;

  if (bidAmount < minRequiredBid) {
    return {
      valid: false,
      error: `Bid must be at least ${minRequiredBid}`
    };
  }

  if (bidAmount > userWalletBalance) {
    return { valid: false, error: 'Insufficient wallet balance' };
  }

  return { valid: true };
};

module.exports = {
  validateBid
};
