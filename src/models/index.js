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

// User Relationships
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

// Company Relationships
Company.hasMany(Job, { foreignKey: 'companyId', as: 'jobs' });
Company.hasMany(Interview, { foreignKey: 'companyId' });
Company.hasMany(CompanyReview, { foreignKey: 'companyId' });
Company.hasMany(InterviewReview, { foreignKey: 'companyId' });
Company.hasMany(ApplicantGroup, { foreignKey: 'companyId' });

Job.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
Interview.belongsTo(Company, { foreignKey: 'companyId' });
CompanyReview.belongsTo(Company, { foreignKey: 'companyId' });
InterviewReview.belongsTo(Company, { foreignKey: 'companyId' });
ApplicantGroup.belongsTo(Company, { foreignKey: 'companyId' });

// Job Relationships
Job.hasMany(Application, { foreignKey: 'jobId' });
Job.hasMany(Bookmark, { foreignKey: 'jobId' });

Application.belongsTo(Job, { foreignKey: 'jobId' });
Bookmark.belongsTo(Job, { foreignKey: 'jobId' });

// ApplicantGroup Relationships
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