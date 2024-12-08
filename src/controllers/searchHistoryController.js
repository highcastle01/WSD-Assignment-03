const { SearchHistory } = require('../models');
const { Op } = require('sequelize');

const searchHistoryController = {
  async saveSearch(req, res) {
    try {
      const { keyword, filters } = req.body;
      const userId = req.user.userId;

      const searchHistory = await SearchHistory.create({
        userId,
        keyword,
        filters,
        searchedAt: new Date()
      });

      res.status(201).json({
        message: '검색 기록이 저장되었습니다.',
        searchHistory
      });
    } catch (error) {
      res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },

  async getMySearchHistory(req, res) {
    try {
      const userId = req.user.userId;
      const { page = 1, limit = 20 } = req.query;

      const searches = await SearchHistory.findAndCountAll({
        where: { userId },
        order: [['searchedAt', 'DESC']],
        offset: (page - 1) * limit,
        limit: parseInt(limit)
      });

      // 검색 키워드 통계
      const keywordStats = await SearchHistory.findAll({
        where: { userId },
        attributes: [
          'keyword',
          [sequelize.fn('COUNT', sequelize.col('keyword')), 'count']
        ],
        group: ['keyword'],
        order: [[sequelize.fn('COUNT', sequelize.col('keyword')), 'DESC']],
        limit: 5
      });

      res.json({
        searches: searches.rows,
        total: searches.count,
        currentPage: parseInt(page),
        totalPages: Math.ceil(searches.count / limit),
        popularKeywords: keywordStats
      });
    } catch (error) {
      res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },

  async deleteSearchHistory(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      const deleted = await SearchHistory.destroy({
        where: { id, userId }
      });

      if (!deleted) {
        return res.status(404).json({ message: '검색 기록을 찾을 수 없습니다.' });
      }

      res.json({ message: '검색 기록이 삭제되었습니다.' });
    } catch (error) {
      res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },

  async clearAllSearchHistory(req, res) {
    try {
      const userId = req.user.userId;

      await SearchHistory.destroy({
        where: { userId }
      });

      res.json({ message: '모든 검색 기록이 삭제되었습니다.' });
    } catch (error) {
      res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  }
};

module.exports = searchHistoryController;