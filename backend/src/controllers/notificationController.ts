import { Request, Response } from 'express';
import { Notifications } from '../db/db';

export async function getNotifications(req: Request, res: Response): Promise<void> {
  try {
    const role = req.user?.role || 'guest';
    const userId = req.user?._id;

    let list = await Notifications.find({});
    // Filter to notifications targeted to this user, their role, or 'all'
    list = list.filter(
      (n) =>
        n.userId === 'all' ||
        n.userId === userId ||
        n.targetRole === 'all' ||
        n.targetRole === role
    );

    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const unreadCount = list.filter((n) => !n.isRead).length;

    res.json({ success: true, count: list.length, unreadCount, data: list });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch notifications.' });
  }
}

export async function markAsRead(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const updated = await Notifications.findByIdAndUpdate(id, { isRead: true });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update notification.' });
  }
}

export async function markAllAsRead(req: Request, res: Response): Promise<void> {
  try {
    const role = req.user?.role || 'guest';
    const userId = req.user?._id;
    const list = await Notifications.find({});

    for (const notif of list) {
      if (
        (notif.userId === 'all' || notif.userId === userId || notif.targetRole === 'all' || notif.targetRole === role) &&
        !notif.isRead
      ) {
        await Notifications.findByIdAndUpdate(notif._id, { isRead: true });
      }
    }

    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to mark notifications.' });
  }
}
