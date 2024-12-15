const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

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
    // { min: number, max: number, currency: string }
  },
  location: {
    type: DataTypes.STRING
  },
  jobType: {
    type: DataTypes.ENUM('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP'),
    defaultValue: 'FULL_TIME'
  },
  deadline: {
    type: DataTypes.DATE
  },
  status: {
    type: DataTypes.ENUM('ACTIVE', 'CLOSED', 'DRAFT'),
    defaultValue: 'ACTIVE'
  },
  viewCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  timestamps: true
});

module.exports = Job;