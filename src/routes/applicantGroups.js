const express = require('express');
const router = express.Router();
const applicantGroupController = require('../controllers/applicantGroupController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.post('/', applicantGroupController.createGroup);
router.get('/company/:companyId', applicantGroupController.getCompanyGroups);
router.post('/:groupId/applicants', applicantGroupController.addApplicantsToGroup);
router.get('/:groupId/statistics', applicantGroupController.getGroupStatistics);

module.exports = router;