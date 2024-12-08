const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/applicationController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);  // 모든 지원 관련 API는 인증 필요

router.post('/', applicationController.apply);
router.get('/me', applicationController.getMyApplications);
router.get('/:id', applicationController.getApplicationDetail);
router.delete('/:id', applicationController.withdrawApplication);
router.patch('/:id/status', applicationController.updateApplicationStatus);

module.exports = router;