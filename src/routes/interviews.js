const express = require('express');
const router = express.Router();
const interviewController = require('../controllers/interviewController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.post('/', interviewController.scheduleInterview);
router.get('/me', interviewController.getMyInterviews);
router.get('/company/:companyId', interviewController.getCompanyInterviews);
router.patch('/:id/status', interviewController.updateInterviewStatus);
router.put('/:id/reschedule', interviewController.rescheduleInterview);

module.exports = router;