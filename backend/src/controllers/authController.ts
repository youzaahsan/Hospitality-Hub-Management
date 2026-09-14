import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { Users, Guests, logActivity, createNotification } from '../db/db';
import { generateToken } from '../middleware/auth';
import { UserRole } from '../models/types';

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { name, email, password, role = 'guest', phone } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
      return;
    }

    const existing = await Users.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      res.status(409).json({ success: false, message: 'An account with this email already exists.' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const validRole: UserRole = ['admin', 'manager', 'receptionist', 'housekeeping', 'guest'].includes(role)
      ? (role as UserRole)
      : 'guest';

    const user = await Users.create({
      name,
      email: email.toLowerCase().trim(),
      passwordHash,
      role: validRole,
      phone,
      isActive: true,
      avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=250`,
    });

    // If guest, create or link guest profile
    if (validRole === 'guest') {
      const existingGuest = await Guests.findOne({ email: email.toLowerCase().trim() });
      if (!existingGuest) {
        await Guests.create({
          userId: user._id,
          fullName: name,
          email: email.toLowerCase().trim(),
          phone: phone || '',
          vipStatus: false,
          totalStays: 0,
          totalSpent: 0,
        });
      }
    }

    await logActivity({
      userId: user._id,
      userName: user.name,
      userRole: user.role,
      action: 'USER_REGISTERED',
      entityType: 'auth',
      entityId: user._id,
      details: `New account registered for ${user.email} (${user.role}).`,
    });

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar,
      },
    });
  } catch (err: any) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: 'Internal server error during registration.' });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email and password are required.' });
      return;
    }

    const user = await Users.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid email or password.' });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({ success: false, message: 'Your account has been deactivated. Please contact administration.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid email or password.' });
      return;
    }

    const token = generateToken(user);

    await logActivity({
      userId: user._id,
      userName: user.name,
      userRole: user.role,
      action: 'USER_LOGGED_IN',
      entityType: 'auth',
      entityId: user._id,
      details: `User logged in from ${req.ip || 'web client'}.`,
    });

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar,
      },
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Internal server error during login.' });
  }
}

export async function getMe(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated.' });
      return;
    }

    const user = await Users.findById(req.user._id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch user profile.' });
  }
}

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ success: false, message: 'Email address is required.' });
    return;
  }

  const user = await Users.findOne({ email: email.toLowerCase().trim() });
  // Never expose if email exists or not for security, but return confirmation
  if (user) {
    await createNotification({
      userId: user._id,
      title: 'Password Reset Requested',
      message: 'A password reset request was received for your account. You may reset it using demo code "RESET2026".',
      type: 'warning',
    });
  }

  res.json({
    success: true,
    message: 'If that email is registered, password reset instructions have been dispatched.',
    demoResetCode: 'RESET2026',
  });
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  const { email, resetCode, newPassword } = req.body;
  if (!email || !newPassword) {
    res.status(400).json({ success: false, message: 'Email and new password are required.' });
    return;
  }

  if (resetCode && resetCode !== 'RESET2026') {
    res.status(400).json({ success: false, message: 'Invalid or expired reset code.' });
    return;
  }

  const user = await Users.findOne({ email: email.toLowerCase().trim() });
  if (!user) {
    res.status(404).json({ success: false, message: 'User account not found.' });
    return;
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await Users.findByIdAndUpdate(user._id, { passwordHash });

  await logActivity({
    userId: user._id,
    userName: user.name,
    userRole: user.role,
    action: 'PASSWORD_RESET',
    entityType: 'auth',
    entityId: user._id,
    details: 'Password was successfully reset.',
  });

  res.json({ success: true, message: 'Password has been updated. Please log in with your new credentials.' });
}
