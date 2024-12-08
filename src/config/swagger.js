const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '채용 플랫폼 API',
      version: '1.0.0',
      description: '채용 플랫폼의 RESTful API 문서',
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:3000',
        description: '개발 서버',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{
      bearerAuth: [],
    }],
  },
  apis: ['./src/routes/*.js'], // API 라우트 파일 경로
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;