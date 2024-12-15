const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/applicationController');
const authMiddleware = require('../middleware/auth');

// 모든 라우트에 인증 미들웨어 적용
router.use(authMiddleware);

// 지원서 제출
router.post('/', applicationController.apply);

// 내 지원 목록 조회
router.get('/', applicationController.getMyApplications);

// 지원서 상세 조회
router.get('/:id', applicationController.getApplicationDetail);

// 지원 취소
router.delete('/:id', applicationController.deleteApplication);

// 지원 상태 업데이트
router.put('/:id/status', applicationController.updateApplicationStatus);

// 지원서 업데이트
router.put('/:id', applicationController.updateApplication);

module.exports = router;