const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companyController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);
router.get('/', companyController.getAllCompanies);
router.get('/:id', companyController.getCompanyById);
router.post('/create', companyController.createCompany);
router.put('/modify/:id', companyController.updateCompany);
router.delete('/delete/:id', companyController.deleteCompany);

module.exports = router;