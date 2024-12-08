const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Interview = sequelize.define('Interview', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  applicationId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Applications',
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
  userId: {
    type: DataTypes.UUID,
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