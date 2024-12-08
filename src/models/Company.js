const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Company = sequelize.define('Company', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
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
    type: DataTypes.STRING
  },
  description: {
    type: DataTypes.TEXT
  },
  logoUrl: {
    type: DataTypes.STRING
  },
  employeeCount: {
    type: DataTypes.INTEGER
  },
  foundedYear: {
    type: DataTypes.INTEGER
  },
  websiteUrl: {
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