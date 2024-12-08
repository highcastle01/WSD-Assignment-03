const { CompanyReview, User, Company } = require('../models');
const { Op } = require('sequelize');

const companyReviewController = {
  async createReview(req, res) {
    try {
      const {
        companyId,
        rating,
        title,
        content,
        pros,
        cons,
        workPeriod,
        position,
        isCurrentEmployee
      } = req.body;
      const userId = req.user.userId;

      // 이전 리뷰 확인 (동일 회사에 대한)
      const existingReview = await CompanyReview.findOne({
        where: { userId, companyId }
      });

      if (existingReview) {
        return res.status(400).json({ message: '이미 이 회사에 대한 리뷰를 작성하셨습니다.' });
      }

      const review = await CompanyReview.create({
        userId,
        companyId,
        rating,
        title,
        content,
        pros,
        cons,
        workPeriod,
        position,
        isCurrentEmployee
      });

      res.status(201).json({
        message: '기업 리뷰가 등록되었습니다.',
        review
      });
    } catch (error) {
      res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },

  async getCompanyReviews(req, res) {
    try {
      const { companyId } = req.params;
      const { page = 1, limit = 10, sortBy = 'createdAt', order = 'DESC' } = req.query;

      const reviews = await CompanyReview.findAndCountAll({
        where: { companyId },
        include: [{
          model: User,
          attributes: ['id', 'name']
        }],
        order: [[sortBy, order]],
        offset: (page - 1) * limit,
        limit: parseInt(limit)
      });

      // 리뷰 통계
      const stats = await CompanyReview.findOne({
        where: { companyId },
        attributes: [
          [sequelize.fn('AVG', sequelize.col('rating')), 'averageRating'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'totalReviews']
        ]
      });

      res.json({
        reviews: reviews.rows,
        total: reviews.count,
        currentPage: parseInt(page),
        totalPages: Math.ceil(reviews.count / limit),
        statistics: {
          averageRating: parseFloat(stats.get('averageRating')).toFixed(1),
          totalReviews: parseInt(stats.get('totalReviews'))
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
        rating,
        title,
        content,
        pros,
        cons,
        workPeriod,
        position,
        isCurrentEmployee
      } = req.body;
      const userId = req.user.userId;

      const review = await CompanyReview.findOne({
        where: { id, userId }
      });

      if (!review) {
        return res.status(404).json({ message: '리뷰를 찾을 수 없습니다.' });
      }

      await review.update({
        rating,
        title,
        content,
        pros,
        cons,
        workPeriod,
        position,
        isCurrentEmployee
      });

      res.json({
        message: '리뷰가 수정되었습니다.',
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

      const review = await CompanyReview.findOne({
        where: { id, userId }
      });

      if (!review) {
        return res.status(404).json({ message: '리뷰를 찾을 수 없습니다.' });
      }

      await review.destroy();

      res.json({ message: '리뷰가 삭제되었습니다.' });
    } catch (error) {
      res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },

  async getMyReviews(req, res) {
    try {
      const userId = req.user.userId;
      const { page = 1, limit = 10 } = req.query;

      const reviews = await CompanyReview.findAndCountAll({
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

module.exports = companyReviewController;