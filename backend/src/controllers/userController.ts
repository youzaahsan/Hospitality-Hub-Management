import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import {
  Users,
  Staff,
  Guests,
  ActivityLogs,
  SystemSettings,
  Rooms,
  RoomTypes,
  Reservations,
  Invoices,
  Payments,
  Services,
  ServiceRequests,
  HousekeepingTasks,
  MaintenanceRequests,
  Feedback,
  Notifications,
  logActivity,
} from '../db/db';

export async function getUsers(req: Request, res: Response): Promise<void> {
  try {
    const list = await Users.find({});
    // Remove passwordHash for security
    const safeUsers = list.map(({ passwordHash, ...rest }) => rest);
    res.json({ success: true, count: safeUsers.length, data: safeUsers });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch users.' });
  }
}

export async function updateUser(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { name, role, phone, isActive, password } = req.body;

    const updateData: any = {};
    if (name) updateData.name = name;
    if (role) updateData.role = role;
    if (phone !== undefined) updateData.phone = phone;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    const updated = await Users.findByIdAndUpdate(id, updateData);
    if (!updated) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    const { passwordHash, ...safe } = updated;
    res.json({ success: true, message: 'User updated.', data: safe });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update user.' });
  }
}

export async function getStaff(req: Request, res: Response): Promise<void> {
  try {
    const staffList = await Staff.find({});
    const users = await Users.find({});
    const userMap = new Map(users.map((u) => [u._id, u]));

    const enriched = staffList.map((s) => {
      const u = userMap.get(s.userId);
      return {
        ...s,
        name: u?.name || 'Staff Member',
        email: u?.email || '',
        role: u?.role || 'staff',
        phone: u?.phone || '',
        avatar: u?.avatar || '',
      };
    });

    res.json({ success: true, count: enriched.length, data: enriched });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch staff.' });
  }
}

export async function createStaff(req: Request, res: Response): Promise<void> {
  try {
    const { name, email, password, role = 'receptionist', department, position, shift = 'morning', salary, phone } = req.body;

    if (!name || !email || !password || !department || !position) {
      res.status(400).json({ success: false, message: 'Name, email, password, department, and position are required.' });
      return;
    }

    const existingUser = await Users.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      res.status(409).json({ success: false, message: 'A user with this email already exists.' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await Users.create({
      name,
      email: email.toLowerCase().trim(),
      passwordHash,
      role,
      phone,
      isActive: true,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
    });

    const empId = `EMP-${department.slice(0, 3).toUpperCase()}-${Math.floor(10 + Math.random() * 90)}`;
    const staff = await Staff.create({
      userId: user._id,
      employeeId: empId,
      department,
      position,
      shift,
      salary: Number(salary) || 50000,
      hireDate: new Date().toISOString().split('T')[0],
      status: 'active',
    });

    await logActivity({
      userName: req.user?.name || 'Admin',
      userRole: req.user?.role || 'admin',
      action: 'STAFF_HIRED',
      entityType: 'auth',
      entityId: user._id,
      details: `Hired staff member ${name} (${position}, ${department}). Employee ID: ${empId}.`,
    });

    res.status(201).json({ success: true, message: 'Staff member added successfully.', data: { ...staff, user } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create staff member.' });
  }
}

export async function getGuests(req: Request, res: Response): Promise<void> {
  try {
    const { search, vipOnly } = req.query;
    let list = await Guests.find({});

    if (vipOnly === 'true') {
      list = list.filter((g) => g.vipStatus);
    }
    if (search) {
      const q = String(search).toLowerCase();
      list = list.filter(
        (g) =>
          g.fullName.toLowerCase().includes(q) ||
          g.email.toLowerCase().includes(q) ||
          g.phone.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0));
    res.json({ success: true, count: list.length, data: list });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch guests.' });
  }
}

export async function updateGuest(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const updated = await Guests.findByIdAndUpdate(id, req.body);
    if (!updated) {
      res.status(404).json({ success: false, message: 'Guest not found.' });
      return;
    }
    res.json({ success: true, message: 'Guest profile updated.', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update guest profile.' });
  }
}

export async function getActivityLogs(req: Request, res: Response): Promise<void> {
  try {
    const { entityType, search } = req.query;
    let list = await ActivityLogs.find({});

    if (entityType && entityType !== 'all') {
      list = list.filter((l) => l.entityType === entityType);
    }
    if (search) {
      const q = String(search).toLowerCase();
      list = list.filter((l) => l.details.toLowerCase().includes(q) || l.userName.toLowerCase().includes(q) || l.action.toLowerCase().includes(q));
    }

    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json({ success: true, count: list.length, data: list });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch activity logs.' });
  }
}

export async function getSettings(req: Request, res: Response): Promise<void> {
  try {
    const settings = await SystemSettings.findOne({});
    res.json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch settings.' });
  }
}

export async function updateSettings(req: Request, res: Response): Promise<void> {
  try {
    const current = await SystemSettings.findOne({});
    if (current) {
      const updated = await SystemSettings.findByIdAndUpdate(current._id, req.body);
      res.json({ success: true, message: 'System settings saved.', data: updated });
    } else {
      const created = await SystemSettings.create(req.body);
      res.json({ success: true, message: 'System settings initialized.', data: created });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update settings.' });
  }
}

// Reset all demo data
export async function resetDemoData(req: Request, res: Response): Promise<void> {
  try {
    await Users.resetToDefault();
    await Staff.resetToDefault();
    await Guests.resetToDefault();
    await RoomTypes.resetToDefault();
    await Rooms.resetToDefault();
    await Reservations.resetToDefault();
    await Invoices.resetToDefault();
    await Payments.resetToDefault();
    await Services.resetToDefault();
    await ServiceRequests.resetToDefault();
    await HousekeepingTasks.resetToDefault();
    await MaintenanceRequests.resetToDefault();
    await Feedback.resetToDefault();
    await Notifications.resetToDefault();
    await SystemSettings.resetToDefault();
    await ActivityLogs.resetToDefault();

    res.json({ success: true, message: 'Demo data reset to factory initial state successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to reset demo data.' });
  }
}
