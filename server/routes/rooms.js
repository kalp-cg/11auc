const express = require('express');
const {
  createRoom,
  joinRoom,
  getRoomByCode,
  startAuction,
  getRoomResults
} = require('../controllers/roomController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, createRoom);
router.post('/join', protect, joinRoom);
router.get('/:code', protect, getRoomByCode);
router.post('/:code/start', protect, startAuction);
router.get('/:roomId/results', protect, getRoomResults);

module.exports = router;
