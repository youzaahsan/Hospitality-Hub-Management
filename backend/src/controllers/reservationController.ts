import { Request, Response } from 'express';
import {
  Reservations,
  Rooms,
  RoomTypes,
  Guests,
  Invoices,
  SystemSettings,
  acquireBookingLock,
  logActivity,
  createNotification,
} from '../db/db';
import { IReservation, ReservationStatus, PaymentStatus } from '../models/types';

export async function getReservations(req: Request, res: Response): Promise<void> {
  try {
    const { status, search, roomId, guestId, startDate, endDate } = req.query;
    let list = await Reservations.find({});

    if (status && status !== 'all') {
      list = list.filter((r) => r.status === status);
    }
    if (roomId && roomId !== 'all') {
      list = list.filter((r) => r.roomId === roomId);
    }
    if (guestId && guestId !== 'all') {
      list = list.filter((r) => r.guestId === guestId);
    }
    if (startDate) {
      list = list.filter((r) => r.checkInDate >= String(startDate));
    }
    if (endDate) {
      list = list.filter((r) => r.checkOutDate <= String(endDate));
    }
    if (search) {
      const q = String(search).toLowerCase();
      list = list.filter(
        (r) =>
          r.reservationNumber.toLowerCase().includes(q) ||
          r.guestName.toLowerCase().includes(q) ||
          r.guestEmail.toLowerCase().includes(q) ||
          r.roomNumber.toLowerCase().includes(q)
      );
    }

    // Sort by check-in date descending
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({ success: true, count: list.length, data: list });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch reservations.' });
  }
}

export async function getMyBookings(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated.' });
      return;
    }

    // Find guest record matching user email
    const guest = await Guests.findOne({ email: req.user.email.toLowerCase() });
    let list: IReservation[] = [];

    if (guest) {
      list = await Reservations.find({ guestId: guest._id });
    } else {
      list = await Reservations.find({ guestEmail: req.user.email.toLowerCase() });
    }

    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json({ success: true, count: list.length, data: list });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch guest bookings.' });
  }
}

export async function getReservationById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const reservation = await Reservations.findById(id);
    if (!reservation) {
      res.status(404).json({ success: false, message: 'Reservation not found.' });
      return;
    }

    // Also get matching invoice if exists
    const invoice = await Invoices.findOne({ reservationId: id });

    res.json({ success: true, data: { ...reservation, invoice } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch reservation.' });
  }
}

export async function createReservation(req: Request, res: Response): Promise<void> {
  try {
    const {
      roomId,
      checkInDate,
      checkOutDate,
      guestName,
      guestEmail,
      guestPhone,
      guestId: providedGuestId,
      adults = 1,
      children = 0,
      specialRequests = '',
      discountAmount = 0,
      initialDeposit = 0,
    } = req.body;

    if (!roomId || !checkInDate || !checkOutDate || !guestName || !guestEmail) {
      res.status(400).json({
        success: false,
        message: 'Room ID, check-in date, check-out date, guest name, and guest email are required.',
      });
      return;
    }

    if (checkInDate >= checkOutDate) {
      res.status(400).json({ success: false, message: 'Check-out date must be strictly after check-in date.' });
      return;
    }

    const room = await Rooms.findById(roomId);
    if (!room || !room.isActive) {
      res.status(404).json({ success: false, message: 'Room not found or inactive.' });
      return;
    }

    const roomType = await RoomTypes.findById(room.roomTypeId);
    if (!roomType) {
      res.status(404).json({ success: false, message: 'Room type not found.' });
      return;
    }

    // Fetch system settings for tax rate
    const settings = (await SystemSettings.findOne({})) || { taxRatePercentage: 12 };
    const taxRate = (settings.taxRatePercentage || 12) / 100;

    // Use concurrency lock to validate and book room safely
    const newReservation = await acquireBookingLock(roomId, async () => {
      // Backend conflict check: overlapping reservations
      const conflicts = await Reservations.find({
        roomId,
        status: { $in: ['confirmed', 'checked_in'] as any },
      });

      for (const resItem of conflicts) {
        if (resItem.checkInDate < checkOutDate && resItem.checkOutDate > checkInDate) {
          throw new Error(`DOUBLE_BOOKING: Room ${room.roomNumber} is already booked for these dates (${resItem.checkInDate} to ${resItem.checkOutDate}).`);
        }
      }

      // Guest profile resolution
      let guestId = providedGuestId;
      if (!guestId) {
        let existingGuest = await Guests.findOne({ email: guestEmail.toLowerCase().trim() });
        if (!existingGuest) {
          existingGuest = await Guests.create({
            fullName: guestName,
            email: guestEmail.toLowerCase().trim(),
            phone: guestPhone || '',
            vipStatus: false,
            totalStays: 1,
            totalSpent: 0,
          });
        }
        guestId = existingGuest._id;
      }

      // Authoritative financial calculations
      const diffTime = Math.abs(new Date(checkOutDate).getTime() - new Date(checkInDate).getTime());
      const numberOfNights = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      const roomRate = room.pricePerNight;
      const roomTotal = numberOfNights * roomRate;
      const serviceTotal = 0;
      const validDiscount = Math.max(0, Number(discountAmount) || 0);
      const taxableAmount = Math.max(0, roomTotal + serviceTotal - validDiscount);
      const taxAmount = Number((taxableAmount * taxRate).toFixed(2));
      const grandTotal = Number((taxableAmount + taxAmount).toFixed(2));
      const paid = Math.min(grandTotal, Math.max(0, Number(initialDeposit) || 0));
      const balanceDue = Number((grandTotal - paid).toFixed(2));

      let paymentStatus: PaymentStatus = 'unpaid';
      if (paid >= grandTotal) paymentStatus = 'paid';
      else if (paid > 0) paymentStatus = 'partially_paid';

      const reservationNumber = `LUX-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const created = await Reservations.create({
        reservationNumber,
        guestId,
        guestName,
        guestEmail: guestEmail.toLowerCase().trim(),
        guestPhone: guestPhone || '',
        roomId: room._id,
        roomNumber: room.roomNumber,
        roomTypeId: roomType._id,
        roomTypeName: roomType.name,
        checkInDate,
        checkOutDate,
        adults: Number(adults) || 1,
        children: Number(children) || 0,
        numberOfNights,
        roomRate,
        roomTotal,
        serviceTotal,
        taxRate,
        taxAmount,
        discountAmount: validDiscount,
        grandTotal,
        amountPaid: paid,
        balanceDue,
        paymentStatus,
        status: 'confirmed',
        specialRequests,
      });

      // Automatically generate initial invoice
      const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
      await Invoices.create({
        invoiceNumber,
        reservationId: created._id,
        guestId,
        guestName,
        guestEmail: guestEmail.toLowerCase().trim(),
        roomNumber: room.roomNumber,
        checkInDate,
        checkOutDate,
        items: [
          {
            description: `${roomType.name} (${numberOfNights} night${numberOfNights > 1 ? 's' : ''} @ $${roomRate}/night)`,
            category: 'room',
            quantity: numberOfNights,
            unitPrice: roomRate,
            total: roomTotal,
          },
          ...(validDiscount > 0
            ? [{ description: 'Special Courtesy Discount', category: 'discount' as const, quantity: 1, unitPrice: -validDiscount, total: -validDiscount }]
            : []),
          {
            description: `Occupancy & Hospitality Tax (${(taxRate * 100).toFixed(0)}%)`,
            category: 'tax',
            quantity: 1,
            unitPrice: taxAmount,
            total: taxAmount,
          },
        ],
        subtotal: roomTotal,
        taxAmount,
        discountAmount: validDiscount,
        total: grandTotal,
        amountPaid: paid,
        balance: balanceDue,
        status: paid >= grandTotal ? 'paid' : 'issued',
        dueDate: checkInDate,
        issuedAt: new Date().toISOString(),
      });

      // Update room status if check-in is today
      const todayStr = new Date().toISOString().split('T')[0];
      if (checkInDate === todayStr && room.status === 'available') {
        await Rooms.findByIdAndUpdate(roomId, { status: 'reserved' });
      }

      return created;
    });

    await logActivity({
      userName: req.user?.name || guestName,
      userRole: req.user?.role || 'guest',
      action: 'RESERVATION_CREATED',
      entityType: 'reservation',
      entityId: newReservation._id,
      details: `Created reservation ${newReservation.reservationNumber} for ${guestName} in Room ${room.roomNumber} (${checkInDate} to ${checkOutDate}). Total: $${newReservation.grandTotal}.`,
    });

    await createNotification({
      targetRole: 'all',
      title: 'New Reservation Confirmed',
      message: `${guestName} booked Room ${room.roomNumber} (${roomType.name}) for ${checkInDate} to ${checkOutDate}.`,
      type: 'success',
      link: `/admin/reservations/${newReservation._id}`,
    });

    res.status(201).json({
      success: true,
      message: `Reservation ${newReservation.reservationNumber} confirmed successfully.`,
      data: newReservation,
    });
  } catch (err: any) {
    if (err.message && err.message.startsWith('DOUBLE_BOOKING')) {
      res.status(409).json({ success: false, message: err.message.replace('DOUBLE_BOOKING: ', '') });
      return;
    }
    console.error('createReservation error:', err);
    res.status(500).json({ success: false, message: 'Failed to create reservation.' });
  }
}

export async function updateReservation(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const current = await Reservations.findById(id);
    if (!current) {
      res.status(404).json({ success: false, message: 'Reservation not found.' });
      return;
    }

    const { checkInDate, checkOutDate, specialRequests, adults, children, guestPhone } = req.body;

    // If dates changed, verify no conflicts
    if (checkInDate && checkOutDate && (checkInDate !== current.checkInDate || checkOutDate !== current.checkOutDate)) {
      const conflicts = await Reservations.find({
        roomId: current.roomId,
        status: { $in: ['confirmed', 'checked_in'] as any },
      });

      for (const item of conflicts) {
        if (item._id !== current._id && item.checkInDate < checkOutDate && item.checkOutDate > checkInDate) {
          res.status(409).json({
            success: false,
            message: `Selected dates conflict with an existing reservation on Room ${current.roomNumber}.`,
          });
          return;
        }
      }

      // Recalculate nights and amounts
      const diffTime = Math.abs(new Date(checkOutDate).getTime() - new Date(checkInDate).getTime());
      const numberOfNights = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      const roomTotal = numberOfNights * current.roomRate;
      const subtotal = roomTotal + current.serviceTotal;
      const taxable = Math.max(0, subtotal - current.discountAmount);
      const taxAmount = Number((taxable * current.taxRate).toFixed(2));
      const grandTotal = Number((taxable + taxAmount).toFixed(2));
      const balanceDue = Number((grandTotal - current.amountPaid).toFixed(2));

      const updated = await Reservations.findByIdAndUpdate(id, {
        checkInDate,
        checkOutDate,
        numberOfNights,
        roomTotal,
        taxAmount,
        grandTotal,
        balanceDue,
        specialRequests: specialRequests !== undefined ? specialRequests : current.specialRequests,
        adults: adults !== undefined ? Number(adults) : current.adults,
        children: children !== undefined ? Number(children) : current.children,
        guestPhone: guestPhone !== undefined ? guestPhone : current.guestPhone,
      });

      res.json({ success: true, message: 'Reservation updated successfully.', data: updated });
      return;
    }

    const updated = await Reservations.findByIdAndUpdate(id, {
      specialRequests: specialRequests !== undefined ? specialRequests : current.specialRequests,
      adults: adults !== undefined ? Number(adults) : current.adults,
      children: children !== undefined ? Number(children) : current.children,
      guestPhone: guestPhone !== undefined ? guestPhone : current.guestPhone,
    });

    res.json({ success: true, message: 'Reservation updated.', data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to update reservation.' });
  }
}

export async function cancelReservation(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { reason = 'Cancelled by guest request' } = req.body;

    const reservation = await Reservations.findById(id);
    if (!reservation) {
      res.status(404).json({ success: false, message: 'Reservation not found.' });
      return;
    }

    if (reservation.status === 'checked_in') {
      res.status(400).json({ success: false, message: 'Cannot cancel an actively checked-in reservation. Please perform check-out instead.' });
      return;
    }

    if (reservation.status === 'checked_out' || reservation.status === 'cancelled') {
      res.status(400).json({ success: false, message: `Reservation is already ${reservation.status}.` });
      return;
    }

    const updated = await Reservations.findByIdAndUpdate(id, {
      status: 'cancelled',
      cancellationReason: reason,
    });

    // Check if room needs status change
    const room = await Rooms.findById(reservation.roomId);
    if (room && room.status === 'reserved') {
      await Rooms.findByIdAndUpdate(reservation.roomId, { status: 'available' });
    }

    // Cancel related invoice if unpaid
    const invoice = await Invoices.findOne({ reservationId: id });
    if (invoice && invoice.status !== 'paid') {
      await Invoices.findByIdAndUpdate(invoice._id, { status: 'cancelled' });
    }

    await logActivity({
      userName: req.user?.name || reservation.guestName,
      userRole: req.user?.role || 'guest',
      action: 'RESERVATION_CANCELLED',
      entityType: 'reservation',
      entityId: id,
      details: `Cancelled reservation ${reservation.reservationNumber} for ${reservation.guestName}. Reason: ${reason}.`,
    });

    await createNotification({
      targetRole: 'all',
      title: 'Reservation Cancelled',
      message: `Reservation ${reservation.reservationNumber} for ${reservation.guestName} has been cancelled.`,
      type: 'warning',
    });

    res.json({ success: true, message: `Reservation ${reservation.reservationNumber} cancelled.`, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to cancel reservation.' });
  }
}
