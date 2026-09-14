import { Request, Response } from 'express';
import {
  MaintenanceRequests,
  Rooms,
  logActivity,
  createNotification,
} from '../db/db';

export async function getMaintenanceRequests(req: Request, res: Response): Promise<void> {
  try {
    const { status, priority, roomId } = req.query;
    let list = await MaintenanceRequests.find({});

    if (status && status !== 'all') {
      list = list.filter((m) => m.status === status);
    }
    if (priority && priority !== 'all') {
      list = list.filter((m) => m.priority === priority);
    }
    if (roomId && roomId !== 'all') {
      list = list.filter((m) => m.roomId === roomId);
    }

    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json({ success: true, count: list.length, data: list });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch maintenance requests.' });
  }
}

export async function createMaintenanceRequest(req: Request, res: Response): Promise<void> {
  try {
    const {
      roomId,
      facilityArea,
      title,
      description,
      priority = 'medium',
      estimatedCost = 0,
      assignedStaffName,
    } = req.body;

    if (!title || (!roomId && !facilityArea)) {
      res.status(400).json({
        success: false,
        message: 'Title and either a room ID or facility area are required.',
      });
      return;
    }

    let roomNumber = '';
    if (roomId) {
      const room = await Rooms.findById(roomId);
      if (room) {
        roomNumber = room.roomNumber;
        // If critical or high, mark room as maintenance
        if (priority === 'high' || priority === 'critical') {
          if (room.status !== 'occupied') {
            await Rooms.findByIdAndUpdate(roomId, { status: 'maintenance' });
          }
        }
      }
    }

    const ticketNumber = `MNT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

    const ticket = await MaintenanceRequests.create({
      ticketNumber,
      roomId,
      roomNumber,
      facilityArea,
      title,
      description: description || '',
      priority,
      status: assignedStaffName ? 'assigned' : 'open',
      reportedBy: req.user?.name || 'Staff Member',
      assignedStaffName,
      estimatedCost: Number(estimatedCost) || 0,
      reportedAt: new Date().toISOString(),
    });

    await logActivity({
      userName: req.user?.name || 'Staff',
      userRole: req.user?.role || 'staff',
      action: 'MAINTENANCE_TICKET_CREATED',
      entityType: 'maintenance',
      entityId: ticket._id,
      details: `Created maintenance ticket ${ticketNumber}: ${title} (Priority: ${priority}, Location: ${roomNumber ? `Room ${roomNumber}` : facilityArea}).`,
    });

    await createNotification({
      targetRole: 'all',
      title: 'Maintenance Issue Reported',
      message: `${title} (${roomNumber ? `Room ${roomNumber}` : facilityArea}) - Priority: ${priority}.`,
      type: priority === 'critical' ? 'alert' : 'warning',
    });

    res.status(201).json({ success: true, message: 'Maintenance ticket created.', data: ticket });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create maintenance ticket.' });
  }
}

export async function updateMaintenanceStatus(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { status, resolutionNotes, assignedStaffName } = req.body;

    const ticket = await MaintenanceRequests.findById(id);
    if (!ticket) {
      res.status(404).json({ success: false, message: 'Ticket not found.' });
      return;
    }

    const update: any = { status };
    if (resolutionNotes) update.resolutionNotes = resolutionNotes;
    if (assignedStaffName) update.assignedStaffName = assignedStaffName;
    if (status === 'resolved' || status === 'closed') {
      update.resolvedAt = new Date().toISOString();

      // If tied to room that was in maintenance, restore room to cleaning or available
      if (ticket.roomId) {
        const room = await Rooms.findById(ticket.roomId);
        if (room && room.status === 'maintenance') {
          await Rooms.findByIdAndUpdate(ticket.roomId, { status: 'cleaning' });
        }
      }
    }

    const updated = await MaintenanceRequests.findByIdAndUpdate(id, update);

    await logActivity({
      userName: req.user?.name || 'Engineering',
      userRole: req.user?.role || 'staff',
      action: 'MAINTENANCE_STATUS_UPDATE',
      entityType: 'maintenance',
      entityId: id,
      details: `Maintenance ticket ${ticket.ticketNumber} updated to status '${status}'.`,
    });

    res.json({ success: true, message: `Ticket updated to ${status}.`, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update maintenance ticket.' });
  }
}
