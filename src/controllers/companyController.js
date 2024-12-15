const { Company, Job } = require('../models');
const { Op } = require('sequelize');
const searchHistoryController = require('./searchHistoryController');

const companyController = {
  // 회사 추가
  async createCompany(req, res) {
    try {
      const { name, industry, size, location, employeeCount, foundedYear, companyUrl } = req.body;

      if (!name || !location) {
        return res.status(400).json({ message: '회사명과 위치는 필수 입력 항목입니다.' });
      }

      const existingCompany = await Company.findOne({ where: { name } });
      if (existingCompany) {
        return res.status(400).json({ message: '이미 등록된 회사입니다.' });
      }

      if (!Company.rawAttributes.location.values.includes(location)) {
        return res.status(400).json({ message: '유효하지 않은 위치입니다.' });
      }

      const company = await Company.create({
        name,
        industry,
        size,
        location,
        employeeCount,
        foundedYear,
        companyUrl
      });

      res.status(201).json({ message: '회사가 등록되었습니다.', company });
    } catch (error) {
      console.error('Create company error:', error);
      res.status(500).json({ message: '서버 오류가 발생했습니다.', error: error.message });
    }
  },

  // 회사 전체 조회
  async getAllCompanies(req, res) {
    try {
      const { page = 1, limit = 10, keyword, industry, sortBy = 'createdAt', order = 'DESC' } = req.query;

      if (!req.user?.userId) {
        return res.status(401).json({ message: '인증이 필요합니다.' });
      }

      const where = {};
      if (keyword) {
        where[Op.or] = [
          { name: { [Op.like]: `%${keyword}%` } },
          { industry: { [Op.like]: `%${keyword}%` } }
        ];
      }
      if (industry) {
        where.industry = industry;
      }

      const companies = await Company.findAndCountAll({
        where,
        include: [
          { model: Job, as: 'jobs', attributes: ['id'], required: false }
        ],
        order: [[sortBy, order]],
        offset: (page - 1) * limit,
        limit: parseInt(limit),
        distinct: true
      });

      try {
        await searchHistoryController.saveSearch({
          body: {
            keyword: keyword || '',
            filters: { industry, page, limit, sortBy, order, resultCount: companies.rows.length, firstResultId: companies.rows[0]?.id || null }
          },
          user: req.user
        }, { status: () => ({ json: () => {} }) });
      } catch (saveError) {
        console.error('검색 기록 저장 실패:', saveError);
      }

      const companiesWithStats = companies.rows.map(company => ({
        ...company.toJSON(),
        jobCount: company.jobs.length
      }));

      res.json({
        companies: companiesWithStats,
        total: companies.count,
        currentPage: parseInt(page),
        totalPages: Math.ceil(companies.count / limit),
        filters: { keyword, industry, sortBy, order }
      });
    } catch (error) {
      console.error('getAllCompanies 에러:', error);
      res.status(500).json({ message: '서버 오류가 발생했습니다.', error: error.message });
    }
  },

  // 회사 단일 조회
  async getCompanyById(req, res) {
    try {
      const { id } = req.params;

      const company = await Company.findOne({
        where: { id },
        include: [
          { model: Job, as: 'jobs', required: false }
        ]
      });

      if (!company) {
        return res.status(404).json({ message: '회사를 찾을 수 없습니다.' });
      }

      const stats = {
        jobCount: company.jobs.length
      };

      res.json({ company: { ...company.toJSON(), stats } });
    } catch (error) {
      console.error('Get company error:', error);
      res.status(500).json({ message: '서버 오류가 발생했습니다.', error: error.message });
    }
  },

  // 회사 정보 수정
  async updateCompany(req, res) {
    try {
      const { id } = req.params;
      const { name, industry, size, location, employeeCount, foundedYear, companyUrl } = req.body;

      const company = await Company.findByPk(id);
      if (!company) {
        return res.status(404).json({ message: '회사를 찾을 수 없습니다.' });
      }

      if (name && name !== company.name) {
        const existingCompany = await Company.findOne({ where: { name } });
        if (existingCompany) {
          return res.status(400).json({ message: '이미 존재하는 회사명입니다.' });
        }
      }

      if (location && !Company.rawAttributes.location.values.includes(location)) {
        return res.status(400).json({ message: '유효하지 않은 위치입니다.' });
      }

      await company.update({
        name,
        industry,
        size,
        location,
        employeeCount,
        foundedYear,
        companyUrl
      });

      res.json({ message: '회사 정보가 수정되었습니다.', company });
    } catch (error) {
      console.error('Update company error:', error);
      res.status(500).json({ message: '서버 오류가 발생했습니다.', error: error.message });
    }
  },

  // 회사 삭제
  async deleteCompany(req, res) {
    try {
      const { id } = req.params;

      const company = await Company.findByPk(id);
      if (!company) {
        return res.status(404).json({ message: '회사를 찾을 수 없습니다.' });
      }

      await company.destroy();

      res.json({ message: '회사가 삭제되었습니다.' });
    } catch (error) {
      console.error('Delete company error:', error);
      res.status(500).json({ message: '서버 오류가 발생했습니다.', error: error.message });
    }
  }
};

module.exports = companyController;
