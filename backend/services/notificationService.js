import Notification from '../models/Notification.js';

export const createNotification = async ({
  userId,
  title,
  message,
  type = 'system',
  link = '',
  metadata = {},
}) => {
  try {
    const notification = await Notification.create({
      user: userId,
      title,
      message,
      type,
      link,
      metadata,
    });
    return notification;
  } catch (err) {
    console.error('[Notification Service Error]', err.message);
    return null;
  }
};
