const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const InterviewReview = sequelize.define('InterviewReview', {
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
  interviewId: {
    type: DataTypes.UUID,
    references: {
      model: 'Interviews',
      key: 'id'
    }
  },
  difficulty: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 5
    }
  },
  result: {
    type: DataTypes.ENUM('ACCEPTED', 'REJECTED', 'PENDING', 'WITHDRAWN'),
    allowNull: false
  },
  position: {
    type: DataTypes.STRING
  },
  date: {
    type: DataTypes.DATE
  },
  process: {
    type: DataTypes.TEXT
  },
  questions: {
    type: DataTypes.JSON,
    // Array of interview questions
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  tips: {
    type: DataTypes.TEXT
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
      fields: ['difficulty']
    },
    {
      fields: ['result']
    }
  ]
});

module.exports = InterviewReview;