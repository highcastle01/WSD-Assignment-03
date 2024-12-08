const { InterviewReview, User, Company, Interview } = require('../models');
const { Op } = require('sequelize');

const interviewReviewController = {
  async createReview(req, res) {
    try {
      const {
        companyId,
        interviewId,
        difficulty,
        result,
        position,
        date,
        process,
        questions,
        content,
        tips
      } = req.body;
      const userId = req.user.userId;

      // 이전 리뷰 확인
      if (interviewId) {
        const existingReview = await InterviewReview.findOne({
          where: { interviewId }
        });

        if (existingReview) {
          return res.status(400).json({ message: '이미 이 면접에 대한 후기가 존재합니다.' });
        }
      }

      const review = await InterviewReview.create({
        userId,
        companyId,
        interviewId,
        difficulty,
        result,
        position,
        date,
        process,
        questions,
        content,
        tips
      });

      res.status(201).json({
        message: '면접 후기가 등록되었습니다.',
        review
      });
    } catch (error) {
      res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },

  async getCompanyReviews(req, res) {
    try {
      const { companyId } = req.params;
      const { page = 1, limit = 10, position } = req.query;

      const where = { companyId };
      if (position) {
        where.position = position;
      }

      const reviews = await InterviewReview.findAndCountAll({
        where,
        include: [{
          model: User,
          attributes: ['id', 'name']
        }],
        order: [['date', 'DESC']],
        offset: (page - 1) * limit,
        limit: parseInt(limit)
      });

      // 통계 정보
      const stats = await InterviewReview.findOne({
        where: { companyId },
        attributes: [
          [sequelize.fn('AVG', sequelize.col('difficulty')), 'averageDifficulty'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'totalReviews'],
          [sequelize.fn('COUNT', sequelize.literal("CASE WHEN result = 'ACCEPTED' THEN 1 END")), 'acceptedCount']
        ]
      });

      res.json({
        reviews: reviews.rows,
        total: reviews.count,
        currentPage: parseInt(page),
        totalPages: Math.ceil(reviews.count / limit),
        statistics: {
          averageDifficulty: parseFloat(stats.get('averageDifficulty')).toFixed(1),
          totalReviews: parseInt(stats.get('totalReviews')),
          acceptanceRate: (parseInt(stats.get('acceptedCount')) / parseInt(stats.get('totalReviews')) * 100).toFixed(1)
        }
      });
    } catch (error) {
      res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },

  async updateReview(req, res) {
    try {
      const { id } = req.params;
      const {
        difficulty,
        result,
        position,
        process,
        questions,
        content,
        tips
      } = req.body;
      const userId = req.user.userId;

      const review = await InterviewReview.findOne({
        where: { id, userId }
      });

      if (!review) {
        return res.status(404).json({ message: '면접 후기를 찾을 수 없습니다.' });
      }

      await review.update({
        difficulty,
        result,
        position,
        process,
        questions,
        content,
        tips
      });

      res.json({
        message: '면접 후기가 수정되었습니다.',
        review
      });
    } catch (error) {
      res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },

  async deleteReview(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      const review = await InterviewReview.findOne({
        where: { id, userId }
      });

      if (!review) {
        return res.status(404).json({ message: '면접 후기를 찾을 수 없습니다.' });
      }

      await review.destroy();

      res.json({ message: '면접 후기가 삭제되었습니다.' });
    } catch (error) {
      res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },

  async getMyReviews(req, res) {
    try {
      const userId = req.user.userId;
      const { page = 1, limit = 10 } = req.query;

      const reviews = await InterviewReview.findAndCountAll({
        where: { userId },
        include: [{
          model: Company,
          attributes: ['id', 'name', 'logoUrl']
        }],
        order: [['createdAt', 'DESC']],
        offset: (page - 1) * limit,
        limit: parseInt(limit)
      });

      res.json({
        reviews: reviews.rows,
        total: reviews.count,
        currentPage: parseInt(page),
        totalPages: Math.ceil(reviews.count / limit)
      });
    } catch (error) {
      res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  }
};

module.exports = interviewReviewController;