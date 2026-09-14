import { Request, Response } from 'express';
import {
  HousekeepingTasks,
  Rooms,
  Staff,
  logActivity,
  createNotification,
} from '../db/db';

export async function getHousekeepingTasks(req: Request, res: Response): Promise<void> {
  try {
    const { status, priority, roomId, assignedTo } = req.query;
    let list = await HousekeepingTasks.find({});

    if (status && status !== 'all') {
      list = list.filter((t) => t.status === status);
    }
    if (priority && priority !== 'all') {
      list = list.filter((t) => t.priority === priority);
    }
    if (roomId && roomId !== 'all') {
      list = list.filter((t) => t.roomId === roomId);
    }
    if (assignedTo && assignedTo !== 'all') {
      list = list.filter((t) => t.assignedTo === assignedTo);
    }

    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json({ success: true, count: list.length, data: list });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch housekeeping tasks.' });
  }
}

export async function createHousekeepingTask(req: Request, res: Response): Promise<void> {
  try {
    const { roomId, taskType = 'daily_refresh', priority = 'normal', assignedTo, scheduledDate, notes } = req.body;

    if (!roomId) {
      res.status(400).json({ success: false, message: 'Room ID is required.' });
      return;
    }

    const room = await Rooms.findById(roomId);
    if (!room) {
      res.status(404).json({ success: false, message: 'Room not found.' });
      return;
    }

    let staffName = '';
    if (assignedTo) {
      const staffMember = await Staff.findById(assignedTo);
      staffName = staffMember ? staffMember.employeeId : '';
    }

    const taskNumber = `HSK-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const task = await HousekeepingTasks.create({
      taskNumber,
      roomId,
      roomNumber: room.roomNumber,
      taskType,
      priority,
      status: assignedTo ? 'assigned' : 'pending',
      assignedTo,
      assignedToName: staffName,
      scheduledDate: scheduledDate || new Date().toISOString().split('T')[0],
      notes,
    });

    // If task type is deep_clean or checkout_cleaning, set room status to cleaning
    if (room.status === 'available' && (taskType === 'checkout_cleaning' || taskType === 'deep_clean')) {
      await Rooms.findByIdAndUpdate(roomId, { status: 'cleaning' });
    }

    await logActivity({
      userName: req.user?.name || 'Supervisor',
      userRole: req.user?.role || 'staff',
      action: 'HOUSEKEEPING_TASK_CREATED',
      entityType: 'housekeeping',
      entityId: task._id,
      details: `Created ${taskType} task ${taskNumber} for Room ${room.roomNumber} (Priority: ${priority}).`,
    });

    res.status(201).json({ success: true, message: 'Housekeeping task created.', data: task });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create housekeeping task.' });
  }
}

export async function updateHousekeepingStatus(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { status, notes, issuesReported } = req.body;

    const task = await HousekeepingTasks.findById(id);
    if (!task) {
      res.status(404).json({ success: false, message: 'Task not found.' });
      return;
    }

    const update: any = { status };
    if (notes) update.notes = notes;
    if (issuesReported) update.issuesReported = issuesReported;

    if (status === 'in_progress' && !task.startedAt) {
      update.startedAt = new Date().toISOString();
    }
    if (status === 'completed') {
      update.completedAt = new Date().toISOString();
    }
    if (status === 'inspected') {
      update.inspectedBy = req.user?.name || 'Supervisor';
    }

    const updated = await HousekeepingTasks.findByIdAndUpdate(id, update);

    // If status is completed or inspected, check if room can be returned to available
    if (status === 'completed' || status === 'inspected') {
      const room = await Rooms.findById(task.roomId);
      if (room && room.status === 'cleaning') {
        await Rooms.findByIdAndUpdate(room._id, {
          status: 'available',
          lastCleaned: new Date().toISOString(),
        });

        await logActivity({
          userName: req.user?.name || 'Housekeeping',
          userRole: req.user?.role || 'housekeeping',
          action: 'ROOM_CLEANED_AVAILABLE',
          entityType: 'room',
          entityId: room._id,
          details: `Room ${room.roomNumber} cleaned, inspected, and restored to 'Available' status.`,
        });
      }
    }

    await logActivity({
      userName: req.user?.name || 'Housekeeping Staff',
      userRole: req.user?.role || 'housekeeping',
      action: 'HOUSEKEEPING_STATUS_UPDATE',
      entityType: 'housekeeping',
      entityId: id,
      details: `Housekeeping task ${task.taskNumber} status changed to '${status}'.`,
    });

    res.json({ success: true, message: `Task status updated to ${status}.`, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update housekeeping status.' });
  }
}

export async function assignHousekeepingTask(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { staffId, staffName } = req.body;

    const task = await HousekeepingTasks.findById(id);
    if (!task) {
      res.status(404).json({ success: false, message: 'Task not found.' });
      return;
    }

    const updated = await HousekeepingTasks.findByIdAndUpdate(id, {
      assignedTo: staffId,
      assignedToName: staffName,
      status: task.status === 'pending' ? 'assigned' : task.status,
    });

    await createNotification({
      targetRole: 'housekeeping',
      title: 'Task Assigned',
      message: `Housekeeping task ${task.taskNumber} for Room ${task.roomNumber} has been assigned to ${staffName}.`,
      type: 'info',
    });

    res.json({ success: true, message: 'Task assigned successfully.', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to assign task.' });
  }
}
