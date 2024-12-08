const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Application = sequelize.define('Application', {
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
  jobId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Jobs',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM(
      'PENDING',
      'REVIEWING',
      'INTERVIEW_SCHEDULED',
      'ACCEPTED',
      'REJECTED',
      'WITHDRAWN'
    ),
    defaultValue: 'PENDING'
  },
  resumeUrl: {
    type: DataTypes.STRING
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