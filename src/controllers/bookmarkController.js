const { Bookmark, Job, Company } = require('../models');

const bookmarkController = {
  async toggleBookmark(req, res) {
    try {
      const { targetType, targetId } = req.body;
      const userId = req.user.userId;

      // targetType 검증
      if (!['job', 'company'].includes(targetType)) {
        return res.status(400).json({ message: '잘못된 북마크 대상입니다.' });
      }

      // 대상 존재 여부 확인
      let target;
      if (targetType === 'job') {
        target = await Job.findByPk(targetId);
      } else if (targetType === 'company') {
        target = await Company.findByPk(targetId);
      }

      if (!target) {
        return res.status(404).json({ message: '북마크 대상을 찾을 수 없습니다.' });
      }

      // 기존 북마크 확인
      const existing = await Bookmark.findOne({
        where: { userId, targetType, targetId }
      });

      if (existing) {
        await existing.destroy();
        return res.json({ message: '북마크가 해제되었습니다.' });
      }

      const bookmark = await Bookmark.create({
        userId,
        targetType,
        targetId
      });

      res.status(201).json({
        message: '북마크가 추가되었습니다.',
        bookmark
      });
    } catch (error) {
      console.error('Bookmark toggle error:', error);
      res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },

  async getMyBookmarks(req, res) {
    try {
      const userId = req.user.userId;
      const { page = 1, limit = 20, type } = req.query;
  
      const where = { userId };
      if (type) {
        where.targetType = type;  // Bookmark 테이블의 targetType 기준
      }
  
      const bookmarks = await Bookmark.findAndCountAll({
        where,
        include: [
          {
            model: Job,
            required: false,
            include: [{
              model: Company,
              as: 'company',
              attributes: ['name', 'logoUrl']
            }]
          },
          {
            model: Company,
            required: false,
            attributes: ['name', 'logoUrl']
          }
        ],
        order: [['createdAt', 'DESC']],
        offset: (page - 1) * limit,
        limit: parseInt(limit)
      });
  
      // 결과 데이터 정리
      const formattedBookmarks = bookmarks.rows.map(bookmark => {
        const data = bookmark.toJSON();
        return {
          id: data.id,
          targetType: data.targetType,
          targetId: data.targetId,
          createdAt: data.createdAt,
          // Job 북마크인 경우
          job: data.targetType === 'job' ? data.Job : null,
          // Company 북마크인 경우
          company: data.targetType === 'company' ? data.Company : 
                  data.targetType === 'job' ? data.Job?.company : null
        };
      });
  
      res.json({
        bookmarks: formattedBookmarks,
        total: bookmarks.count,
        currentPage: parseInt(page),
        totalPages: Math.ceil(bookmarks.count / limit)
      });
    } catch (error) {
      console.error('Get bookmarks error:', error);
      res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },

  async checkBookmark(req, res) {
    try {
      const { targetType, targetId } = req.params;
      const userId = req.user.userId;

      const bookmark = await Bookmark.findOne({
        where: { userId, targetType, targetId }
      });

      res.json({
        isBookmarked: !!bookmark
      });
    } catch (error) {
      console.error('Check bookmark error:', error);
      res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  }
};

module.exports = bookmarkController;