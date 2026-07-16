const ActivityLog = require('../models/ActivityLog');

const logActivity = async (userId, userModel, action, details = '') => {
  try {
    await ActivityLog.create({
      userId,
      userModel,
      action,
      details
    });
  } catch (err) {
    console.error('Failed to log system activity:', err);
  }
};

module.exports = logActivity;
