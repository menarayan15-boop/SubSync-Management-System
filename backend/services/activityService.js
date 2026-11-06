import ActivityLog from '../models/ActivityLog.js';

export const logActivity = async ({
  userId,
  action,
  details,
  ipAddress = '127.0.0.1',
  userAgent = '',
}) => {
  try {
    const log = await ActivityLog.create({
      user: userId,
      action,
      details,
      ipAddress,
      userAgent,
    });
    return log;
  } catch (err) {
    console.error('[Activity Service Error]', err.message);
    return null;
  }
};
