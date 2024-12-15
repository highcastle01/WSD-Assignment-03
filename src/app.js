const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const https = require('https');
const fs = require('fs');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');
const sequelize = require('./config/database');
require('dotenv').config();

let swaggerYaml;
try {
    const yamlPath = path.join(__dirname, 'swagger', 'swagger.yaml');
    console.log('YAML 파일 경로:', yamlPath);
    swaggerYaml = YAML.load(yamlPath);
    console.log('YAML 파일 로드 성공');
} catch (error) {
    console.error('YAML 파일 로드 에러:', error);
    process.exit(1);  // YAML 로드 실패시 서버 종료
}

// 라우터 임포트
const authRouter = require('./routes/auth');
const jobsRouter = require('./routes/jobs');
const applicationsRouter = require('./routes/applications');
const bookmarksRouter = require('./routes/bookmarks');
const searchHistoryRouter = require('./routes/searchHistory');
const interviewsRouter = require('./routes/interviews');
const companiesRouter = require('./routes/companies');
const companyReviewsRouter = require('./routes/companyReviews');
const interviewReviewsRouter = require('./routes/interviewReviews');
const applicantGroupsRouter = require('./routes/applicantGroups');

const app = express();

// 미들웨어 설정
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  xFrameOptions: false,  // 추가
}));

// 기존의 swagger 라우트 설정을 아래 코드로 교체
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerYaml, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "채용 플랫폼 API Documentation",
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true
  },
}));

// 라우터 설정
app.get('/', (req, res) => {
  res.send('Hello World!');
});
app.use('/api/auth', authRouter);
app.use('/api/jobs', jobsRouter);
app.use('/api/applications', applicationsRouter);
app.use('/api/bookmarks', bookmarksRouter);
app.use('/api/search-history', searchHistoryRouter);
app.use('/api/interviews', interviewsRouter);
app.use('/api/companies', companiesRouter);
app.use('/api/company-reviews', companyReviewsRouter);
app.use('/api/interview-reviews', interviewReviewsRouter);
app.use('/api/applicant-groups', applicantGroupsRouter);

// 404 에러 처리
app.use((req, res, next) => {
  const error = new Error('Not Found');
  error.status = 404;
  next(error);
});

// 전역 에러 핸들러
app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.json({
    error: {
      message: err.message,
      status: err.status,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }
  });
});

// SSL 설정 및 서버 시작
const isDevelopment = 'development'; //process.env.NODE_ENV === 'development';
const PORT = process.env.PORT || 80;

sequelize.sync({ force: false })
  .then(() => {
    console.log('Database synchronized');
    
    if (isDevelopment) {
      // HTTP 서버 (개발 환경)
      app.listen(PORT, () => {
        console.log(`Development server running on port ${PORT}`);
      });
    } else {
      // HTTPS 서버 (운영 환경)
      const options = {
        key: fs.readFileSync('./ssl/private.key'),
        cert: fs.readFileSync('./ssl/certificate.crt')
      };
      
      https.createServer(options, app).listen(PORT, () => {
        console.log(`HTTPS Server running on port ${PORT}`);
      });
    }
  })
  .catch(err => {
    console.error('Database sync error:', err);
  });

module.exports = app;