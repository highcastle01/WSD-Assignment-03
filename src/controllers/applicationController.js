const { Application, Job, Company, User } = require('../models');
const { Op } = require('sequelize');

const applicationController = {
  async apply(req, res) {
    try {
      const { jobId, resumeUrl, coverLetter } = req.body;
      const userId = req.user.userId;

      // 중복 지원 체크
      const existingApplication = await Application.findOne({
        where: {
          userId,
          jobId,
          status: {
            [Op.notIn]: ['WITHDRAWN']
          }
        }
      });

      if (existingApplication) {
        return res.status(400).json({ message: '이미 지원한 공고입니다.' });
      }

      // 공고 유효성 체크
      const job = await Job.findOne({
        where: {
          id: jobId,
          status: 'ACTIVE',
          deadline: {
            [Op.gt]: new Date()
          }
        }
      });

      if (!job) {
        return res.status(400).json({ message: '유효하지 않은 채용공고입니다.' });
      }

      const application = await Application.create({
        userId,
        jobId,
        resumeUrl,
        coverLetter,
        status: '지원',
        appliedAt: new Date()
      });

      res.status(201).json({
        message: '지원이 완료되었습니다.',
        application
      });
    } catch (error) {
      res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },

  async getMyApplications(req, res) {
    try {
      const userId = req.user.userId;
      const { status, page = 1, limit = 10 } = req.query;

      const where = { userId };
      if (status) {
        where.status = status;
      }

      const applications = await Application.findAndCountAll({
        where,
        include: [{
          model: Job,
          include: [{
            model: Company,
            as: 'company',
            attributes: ['name', 'logoUrl']
          }]
        }],
        order: [['appliedAt', 'DESC']],
        offset: (page - 1) * limit,
        limit: parseInt(limit)
      });

      res.json({
        applications: applications.rows,
        total: applications.count,
        currentPage: parseInt(page),
        totalPages: Math.ceil(applications.count / limit)
      });
    } catch (error) {
      res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },

  async getAllApplications(req, res) {
      try {
        const userId = req.user.userId;
        const { 
          page = 1, 
          limit = 10,
          status,
          sortBy = 'createdAt',
          order = 'DESC'
        } = req.query;

        const where = { userId };
        
        // 상태 필터링
        if (status) {
          where.status = status;
        }

        const applications = await Application.findAndCountAll({
          where,
          include: [{
            model: Job,
            include: [{
              model: Company,
              as: 'company',
              attributes: ['name', 'logoUrl']
            }]
          }],
          order: [[sortBy, order]],
          limit: parseInt(limit),
          offset: (page - 1) * limit,
        });

        res.json({
          applications: applications.rows,
          total: applications.count,
          currentPage: parseInt(page),
          totalPages: Math.ceil(applications.count / limit)
        });
      } catch (error) {
        console.error('Get applications error:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
      }
  },

  async getApplicationDetail(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      const application = await Application.findOne({
        where: { id, userId },
        include: [{
          model: Job,
          include: [{
            model: Company,
            attributes: ['name', 'logoUrl']
          }]
        }]
      });

      if (!application) {
        return res.status(404).json({ message: '지원 내역을 찾을 수 없습니다.' });
      }

      res.json(application);
    } catch (error) {
      res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },

  async deleteApplication(req, res) {
      try {
        const { id } = req.params;
        const userId = req.user.userId;
  
        // 본인의 지원 내역인지 확인하고, 관련 정보도 함께 조회
        const application = await Application.findOne({
          where: { 
            id,
            userId
          },
          include: [{
            model: Job,
            include: [{
              model: Company,
              as: 'company',
              attributes: ['name']
            }]
          }]
        });
  
        if (!application) {
          return res.status(404).json({ message: '지원 내역을 찾을 수 없습니다.' });
        }
  
        const companyName = application.Job.company.name;
        const applicationId = application.id;
  
        await application.destroy();
  
        res.json({ 
          message: `${companyName}의 ${applicationId}번 지원이 취소되었습니다.` 
        });
      } catch (error) {
        console.error('Delete application error:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
      }
  },

  async updateApplicationStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const userId = req.user.userId;

      // 회사 관리자 권한 확인 로직 필요

      const application = await Application.findByPk(id);
      if (!application) {
        return res.status(404).json({ message: '지원 내역을 찾을 수 없습니다.' });
      }

      await application.update({ 
        status,
        lastStatusUpdateAt: new Date()
      });

      res.json({
        message: '지원 상태가 업데이트되었습니다.',
        application
      });
    } catch (error) {
      res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  }
};

module.exports = applicationController;
