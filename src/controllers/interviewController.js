const { Interview, User, Company, Application } = require('../models');
const { Op } = require('sequelize');

const interviewController = {
  async scheduleInterview(req, res) {
    try {
      const {
        applicationId,
        scheduleDate,
        type,
        location,
        interviewLink,
        notes
      } = req.body;

      // 지원서 확인
      const application = await Application.findByPk(applicationId);
      if (!application) {
        return res.status(404).json({ message: '지원 정보를 찾을 수 없습니다.' });
      }

      const interview = await Interview.create({
        applicationId,
        companyId: application.Job.companyId,
        userId: application.userId,
        scheduleDate,
        type,
        location,
        interviewLink,
        notes,
        status: 'SCHEDULED'
      });

      // 지원서 상태 업데이트
      await application.update({ status: 'INTERVIEW_SCHEDULED' });

      res.status(201).json({
        message: '면접이 예약되었습니다.',
        interview
      });
    } catch (error) {
      res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },

  async getMyInterviews(req, res) {
    try {
      const userId = req.user.userId;
      const { status, page = 1, limit = 10 } = req.query;

      const where = { userId };
      if (status) {
        where.status = status;
      }

      const interviews = await Interview.findAndCountAll({
        where,
        include: [{
          model: Company,
          attributes: ['name', 'logoUrl']
        }],
        order: [['scheduleDate', 'ASC']],
        offset: (page - 1) * limit,
        limit: parseInt(limit)
      });

      res.json({
        interviews: interviews.rows,
        total: interviews.count,
        currentPage: parseInt(page),
        totalPages: Math.ceil(interviews.count / limit)
      });
    } catch (error) {
      res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },

  async getCompanyInterviews(req, res) {
    try {
      const { companyId } = req.params;
      const { status, date } = req.query;

      // 회사 관리자 권한 확인 로직 필요

      const where = { companyId };
      if (status) {
        where.status = status;
      }
      if (date) {
        where.scheduleDate = {
          [Op.gte]: new Date(date),
          [Op.lt]: new Date(new Date(date).setDate(new Date(date).getDate() + 1))
        };
      }

      const interviews = await Interview.findAll({
        where,
        include: [{
          model: User,
          attributes: ['name', 'email']
        }],
        order: [['scheduleDate', 'ASC']]
      });

      res.json(interviews);
    } catch (error) {
      res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },

  async updateInterviewStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;
      const userId = req.user.userId;

      const interview = await Interview.findOne({
        where: { id },
        include: [{
          model: Application
        }]
      });

      if (!interview) {
        return res.status(404).json({ message: '면접 정보를 찾을 수 없습니다.' });
      }

      // 권한 확인 (지원자 또는 회사 관리자)
      if (interview.userId !== userId) {
        // 회사 관리자 권한 확인 로직 필요
        return res.status(403).json({ message: '권한이 없습니다.' });
      }

      await interview.update({ status, notes });

      // 면접 완료시 지원서 상태 업데이트
      if (status === 'COMPLETED') {
        await interview.Application.update({ status: 'REVIEWING' });
      }

      res.json({
        message: '면접 상태가 업데이트되었습니다.',
        interview
      });
    } catch (error) {
      res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },

  async rescheduleInterview(req, res) {
    try {
      const { id } = req.params;
      const { scheduleDate, type, location, interviewLink } = req.body;
      const userId = req.user.userId;

      const interview = await Interview.findOne({
        where: { id }
      });

      if (!interview) {
        return res.status(404).json({ message: '면접 정보를 찾을 수 없습니다.' });
      }

      await interview.update({
        scheduleDate,
        type,
        location,
        interviewLink,
        status: 'RESCHEDULED'
      });

      res.json({
        message: '면접 일정이 변경되었습니다.',
        interview
      });
    } catch (error) {
      res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  }
};

module.exports = interviewController;