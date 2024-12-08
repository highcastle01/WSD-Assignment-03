const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CompanyReview = sequelize.define('CompanyReview', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  companyId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Companies',
      key: 'id'
    }
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 5
    }
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  pros: {
    type: DataTypes.TEXT
  },
  cons: {
    type: DataTypes.TEXT
  },
  workPeriod: {
    type: DataTypes.JSON,
    // { startDate: Date, endDate: Date }
  },
  position: {
    type: DataTypes.STRING
  },
  isCurrentEmployee: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['companyId']
    },
    {
      fields: ['userId']
    },
    {
      fields: ['rating']
    }
  ]
});

module.exports = CompanyReview;