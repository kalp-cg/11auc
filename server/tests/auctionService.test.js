const { validateBid } = require('../services/auctionService');

describe('validateBid Unit Tests', () => {
  test('should reject bid if room is not in auction phase', () => {
    const result = validateBid(150, null, 100, 1000, 'lobby', false);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Auction is not active in this room');
  });

  test('should reject bid if room is paused', () => {
    const result = validateBid(150, null, 100, 1000, 'auction', true);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Auction is currently paused');
  });

  test('should reject invalid numbers', () => {
    const result = validateBid('abc', null, 100, 1000, 'auction', false);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Bid amount must be a positive number');
  });

  test('should reject bid below starting price when no previous bid exists', () => {
    const result = validateBid(80, null, 100, 1000, 'auction', false);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Bid must be at least 100');
  });

  test('should reject bid equal to or below current highest bid', () => {
    const result = validateBid(150, 150, 100, 1000, 'auction', false);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Bid must be at least 151');
  });

  test('should reject bid exceeding wallet balance', () => {
    const result = validateBid(1200, 150, 100, 1000, 'auction', false);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Insufficient wallet balance');
  });

  test('should accept valid bid', () => {
    const result = validateBid(200, 150, 100, 1000, 'auction', false);
    expect(result.valid).toBe(true);
  });
});
