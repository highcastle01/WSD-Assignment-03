const { Application, Job, Company, User } = require('../models');
const { Op } = require('sequelize');

const applicationController = {
  async apply(req, res) {
    try {
      const { jobId, coverLetter } = req.body;
      const userId = req.user.userId;

      if (!jobId) {
        return res.status(400).json({ message: '채용공고 ID는 필수입니다.' });
      }

      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ message: '사용자 정보를 찾을 수 없습니다.' });
      }

      const existingApplication = await Application.findOne({
        where: {
          userId,
          jobId,
          status: { [Op.notIn]: ['WITHDRAWN', '지원취소'] }
        }
      });

      if (existingApplication) {
        return res.status(400).json({
          message: '이미 지원한 공고입니다.',
          applicationId: existingApplication.id,
          appliedAt: existingApplication.appliedAt
        });
      }

      const job = await Job.findOne({
        where: { id: jobId, deadline: { [Op.gt]: new Date() } },
        include: [{ model: Company, as: 'company', attributes: ['name'] }]
      });

      if (!job) {
        return res.status(404).json({ message: '유효한 채용공고를 찾을 수 없습니다.' });
      }

      if (job.deadline < new Date()) {
        return res.status(400).json({
          message: '지원 기한이 마감된 채용공고입니다.',
          deadline: job.deadline
        });
      }

      if (coverLetter && coverLetter.length > 5000) {
        return res.status(400).json({
          message: '자기소개서는 5000자를 초과할 수 없습니다.',
          currentLength: coverLetter.length
        });
      }

      const application = await Application.create({
        userId,
        jobId,
        coverLetter,
        status: '지원완료',
        appliedAt: new Date()
      });

      res.status(201).json({
        message: `${job.company.name}의 채용공고에 지원이 완료되었습니다.`,
        application,
        company: job.company.name,
        jobTitle: job.title
      });
    } catch (error) {
      console.error('Application submission error:', error);
      if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({
          message: '입력값 검증에 실패했습니다.',
          errors: error.errors.map(err => ({ field: err.path, message: err.message }))
        });
      }
      if (error.name === 'SequelizeForeignKeyConstraintError') {
        return res.status(400).json({ message: '유효하지 않은 참조값입니다.' });
      }
      res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },

  async getMyApplications(req, res) {
    try {
      const userId = req.user.userId;
      const { status, page = 1, limit = 10, sortBy = 'appliedAt', order = 'DESC' } = req.query;

      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);

      if (isNaN(pageNum) || pageNum < 1) {
        return res.status(400).json({ message: '유효하지 않은 페이지 번호입니다.' });
      }

      if (isNaN(limitNum) || limitNum < 1 || limitNum > 50) {
        return res.status(400).json({ message: '유효하지 않은 페이지당 항목 수입니다. (1-50)' });
      }

      const allowedSortFields = ['appliedAt', 'status', 'updatedAt'];
      if (!allowedSortFields.includes(sortBy)) {
        return res.status(400).json({
          message: '유효하지 않은 정렬 기준입니다.',
          allowedFields: allowedSortFields
        });
      }

      const where = { userId };
      if (status) {
        const validStatuses = ['지원완료', '서류합격', '최종합격', '불합격', '지원취소'];
        if (!validStatuses.includes(status)) {
          return res.status(400).json({
            message: '유효하지 않은 지원 상태입니다.',
            validStatuses
          });
        }
        where.status = status;
      }

      const applications = await Application.findAndCountAll({
        where,
        include: [{
          model: Job,
          include: [{ model: Company, as: 'company', attributes: ['name'] }]
        }],
        order: [[sortBy, order.toUpperCase()]],
        offset: (pageNum - 1) * limitNum,
        limit: limitNum
      });

      if (applications.count === 0) {
        return res.status(404).json({ message: '지원 내역이 없습니다.' });
      }

      res.json({
        applications: applications.rows,
        total: applications.count,
        currentPage: pageNum,
        totalPages: Math.ceil(applications.count / limitNum),
        limit: limitNum
      });
    } catch (error) {
      console.error('Get applications error:', error);
      res.status(500).json({ message: '지원 내역 조회 중 오류가 발생했습니다.' });
    }
  },

  async getApplicationDetail(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      if (!id || isNaN(id)) {
        return res.status(400).json({ message: '유효하지 않은 지원 ID입니다.' });
      }

      const application = await Application.findOne({
        where: { id, userId },
        include: [{ model: Job, include: [{ model: Company, as: 'company', attributes: ['name'] }] }]
      });

      if (!application) {
        return res.status(404).json({ message: '지원 내역을 찾을 수 없습니다.', applicationId: id });
      }

      res.json(application);
    } catch (error) {
      console.error('Get application detail error:', error);
      res.status(500).json({ message: '지원 내역 상세 조회 중 오류가 발생했습니다.' });
    }
  },

  async deleteApplication(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      if (!id || isNaN(id)) {
        return res.status(400).json({ message: '유효하지 않은 지원 ID입니다.' });
      }

      const application = await Application.findOne({
        where: { id, userId },
        include: [{ model: Job, include: [{ model: Company, as: 'company', attributes: ['name'] }] }]
      });

      if (!application) {
        return res.status(404).json({ message: '지원 내역을 찾을 수 없습니다.', applicationId: id });
      }

      const cancelableStatuses = ['지원완료', '서류검토중'];
      if (!cancelableStatuses.includes(application.status)) {
        return res.status(400).json({
          message: '현재 상태에서는 지원을 취소할 수 없습니다.',
          currentStatus: application.status,
          cancelableStatuses
        });
      }

      const companyName = application.Job.company.name;
      const applicationId = application.id;

      await application.destroy();

      res.json({
        message: `${companyName}의 ${applicationId}번 지원이 취소되었습니다.`,
        companyName,
        applicationId
      });
    } catch (error) {
      console.error('Delete application error:', error);
      res.status(500).json({ message: '지원 취소 중 오류가 발생했습니다.' });
    }
  },

  async updateApplication(req, res) {
    try {
      const { id } = req.params;
      const { coverLetter } = req.body;
      const userId = req.user.userId;
    
      if (!id || isNaN(id)) {
        return res.status(400).json({ message: '유효하지 않은 지원 ID입니다.' });
      }
    
      const application = await Application.findOne({
        where: { id, userId },
        include: [
          {
            model: Job,
            as: 'Job', // alias 설정 확인
            include: [
              {
                model: Company,
                as: 'company', // alias 설정 확인
                attributes: ['name'],
              },
            ],
          },
        ],
      });
    
      if (!application) {
        return res.status(404).json({ message: '지원 내역을 찾을 수 없습니다.', applicationId: id });
      }
    
      const editableStatuses = ['지원완료', '서류검토중'];
      if (!editableStatuses.includes(application.status)) {
        return res.status(400).json({
          message: '현재 상태에서는 지원서를 수정할 수 없습니다.',
          currentStatus: application.status,
          editableStatuses,
        });
      }
    
      if (coverLetter && coverLetter.length > 5000) {
        return res.status(400).json({
          message: '자기소개서는 5000자를 초과할 수 없습니다.',
          currentLength: coverLetter.length,
        });
      }
  
      // Company name validation
      const companyName = application.Job?.Company?.name || '알 수 없음';
  
      await application.update({
        coverLetter: coverLetter || application.coverLetter,
        updatedAt: new Date(),
      });
    
      res.json({
        message: '지원서가 성공적으로 수정되었습니다.',
        application: {
          id: application.id,
          jobTitle: application.Job?.title || '알 수 없음',
          company: companyName,
          coverLetter: application.coverLetter,
          updatedAt: application.updatedAt,
        },
      });
    } catch (error) {
      console.error('Update application error:', error);
      res.status(500).json({ message: '지원서 수정 중 오류가 발생했습니다.' });
    }
  },  

  async updateApplicationStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const userId = req.user.userId;

      if (!id || isNaN(id)) {
        return res.status(400).json({ message: '유효하지 않은 지원 ID입니다.' });
      }

      const validStatuses = ['서류검토중', '서류합격', '면접예정', '최종합격', '불합격'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          message: '유효하지 않은 지원 상태입니다.',
          validStatuses
        });
      }

      const application = await Application.findOne({
        where: { id },
        include: [{ model: Job, include: [{ model: Company, as: 'company', where: { userId: req.user.userId } }] }]
      });

      if (!application) {
        return res.status(404).json({ message: '지원 내역을 찾을 수 없습니다.' });
      }

      if (!application.Job.Company) {
        return res.status(403).json({ message: '해당 채용공고의 상태를 변경할 권한이 없습니다.' });
      }

      await application.update({ status, lastStatusUpdateAt: new Date() });

      res.json({
        message: '지원 상태가 업데이트되었습니다.',
        application: {
          id: application.id,
          previousStatus: application.status,
          newStatus: status,
          updatedAt: new Date()
        }
      });
    } catch (error) {
      console.error('Update application status error:', error);
      if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({
          message: '상태 업데이트 값이 유효하지 않습니다.',
          errors: error.errors.map(err => ({ field: err.path, message: err.message }))
        });
      }
      res.status(500).json({ message: '상태 업데이트 중 오류가 발생했습니다.' });
    }
  }
};

module.exports = applicationController;
