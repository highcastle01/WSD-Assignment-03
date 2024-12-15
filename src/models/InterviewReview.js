const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const InterviewReview = sequelize.define('InterviewReview', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  companyId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Companies',
      key: 'id'
    }
  },
  companyName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  result: {
    type: DataTypes.ENUM('합격', '불합격', '대기중'),
    allowNull: false
  },
  process: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  questions: {
    type: DataTypes.TEXT
  },
  note: {
    type: DataTypes.TEXT
  }
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['companyId']
    },
    {
      fields: ['userId']
    }
  ]
});

module.exports = InterviewReview;