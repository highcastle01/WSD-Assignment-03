const express = require('express');
const router = express.Router();
const companyReviewController = require('../controllers/companyReviewController');
const authMiddleware = require('../middleware/auth');

//인증 미들웨어 적용
router.use(authMiddleware);

//기업 리뷰 생성
router.post('/', companyReviewController.createReview);

//전체 조회
router.get('/', companyReviewController.getAllReviews);

//기업 리뷰 조회 (검색 기록 저장)
router.get('/company/:companyId', companyReviewController.getCompanyReviews);

//사용자 본인의 리뷰 조회
router.get('/me', companyReviewController.getMyReviews);

//리뷰 수정
router.put('/:id', companyReviewController.updateReview);

//리뷰 삭제
router.delete('/:id', companyReviewController.deleteReview);

module.exports = router;
