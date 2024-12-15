const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CompanyReview = sequelize.define('CompanyReview', {
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

module.exports = CompanyReview;