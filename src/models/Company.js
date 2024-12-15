const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

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

module.exports = Company;