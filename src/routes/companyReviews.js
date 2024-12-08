const express = require('express');
const router = express.Router();
const companyReviewController = require('../controllers/companyReviewController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.post('/', companyReviewController.createReview);
router.get('/company/:companyId', companyReviewController.getCompanyReviews);
router.get('/me', companyReviewController.getMyReviews);
router.put('/:id', companyReviewController.updateReview);
router.delete('/:id', companyReviewController.deleteReview);

module.exports = router;