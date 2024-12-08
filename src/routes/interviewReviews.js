const express = require('express');
const router = express.Router();
const interviewReviewController = require('../controllers/interviewReviewController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.post('/', interviewReviewController.createReview);
router.get('/company/:companyId', interviewReviewController.getCompanyReviews);
router.get('/me', interviewReviewController.getMyReviews);
router.put('/:id', interviewReviewController.updateReview);
router.delete('/:id', interviewReviewController.deleteReview);

module.exports = router;