const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
//보류
const Interview = sequelize.define('Interview', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  applicationId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Applications',
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
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  scheduleDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('ONLINE', 'OFFLINE', 'PHONE'),
    defaultValue: 'OFFLINE'
  },
  location: {
    type: DataTypes.STRING
  },
  interviewLink: {
    type: DataTypes.STRING
  },
  status: {
    type: DataTypes.ENUM(
      'SCHEDULED',
      'COMPLETED',
      'CANCELLED',
      'RESCHEDULED'
    ),
    defaultValue: 'SCHEDULED'
  },
  notes: {
    type: DataTypes.TEXT
  }
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['applicationId']
    },
    {
      fields: ['companyId']
    },
    {
      fields: ['userId']
    },
    {
      fields: ['scheduleDate']
    }
  ]
});

module.exports = Interview;