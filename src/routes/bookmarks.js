const express = require('express');
const router = express.Router();
const bookmarkController = require('../controllers/bookmarkController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.post('/', bookmarkController.toggleBookmark);
router.get('/', bookmarkController.getMyBookmarks);
router.get('/check/:jobId', bookmarkController.checkBookmark);

module.exports = router;