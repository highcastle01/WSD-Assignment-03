const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ApplicantGroup = sequelize.define('ApplicantGroup', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  companyId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Companies',
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  status: {
    type: DataTypes.ENUM('ACTIVE', 'ARCHIVED'),
    defaultValue: 'ACTIVE'
  },
  totalApplicants: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  metadata: {
    type: DataTypes.JSON,
    // 그룹에 대한 추가 정보 (평균 경력, 기술 스택 통계 등)
  }
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['companyId']
    }
  ]
});

module.exports = ApplicantGroup;