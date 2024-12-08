const { Op } = require('sequelize');
const { Job, Company, Bookmark } = require('../models');

const jobController = {
  async getJobs(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        location,
        career,
        minSalary,
        maxSalary,
        skills,
        keyword,
        company,
        jobType,
        sortBy = 'createdAt',
        sortOrder = 'DESC'
      } = req.query;

      const offset = (page - 1) * limit;
      
      // 검색 조건 구성
      const where = { status: 'ACTIVE' };
      
      if (location) {
        where.location = location;
      }
      
      if (career) {
        where.requiredCareer = { [Op.lte]: parseInt(career) };
      }
      
      if (minSalary || maxSalary) {
        where.salary = {};
        if (minSalary) where.salary.min = { [Op.gte]: parseInt(minSalary) };
        if (maxSalary) where.salary.max = { [Op.lte]: parseInt(maxSalary) };
      }
      
      if (skills) {
        const skillsArray = typeof skills === 'string' ? [skills] : skills;
        where.requiredSkills = { [Op.overlap]: skillsArray };
      }

      if (keyword) {
        where[Op.or] = [
          { title: { [Op.like]: `%${keyword}%` } },
          { description: { [Op.like]: `%${keyword}%` } }
        ];
      }

      if (jobType) {
        where.jobType = jobType;
      }

      // Company 조건
      const include = [{
        model: Company,
        where: company ? { name: { [Op.like]: `%${company}%` } } : undefined
      }];

      // 정렬 조건
      const order = [[sortBy, sortOrder]];

      const jobs = await Job.findAndCountAll({
        where,
        include,
        order,
        offset,
        limit: parseInt(limit),
        distinct: true
      });

      res.json({
        jobs: jobs.rows,
        total: jobs.count,
        currentPage: parseInt(page),
        totalPages: Math.ceil(jobs.count / limit)
      });
    } catch (error) {
      res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },

  async getJobById(req, res) {
    try {
      const { id } = req.params;
      
      const job = await Job.findOne({
        where: { id },
        include: [{
          model: Company,
          attributes: ['id', 'name', 'industry', 'size', 'logoUrl']
        }]
      });

      if (!job) {
        return res.status(404).json({ message: '채용 공고를 찾을 수 없습니다.' });
      }

      // 조회수 증가
      await job.increment('viewCount');

      // 관련 공고 추천
      const relatedJobs = await Job.findAll({
        where: {
          id: { [Op.ne]: id },
          companyId: job.companyId,
          status: 'ACTIVE'
        },
        limit: 3
      });

      res.json({
        job,
        relatedJobs
      });
    } catch (error) {
      res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },

  async createJob(req, res) {
    try {
      const {
        title,
        description,
        requiredSkills,
        requiredCareer,
        salary,
        location,
        jobType,
        deadline,
        companyId
      } = req.body;

      const job = await Job.create({
        title,
        description,
        requiredSkills,
        requiredCareer,
        salary,
        location,
        jobType,
        deadline,
        companyId,
        status: 'ACTIVE'
      });

      res.status(201).json({
        message: '채용 공고가 등록되었습니다.',
        job
      });
    } catch (error) {
      res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },

  async updateJob(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const job = await Job.findByPk(id);
      if (!job) {
        return res.status(404).json({ message: '채용 공고를 찾을 수 없습니다.' });
      }

      await job.update(updateData);

      res.json({
        message: '채용 공고가 수정되었습니다.',
        job
      });
    } catch (error) {
      res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },

  async deleteJob(req, res) {
    try {
      const { id } = req.params;

      const job = await Job.findByPk(id);
      if (!job) {
        return res.status(404).json({ message: '채용 공고를 찾을 수 없습니다.' });
      }

      // 실제 삭제 대신 상태 변경
      await job.update({ status: 'CLOSED' });

      res.json({ message: '채용 공고가 마감되었습니다.' });
    } catch (error) {
      res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  }
};

module.exports = jobController;