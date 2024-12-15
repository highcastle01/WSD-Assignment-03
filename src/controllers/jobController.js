const { Op } = require('sequelize');
const { Job, Company, Bookmark, SearchHistory } = require('../models');
const searchHistoryController = require('./searchHistoryController');

const jobController = {
  // 채용 공고 목록 조회
  async getJobs(req, res) {
    try {
      const userId = req.user.userId;
      console.log('사용자 정보:', userId);

      const {
        page = 1,
        limit = 20,
        location, // 위치 검색
        career,
        minSalary,
        maxSalary,
        skills,
        keyword,
        company,
        position,
        education,
        jobType
      } = req.query;

      const where = { [Op.and]: [] };
      console.log(`검색 위치: ${location}`);

      // 위치 조건: "서울 강남구"도 "서울"로 검색 가능
      if (location) {
        where[Op.and].push({ location: { [Op.like]: `${location}%` } });
      }

      if (career) {
        where[Op.and].push({ requiredCareer: { [Op.lte]: parseInt(career, 10) } });
      }

      if (minSalary || maxSalary) {
        const salaryCondition = {};
        if (minSalary) {
          salaryCondition[Op.gte] = parseInt(minSalary, 10);
        }
        if (maxSalary) {
          salaryCondition[Op.lte] = parseInt(maxSalary, 10);
        }
        where[Op.and].push({ salary: salaryCondition });
      }

      if (skills) {
        const skillsArray = skills.split(',').map(skill => skill.trim());
        where[Op.and].push({ requiredSkills: { [Op.contains]: skillsArray } });
      }

      const orConditions = [];
      if (keyword) {
        orConditions.push(
          { title: { [Op.like]: `%${keyword}%` } },
          { description: { [Op.like]: `%${keyword}%` } }
        );
      }

      if (position) {
        orConditions.push({ position: { [Op.like]: `%${position}%` } });
      }

      if (education) {
        orConditions.push({ education: { [Op.like]: `%${education}%` } });
      }

      if (jobType) {
        orConditions.push({ jobType: { [Op.like]: `%${jobType}%` } });
      }

      if (orConditions.length > 0) {
        where[Op.and].push({ [Op.or]: orConditions });
      }

      const include = [{
        model: Company,
        as: 'company',
        attributes: ['id', 'name', 'industry', 'size', 'location'],
        where: company ? { name: { [Op.like]: `%${company}%` } } : undefined
      }];

      const pageNum = parseInt(page, 10) || 1;
      const limitNum = parseInt(limit, 10) || 20;

      const jobs = await Job.findAndCountAll({
        where,
        include,
        order: [['createdAt', 'DESC']],
        offset: (pageNum - 1) * limitNum,
        limit: limitNum,
        distinct: true
      });

      if (userId) {
        try {
          const saveResult = await searchHistoryController.saveSearch(
            {
              body: {
                keyword: keyword || '필터참고',
                filters: {
                  location,
                  career,
                  minSalary,
                  maxSalary,
                  skills,
                  company,
                  position,
                  education,
                  jobType,
                  page: pageNum,
                  limit: limitNum,
                  resultCount: jobs.rows.length,
                  firstResultId: jobs.rows[0]?.id || null
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
        jobs: jobs.rows,
        total: jobs.count,
        currentPage: pageNum,
        totalPages: Math.ceil(jobs.count / limitNum)
      });

    } catch (error) {
      console.error('채용공고 조회 중 오류:', error);
      res.status(500).json({
        message: '채용공고 목록을 불러오는 중 오류가 발생했습니다.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },  

  // 채용 공고 상세 조회
  async getJobById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      
      const job = await Job.findOne({
        where: { id },
        include: [{
          model: Company,
          as: 'company',
          attributes: ['id', 'name', 'industry', 'size', 'location', 'companyUrl']
        }]
      });
  
      if (!job) {
        return res.status(404).json({ message: '채용 공고를 찾을 수 없습니다.' });
      }
  
      await Job.update(
        { viewCount: job.viewCount + 1 },
        { where: { id } }
      );
  
      job.viewCount += 1;
  
      const relatedJobs = await Job.findAll({
        where: {
          id: { [Op.ne]: id },
          companyId: job.companyId
        },
        include: [{
          model: Company,
          as: 'company',
          attributes: ['id', 'name', 'industry']
        }],
        limit: 3
      });
  
      let isBookmarked = false;
      if (userId) {
        const bookmark = await Bookmark.findOne({
          where: {
            userId,
            targetId: id,
            targetType: 'job'
          }
        });
        isBookmarked = !!bookmark;
      }

      if (req.user?.userId) {
        try {
          const saveResult = await searchHistoryController.saveSearch(
            {
              body: {
                keyword: keyword || '',
                filters: {
                  location,
                  career,
                  minSalary,
                  maxSalary,
                  skills,
                  company,
                  position,
                  page,
                  limit,
                  resultCount: jobs.rows.length,
                  firstResultId: jobs.rows[0]?.id || null,
                },
              },
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
        job,
        isBookmarked,
        relatedJobs
      });
    } catch (error) {
      console.error('채용 공고 상세 조회 중 오류:', error);
      res.status(500).json({ 
        message: '채용 공고 정보를 불러오는 중 오류가 발생했습니다.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // 채용 공고 등록
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
        companyId,
        education,
        position,
        workingHours,
        startDate
      } = req.body;

      const company = await Company.findByPk(companyId);
      if (!company) {
        return res.status(404).json({ message: '존재하지 않는 회사입니다.' });
      }

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
        education,
        position,
        workingHours,
        startDate,
        viewCount: 0
      });

      res.status(201).json({
        message: '채용 공고가 등록되었습니다.',
        job
      });
    } catch (error) {
      console.error('채용 공고 등록 중 오류:', error);
      let errorMessage = '채용 공고 등록 중 오류가 발생했습니다.';
      
      if (error.name === 'SequelizeValidationError') {
        errorMessage = '입력하신 데이터가 유효하지 않습니다: ' + error.errors.map(e => e.message).join(', ');
      }

      res.status(400).json({ 
        message: errorMessage,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // 채용 공고 수정
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
      console.error('채용 공고 수정 중 오류:', error);
      let errorMessage = '채용 공고 수정 중 오류가 발생했습니다.';
      
      if (error.name === 'SequelizeValidationError') {
        errorMessage = '입력하신 데이터가 유효하지 않습니다: ' + error.errors.map(e => e.message).join(', ');
      }

      res.status(400).json({ 
        message: errorMessage,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // 채용 공고 삭제
  async deleteJob(req, res) {
    try {
      const { id } = req.params;

      const job = await Job.findByPk(id);

      if (!job) {
        return res.status(404).json({ message: '채용 공고를 찾을 수 없습니다.' });
      }

      await job.destroy();

      res.json({ 
        message: '채용 공고가 삭제되었습니다.',
        jobId: id
      });
    } catch (error) {
      console.error('채용 공고 삭제 중 오류:', error);
      res.status(500).json({ 
        message: '채용 공고 삭제 중 오류가 발생했습니다.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
};

module.exports = jobController;
