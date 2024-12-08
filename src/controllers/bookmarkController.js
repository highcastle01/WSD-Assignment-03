const { Bookmark, Job, Company } = require('../models');

const bookmarkController = {
  async toggleBookmark(req, res) {
    try {
      const { jobId } = req.body;
      const userId = req.user.userId;

      const existing = await Bookmark.findOne({
        where: { userId, jobId }
      });

      if (existing) {
        await existing.destroy();
        return res.json({ message: '북마크가 해제되었습니다.' });
      }

      const bookmark = await Bookmark.create({
        userId,
        jobId
      });

      res.status(201).json({
        message: '북마크가 추가되었습니다.',
        bookmark
      });
    } catch (error) {
      res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },

  async getMyBookmarks(req, res) {
    try {
      const userId = req.user.userId;
      const { page = 1, limit = 20 } = req.query;

      const bookmarks = await Bookmark.findAndCountAll({
        where: { userId },
        include: [{
          model: Job,
          include: [{
            model: Company,
            attributes: ['name', 'logoUrl']
          }]
        }],
        order: [['createdAt', 'DESC']],
        offset: (page - 1) * limit,
        limit: parseInt(limit)
      });

      res.json({
        bookmarks: bookmarks.rows,
        total: bookmarks.count,
        currentPage: parseInt(page),
        totalPages: Math.ceil(bookmarks.count / limit)
      });
    } catch (error) {
      res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },

  async checkBookmark(req, res) {
    try {
      const { jobId } = req.params;
      const userId = req.user.userId;

      const bookmark = await Bookmark.findOne({
        where: { userId, jobId }
      });

      res.json({
        isBookmarked: !!bookmark
      });
    } catch (error) {
      res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  }
};

module.exports = bookmarkController;