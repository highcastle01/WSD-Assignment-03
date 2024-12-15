const { InterviewReview, User, Company, Interview } = require('../models');
const { Op } = require('sequelize');

const interviewReviewController = {
  async createReview(req, res) {
    try {
      const {
        companyId,
        companyName,
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
  
      const review = await InterviewReview.create({
        userId,
        companyId,
        companyName,
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
      console.log(`Error: ${error}`);
      res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },

  async getCompanyReviews(req, res) {
    try {
      const { companyId } = req.params;
      const { page = 1, limit = 10, position } = req.query;

      const where = { companyId }; // 기본 조건
      if (position) {
        where.position = { [Op.like]: `%${position}%` }; // 직무 필터
      }

      const offset = (page - 1) * limit; // 페이지 계산
      const reviews = await InterviewReview.findAndCountAll({
        where,
        include: [
          {
            model: User,
            attributes: ['id', 'name'] // 사용자 정보 포함
          }
        ],
        order: [['createdAt', 'DESC']], // 최신순 정렬
        offset,
        limit: parseInt(limit, 10) // 한 페이지당 리뷰 수
      });

      // 통계 계산
      const stats = await InterviewReview.findOne({
        where: { companyId },
        attributes: [
          [sequelize.fn('AVG', sequelize.col('difficulty')), 'averageDifficulty'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'totalReviews'],
          [sequelize.fn('COUNT', sequelize.literal("CASE WHEN result = '합격' THEN 1 END")), 'acceptedCount']
        ]
      });

      res.json({
        reviews: reviews.rows,
        total: reviews.count,
        currentPage: parseInt(page, 10),
        totalPages: Math.ceil(reviews.count / limit),
        statistics: {
          averageDifficulty: parseFloat(stats?.get('averageDifficulty') || 0).toFixed(1),
          totalReviews: parseInt(stats?.get('totalReviews') || 0, 10),
          acceptanceRate: stats && stats.get('totalReviews') > 0
            ? ((stats.get('acceptedCount') / stats.get('totalReviews')) * 100).toFixed(1)
            : 0
        }
      });
    } catch (error) {
      console.error('Error in getCompanyReviews:', error);
      res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },

  // 면접 리뷰 업데이트
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

      // 리뷰 찾기
      const review = await InterviewReview.findOne({
        where: { id, userId }
      });

      if (!review) {
        return res.status(404).json({ message: '면접 후기를 찾을 수 없습니다.' });
      }

      // 리뷰 업데이트
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
      console.error('Error in updateReview:', error);
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

  async getAllReviews(req, res) {
    try {
      const { page = 1, limit = 10, companyId, position, difficulty, result } = req.query;
      const userId = req.user?.userId; // 로그인한 사용자 ID

      const where = {};
      if (companyId) where.companyId = companyId; // 회사 ID 필터링
      if (position) where.position = { [Op.like]: `%${position}%` }; // 직무 필터링
      if (difficulty) where.difficulty = difficulty; // 난이도 필터링
      if (result) where.result = result; // 결과 필터링

      const offset = (page - 1) * limit;

      const reviews = await InterviewReview.findAndCountAll({
        where,
        include: [
          {
            model: Company,
            attributes: ['id', 'name'] // 회사 정보
          },
          {
            model: User,
            attributes: ['id', 'name'] // 사용자 정보
          }
        ],
        order: [['createdAt', 'DESC']], // 최신순 정렬
        offset,
        limit: parseInt(limit, 10) // 페이지당 리뷰 수
      });

      // 검색 기록 저장
      if (userId) {
        try {
          const saveResult = await searchHistoryController.saveSearch(
            {
              body: {
                keyword: '전체 면접 후기 조회',
                filters: {
                  page,
                  limit,
                  companyId,
                  position,
                  difficulty,
                  result,
                  resultCount: reviews.rows.length,
                  firstResultId: reviews.rows[0]?.id || null
                }
              },
              user: req.user
            },
            { status: () => ({ json: () => {} }) }
          );
          console.log('검색 기록 저장 성공:', saveResult);
        } catch (saveError) {
          console.error('검색 기록 저장 실패:', saveError);
        }
      }

      res.json({
        reviews: reviews.rows,
        total: reviews.count,
        currentPage: parseInt(page, 10),
        totalPages: Math.ceil(reviews.count / limit)
      });
    } catch (error) {
      console.error('전체 리뷰 조회 중 오류:', error);
      res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  }
};

module.exports = interviewReviewController;