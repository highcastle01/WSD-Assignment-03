const express = require('express');
const router = express.Router();
const searchHistoryController = require('../controllers/searchHistoryController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.post('/', searchHistoryController.saveSearch);
router.get('/', searchHistoryController.getMySearchHistory);
router.delete('/:id', searchHistoryController.deleteSearchHistory);
router.delete('/', searchHistoryController.clearAllSearchHistory);

module.exports = router;