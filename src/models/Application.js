const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Application = sequelize.define('Application', {
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
  jobId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Jobs',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM(
      '검토대기',
      '검토중',
      '면접예정',
      '합격',
      '불합격',
      '지원취소'
    ),
    defaultValue: '검토대기'
  },
  coverLetter: {
    type: DataTypes.TEXT
  },
  appliedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  lastStatusUpdateAt: {
    type: DataTypes.DATE
  }
 }, {
  timestamps: true,
  indexes: [
    {
      fields: ['userId']
    },
    {
      fields: ['jobId']
    },
    {
      fields: ['status']
    },
    {
      fields: ['appliedAt']
    }
  ]
 });
 
module.exports = Application;