const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SearchHistory = sequelize.define('SearchHistory', {
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
  keyword: {
    type: DataTypes.STRING,
    allowNull: false
  },
  filters: {
    type: DataTypes.JSON,
    // { location, jobType, salary, career, etc. }
  },
  searchedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['userId']
    },
    {
      fields: ['searchedAt']
    }
  ]
});

module.exports = SearchHistory;