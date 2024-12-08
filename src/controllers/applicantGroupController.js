const { ApplicantGroup, Application, User, Company } = require('../models');
const { Op } = require('sequelize');

const applicantGroupController = {
  async createGroup(req, res) {
    try {
      const { companyId, name, description } = req.body;

      const group = await ApplicantGroup.create({
        companyId,
        name,
        description
      });

      res.status(201).json({
        message: '지원자 그룹이 생성되었습니다.',
        group
      });
    } catch (error) {
      res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },

  async getCompanyGroups(req, res) {
    try {
      const { companyId } = req.params;
      const { page = 1, limit = 10 } = req.query;

      const groups = await ApplicantGroup.findAndCountAll({
        where: { companyId },
        include: [{
          model: Application,
          include: [{
            model: User,
            attributes: ['id', 'name', 'email', 'career']
          }]
        }],
        order: [['createdAt', 'DESC']],
        offset: (page - 1) * limit,
        limit: parseInt(limit)
      });

      res.json({
        groups: groups.rows,
        total: groups.count,
        currentPage: parseInt(page),
        totalPages: Math.ceil(groups.count / limit)
      });
    } catch (error) {
      res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },

  async addApplicantsToGroup(req, res) {
    try {
      const { groupId } = req.params;
      const { applicationIds } = req.body;

      const group = await ApplicantGroup.findByPk(groupId);
      if (!group) {
        return res.status(404).json({ message: '그룹을 찾을 수 없습니다.' });
      }

      await group.addApplications(applicationIds);

      // 총 지원자 수 업데이트
      const totalApplicants = await group.countApplications();
      await group.update({ totalApplicants });

      res.json({
        message: '지원자가 그룹에 추가되었습니다.',
        totalApplicants
      });
    } catch (error) {
      res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },

  async getGroupStatistics(req, res) {
    try {
      const { groupId } = req.params;

      const group = await ApplicantGroup.findByPk(groupId, {
        include: [{
          model: Application,
          include: [{
            model: User,
            attributes: ['career', 'skillSet']
          }]
        }]
      });

      if (!group) {
        return res.status(404).json({ message: '그룹을 찾을 수 없습니다.' });
      }

      // 통계 계산
      const statistics = {
        totalApplicants: group.totalApplicants,
        averageCareer: 0,
        skillDistribution: {},
        statusDistribution: {}
      };

      // 통계 처리 로직
      const applications = group.Applications;
      let totalCareer = 0;

      applications.forEach(app => {
        // 경력 통계
        totalCareer += app.User.career || 0;

        // 상태 분포
        statistics.statusDistribution[app.status] = 
          (statistics.statusDistribution[app.status] || 0) + 1;

        // 스킬 분포
        app.User.skillSet?.forEach(skill => {
          statistics.skillDistribution[skill] = 
            (statistics.skillDistribution[skill] || 0) + 1;
        });
      });

      statistics.averageCareer = totalCareer / applications.length;

      res.json(statistics);
    } catch (error) {
      res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  }
};

module.exports = applicantGroupController;