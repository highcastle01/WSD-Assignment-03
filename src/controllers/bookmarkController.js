const { Bookmark, Job, Company } = require('../models');
const jobController = require('./jobController');
const companyController = require('./companyController');

const bookmarkController = {
  async toggleBookmark(req, res) {
    try {
      const { targetType, targetId } = req.body;
      const userId = req.user.userId;

      if (!['job', 'company'].includes(targetType)) {
        return res.status(400).json({ message: '잘못된 북마크 대상입니다.' });
      }

      let target;
      if (targetType === 'job') {
        target = await Job.findByPk(targetId);
      } else {
        target = await Company.findByPk(targetId);
      }

      if (!target) {
        return res.status(404).json({ message: '북마크 대상을 찾을 수 없습니다.' });
      }

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
      if (type && ['job', 'company'].includes(type)) {
        where.targetType = type;
      }

      // 먼저 북마크 목록을 가져옴
      const bookmarks = await Bookmark.findAll({
        where,
        order: [['createdAt', 'DESC']],
        offset: (page - 1) * limit,
        limit: parseInt(limit)
      });

      // 북마크된 항목들의 상세 정보를 가져옴
      const detailedBookmarks = await Promise.all(
        bookmarks.map(async (bookmark) => {
          const base = {
            id: bookmark.id,
            targetType: bookmark.targetType,
            targetId: bookmark.targetId,
            createdAt: bookmark.createdAt
          };

          if (bookmark.targetType === 'job') {
            const job = await Job.findOne({
              where: { id: bookmark.targetId },
              include: [{
                model: Company,
                as: 'company',
                attributes: ['id', 'name', 'industry', 'size', 'location']
              }]
            });
            return { ...base, job, company: job?.company };
          } else {
            const company = await Company.findOne({
              where: { id: bookmark.targetId },
              include: [
                { model: Job, as: 'jobs', required: false }
              ]
            });
            return {
              ...base,
              company: company ? {
                ...company.toJSON(),
                stats: { jobCount: company.jobs?.length || 0 }
              } : null
            };
          }
        })
      );

      // 전체 북마크 수 계산
      const total = await Bookmark.count({ where });

      res.json({
        bookmarks: detailedBookmarks,
        total,
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit)
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

      if (!['job', 'company'].includes(targetType)) {
        return res.status(400).json({ message: '잘못된 북마크 대상입니다.' });
      }

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