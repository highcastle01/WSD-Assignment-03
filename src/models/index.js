const sequelize = require('../config/database');
const User = require('./User');
const Company = require('./Company');
const Job = require('./Job');
const Application = require('./Application');
const Bookmark = require('./Bookmark');
const SearchHistory = require('./SearchHistory');
const Interview = require('./Interview');
const CompanyReview = require('./CompanyReview');
const InterviewReview = require('./InterviewReview');
const ApplicantGroup = require('./ApplicantGroup');

// ======== User 관련 관계 ========
User.hasMany(Application, { foreignKey: 'userId' });
User.hasMany(Bookmark, { foreignKey: 'userId' });
User.hasMany(SearchHistory, { foreignKey: 'userId' });
User.hasMany(CompanyReview, { foreignKey: 'userId' });
User.hasMany(InterviewReview, { foreignKey: 'userId' });
User.hasMany(Interview, { foreignKey: 'userId' });

Application.belongsTo(User, { foreignKey: 'userId' });
Bookmark.belongsTo(User, { foreignKey: 'userId' });
SearchHistory.belongsTo(User, { foreignKey: 'userId' });
CompanyReview.belongsTo(User, { foreignKey: 'userId' });
InterviewReview.belongsTo(User, { foreignKey: 'userId' });
Interview.belongsTo(User, { foreignKey: 'userId' });

// ======== Company 관련 관계 ========
// Company -> 다른 모델
Company.hasMany(Job, { foreignKey: 'companyId', as: 'jobs' });
Company.hasMany(Interview, { foreignKey: 'companyId' });
Company.hasMany(CompanyReview, { foreignKey: 'companyId' });
Company.hasMany(InterviewReview, { foreignKey: 'companyId' });
Company.hasMany(ApplicantGroup, { foreignKey: 'companyId' });
Company.hasMany(Bookmark, {
  foreignKey: 'targetId',
  constraints: false,
  scope: {
    targetType: 'company'
  }
});

// 다른 모델 -> Company
Job.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
Interview.belongsTo(Company, { foreignKey: 'companyId' });
CompanyReview.belongsTo(Company, { foreignKey: 'companyId' });
InterviewReview.belongsTo(Company, { foreignKey: 'companyId' });
ApplicantGroup.belongsTo(Company, { foreignKey: 'companyId' });

// ======== Job 관련 관계 ========
Job.hasMany(Application, { foreignKey: 'jobId' });
Job.hasMany(Bookmark, { 
  foreignKey: 'targetId',
  constraints: false,
  scope: {
    targetType: 'job'
  }
});

Application.belongsTo(Job, { foreignKey: 'jobId' });

// ======== Bookmark 관련 관계 ========
// Polymorphic associations
Bookmark.belongsTo(Job, {
  foreignKey: 'targetId',
  constraints: false,
  scope: {
    targetType: 'job'
  }
});

Bookmark.belongsTo(Company, {
  foreignKey: 'targetId',
  constraints: false,
  scope: {
    targetType: 'company'
  }
});

// ======== ApplicantGroup 관련 관계 ========
ApplicantGroup.belongsToMany(Application, {
  through: 'ApplicantGroupApplications',
  foreignKey: 'applicantGroupId',
  otherKey: 'applicationId'
});

Application.belongsToMany(ApplicantGroup, {
  through: 'ApplicantGroupApplications',
  foreignKey: 'applicationId',
  otherKey: 'applicantGroupId'
});

module.exports = {
  sequelize,
  User,
  Company,
  Job,
  Application,
  Bookmark,
  SearchHistory,
  Interview,
  CompanyReview,
  InterviewReview,
  ApplicantGroup
};