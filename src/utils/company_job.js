const fs = require('fs').promises;
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');

// 데이터베이스 연결 설정
const sequelize = new Sequelize({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || '3000',
  database: process.env.DB_NAME || 'wsd03',
  username: process.env.DB_USER || 'castle',
  password: process.env.DB_PASSWORD || 'castle',
  dialect: 'mysql',
  logging: false
});

// Company 모델 정의
const Company = sequelize.define('Company', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  industry: {
    type: DataTypes.STRING
  },
  size: {
    type: DataTypes.STRING
  },
  location: {
    type: DataTypes.ENUM(
      '서울', '부산', '대구', '인천', '광주', '대전',
      '울산', '세종', '경기', '강원', '충북', '충남',
      '전북', '전남', '경북', '경남', '제주'
    ),
    allowNull: false
  },
  employeeCount: {
    type: DataTypes.INTEGER
  },
  foundedYear: {
    type: DataTypes.INTEGER
  },
  companyUrl: {
    type: DataTypes.STRING
  }
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['name']
    },
    {
      fields: ['location']
    }
  ]
});

// Job 모델 정의
const Job = sequelize.define('Job', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  requiredSkills: {
    type: DataTypes.JSON
  },
  requiredCareer: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  salary: {
    type: DataTypes.JSON
  },
  location: {
    type: DataTypes.STRING
  },
  jobType: {
    type: DataTypes.ENUM('정규직', '계약직', '인턴', '기타'),
    defaultValue: '정규직'
  },
  deadline: {
    type: DataTypes.DATE
  },
  viewCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  jobUrl: {
    type: DataTypes.STRING
  },
  education: {
    type: DataTypes.STRING
  },
  position: {
    type: DataTypes.STRING
  },
  workingHours: {
    type: DataTypes.STRING
  },
  startDate: {
    type: DataTypes.DATE
  }
}, {
  timestamps: true
});

// 관계 설정
Company.hasMany(Job);
Job.belongsTo(Company);

// 파싱 함수들
const parseLocation = (address) => {
  if (!address) return '서울';

  const regions = [
    '서울', '부산', '대구', '인천', '광주', '대전',
    '울산', '세종', '경기', '강원', '충북', '충남',
    '전북', '전남', '경북', '경남', '제주'
  ];
  
  try {
    for (const region of regions) {
      if (address.startsWith(region)) {
        return region;
      }
    }
    return '서울';
  } catch (error) {
    return '서울';
  }
};

const parseEmployeeCount = (employeeStr) => {
  if (!employeeStr) return null;
  try {
    const match = employeeStr.match(/(\d+)\s*명/);
    return match ? parseInt(match[1]) : null;
  } catch (error) {
    return null;
  }
};

const parseFoundedYear = (foundedStr) => {
  if (!foundedStr) return null;
  try {
    const match = foundedStr.match(/(\d{4})년/);
    return match ? parseInt(match[1]) : null;
  } catch (error) {
    return null;
  }
};

const parseDate = (dateStr) => {
  if (!dateStr) return null;
  
  try {
    const [date, time] = dateStr.split(' ');
    const [year, month, day] = date.split('.');
    
    // 2자리 연도를 4자리로 변환 (예: 24 -> 2024)
    const fullYear = year.length === 2 ? `20${year}` : year;
    
    // 월과 일이 한 자리수인 경우 앞에 0을 붙임
    const formattedMonth = month.padStart(2, '0');
    const formattedDay = day.padStart(2, '0');
    
    return new Date(`${fullYear}-${formattedMonth}-${formattedDay} ${time || '00:00:00'}`);
  } catch (error) {
    console.log(`Invalid date format: ${dateStr}`);
    return null;
  }
};

const parseJobType = (type) => {
  if (!type) return '정규직';
  try {
    if (type.includes('정규직')) return '정규직';
    if (type.includes('계약직')) return '계약직';
    if (type.includes('인턴')) return '인턴';
    return '기타';
  } catch (error) {
    return '정규직';
  }
};

const parseCareer = (career) => {
  if (!career) return 0;
  try {
    if (career.includes('신입')) return 0;
    const match = career.match(/\d+/);
    return match ? parseInt(match[0]) : 0;
  } catch (error) {
    return 0;
  }
};

async function processData(jsonData) {
  let successCount = 0;
  let errorCount = 0;

  try {
    for (const item of jsonData) {
      try {
        // Company 데이터 처리
        const companyData = {
          name: item.company_name,
          industry: item.company_info?.업종,
          size: item.company_info?.기업형태,
          location: parseLocation(item.company_info?.기업주소),
          employeeCount: parseEmployeeCount(item.company_info?.사원수),
          foundedYear: parseFoundedYear(item.company_info?.설립일),
          companyUrl: item.company_info?.홈페이지
        };

        const company = await Company.create(companyData);
        
        // Job 데이터 처리
        const jobData = {
          CompanyId: company.id,
          title: item.job_title,
          description: item.details?.회사,
          requiredSkills: item.tech_stack,
          requiredCareer: parseCareer(item.details?.경력),
          salary: { description: item.details?.급여 },
          location: item.details?.근무지역,
          jobType: parseJobType(item.details?.근무형태),
          deadline: parseDate(item.details?.마감일),
          jobUrl: item.job_href,
          education: item.details?.학력,
          position: item.details?.직급,
          workingHours: item.details?.근무지역,
          startDate: parseDate(item.details?.시작일)
        };

        await Job.create(jobData);
        successCount++;
        console.log(`Processed: ${item.company_name} - ${item.job_title}`);
      } catch (error) {
        errorCount++;
        console.error(`Error processing ${item.company_name}:`, error.message);
      }
    }
    return { successCount, errorCount };
  } catch (error) {
    console.error('Error in bulk processing:', error);
    throw error;
  }
}

async function main() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully');

    // 외래 키 체크 비활성화
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

    // 순차적으로 테이블 생성
    await Company.sync({ force: true });
    console.log('Companies table created');
    
    await Job.sync({ force: true });
    console.log('Jobs table created');

    // 외래 키 체크 다시 활성화
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

    const jsonData = JSON.parse(await fs.readFile('jobs.json', 'utf8'));
    const { successCount, errorCount } = await processData(jsonData);
    
    console.log('\nMigration completed:');
    console.log(`Successfully processed: ${successCount} items`);
    console.log(`Failed to process: ${errorCount} items`);
  } catch (error) {
    console.error('Migration failed:', error);
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    throw error;
  } finally {
    await sequelize.close();
  }
}

main().catch(console.error);