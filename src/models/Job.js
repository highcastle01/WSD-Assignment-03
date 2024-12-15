const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Company = require('./Company');

const Job = sequelize.define('Job', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  companyId: {
    type: DataTypes.INTEGER,
    references: {
      model: Company,
      key: 'id'
    }
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

module.exports = Job;