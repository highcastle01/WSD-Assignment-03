const fs = require('fs').promises;
const readline = require('readline');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { Sequelize, DataTypes } = require('sequelize');

// Sequelize 설정
const sequelize = new Sequelize({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  dialect: 'mysql',
  logging: false
});

// CompanyReview 모델 정의
const CompanyReview = sequelize.define('CompanyReview', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  companyId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  field: {
    type: DataTypes.STRING,
    allowNull: false
  },
  isHired: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  companyName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  department: {
    type: DataTypes.STRING,
    allowNull: false
  },
  writer: {
    type: DataTypes.STRING,
    allowNull: false
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'CompanyReviews'
});

async function resetDatabase() {
  try {
    // 테이블 삭제 (존재하는 경우)
    await CompanyReview.drop();
    console.log('Existing table dropped successfully');

    // 테이블 다시 생성
    await CompanyReview.sync({ force: true });
    console.log('New table created successfully');
  } catch (error) {
    console.error('Error resetting database:', error);
    throw error;
  }
}

async function processLineByLine() {
  const filePath = path.join(__dirname, 'saramin_companyreview.jsonl');
  const fileStream = require('fs').createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let successCount = 0;
  let errorCount = 0;
  let lineNumber = 0;

  for await (const line of rl) {
    lineNumber++;
    try {
      const review = JSON.parse(line);
      
      const transformedReview = {
        userId: 1,
        companyId: 1,
        field: review.분야,
        isHired: review.채용여부 === "채용중",
        title: review.타이틀,
        companyName: review.회사이름,
        department: review.부서,
        writer: review.작성자,
        createdAt: transformDate(review.작성일자)
      };

      await CompanyReview.create(transformedReview);
      successCount++;
      if (successCount % 10 === 0) {
        console.log(`Processed ${successCount} reviews successfully`);
      }
    } catch (error) {
      errorCount++;
      console.error(`Error on line ${lineNumber}:`, error.message);
    }
  }

  return { successCount, errorCount };
}

function transformDate(dateString) {
  const [year, month, day] = dateString.split('.');
  return new Date(`20${year}-${month}-${day}`);
}

async function main() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully');

    console.log('Resetting database...');
    await resetDatabase();

    console.log('Starting data migration...');
    const { successCount, errorCount } = await processLineByLine();
    console.log('\nMigration completed:');
    console.log(`Successfully processed: ${successCount} reviews`);
    console.log(`Failed to process: ${errorCount} reviews`);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });