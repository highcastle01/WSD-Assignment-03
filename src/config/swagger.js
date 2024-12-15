const express = require('express');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

const app = express();

// Swagger YAML 파일 로드
const swaggerYaml = YAML.load('/home/ubuntu/WSD-Assignment-03/src/swagger/openapi.yaml');

// CORS 설정 (필요한 경우)
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Swagger UI 옵션
const options = {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: "API Documentation",
};

// Swagger 문서 라우트 설정을 /api-docs로 변경
app.use('/api-docs', swaggerUi.serve);
app.get('/api-docs', swaggerUi.setup(swaggerYaml, options));

// Swagger 서버 포트 설정 (메인 서버와 다른 포트 사용)
const SWAGGER_PORT = process.env.SWAGGER_PORT || 4000;

app.listen(SWAGGER_PORT, () => {
    console.log(`Swagger documentation is running on http://localhost:${SWAGGER_PORT}/api-docs`);
});