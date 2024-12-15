const { CompanyReview, User, Company } = require('../models');
const { Op } = require('sequelize');
const searchHistoryController = require('./searchHistoryController');

const companyReviewController = {
  // 리뷰 생성
  async createReview(req, res) {
    try {
      const {
        companyId,
        field,
        companyName,
        department,
        writer,
        title,
        content,
        pros,
        cons,
        workPeriod,
        position,
        isCurrentEmployee
      } = req.body;
      const userId = req.user.userId;
  
      // 필수 필드 검증
      if (!companyId || !field || !companyName || !department || !writer) {
        return res.status(400).json({
          message: '필수 필드가 누락되었습니다.',
          missingFields: [
            !companyId && 'companyId',
            !field && 'field',
            !companyName && 'companyName',
            !department && 'department',
            !writer && 'writer'
          ].filter(Boolean)
        });
      }
  
      const existingReview = await CompanyReview.findOne({
        where: { userId, companyId }
      });
  
      if (existingReview) {
        return res.status(400).json({ message: '이미 이 회사에 대한 리뷰를 작성하셨습니다.' });
      }
  
      const review = await CompanyReview.create({
        userId,
        companyId,
        field,
        companyName,
        department,
        writer,
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
      console.error('리뷰 생성 중 오류 발생:', error);
      res.status(500).json({ message: '서버 오류가 발생했습니다.', error: error.message });
    }
  },

  //전체조회
  async getAllReviews(req, res) {
    try {
      const { page = 1, limit = 10, sortBy = 'createdAt', order = 'DESC', keyword } = req.query;

      const where = {};

      // 키워드 검색 조건 추가
      if (keyword) {
        where[Op.or] = [
          { title: { [Op.like]: `%${keyword}%` } },
          { content: { [Op.like]: `%${keyword}%` } }
        ];
      }

      const reviews = await CompanyReview.findAndCountAll({
        where,
        include: [
          {
            model: User,
            attributes: ['id', 'name']
          },
          {
            model: Company,
            attributes: ['id', 'name']
          }
        ],
        order: [[sortBy, order]],
        offset: (page - 1) * limit,
        limit: parseInt(limit)
      });

      // 검색 기록 저장 (로그인된 사용자만)
      if (req.user?.userId) {
        try {
          const searchData = {
            keyword: keyword || '',
            filters: { page, limit, sortBy, order },
            resultCount: reviews.count,
          };

          const saveResult = await searchHistoryController.saveSearch(
            {
              body: searchData,
              user: req.user,
            },
            {
              status: () => ({
                json: () => {},
              }),
            }
          );
          console.log('검색 기록 저장 성공:', saveResult);
        } catch (saveError) {
          console.error('검색 기록 저장 실패:', saveError);
        }
      }

      res.json({
        reviews: reviews.rows,
        total: reviews.count,
        currentPage: parseInt(page),
        totalPages: Math.ceil(reviews.count / limit)
      });
    } catch (error) {
      console.error('전체 리뷰 조회 중 오류 발생:', error);
      res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },

  // 특정 회사의 리뷰 목록 조회
  async getCompanyReviews(req, res) {
    try {
      const { companyId } = req.params;
      const { page = 1, limit = 10, sortBy = 'createdAt', order = 'DESC', keyword } = req.query;
      
      const where = { companyId };

      // 키워드 검색 추가
      if (keyword) {
        where.title = { [Op.like]: `%${keyword}%` }; // 제목에 키워드 검색
      }

      const reviews = await CompanyReview.findAndCountAll({
        where,
        include: [{
          model: User,
          attributes: ['id', 'name']
        }],
        order: [[sortBy, order]],
        offset: (page - 1) * limit,
        limit: parseInt(limit)
      });

      // 검색 기록 저장 (로그인된 사용자만)
      if (req.user?.userId) {
        try {
          const searchData = {
            keyword: keyword || '',
            filters: { companyId, page, limit, sortBy, order },
            resultCount: reviews.count,
          };

          const saveResult = await searchHistoryController.saveSearch(
            {
              body: searchData,
              user: req.user,
            },
            {
              status: () => ({
                json: () => {},
              }),
            }
          );
          console.log('검색 기록 저장 성공:', saveResult);
        } catch (saveError) {
          console.error('검색 기록 저장 실패:', saveError);
        }
      }

      res.json({
        reviews: reviews.rows,
        total: reviews.count,
        currentPage: parseInt(page),
        totalPages: Math.ceil(reviews.count / limit),
      });
    } catch (error) {
      console.error('회사 리뷰 조회 중 오류 발생:', error);
      res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },

  // 리뷰 수정
  async updateReview(req, res) {
    try {
      const { id } = req.params;
      const {
        field,
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
        field,
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
      console.error('리뷰 수정 중 오류 발생:', error);
      res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },

  // 리뷰 삭제
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
      console.error('리뷰 삭제 중 오류 발생:', error);
      res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },

  // 유저의 리뷰 목록 조회
  async getMyReviews(req, res) {
    try {
      const userId = req.user.userId;
      const { page = 1, limit = 10 } = req.query;

      const reviews = await CompanyReview.findAndCountAll({
        where: { userId },
        include: [{
          model: Company,
          attributes: ['id', 'name']
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
      console.error('유저 리뷰 조회 중 오류 발생:', error);
      res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  }
};

module.exports = companyReviewController;
