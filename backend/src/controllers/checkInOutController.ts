import { Request, Response } from 'express';
import {
  Reservations,
  Rooms,
  Guests,
  Invoices,
  Payments,
  ServiceRequests,
  HousekeepingTasks,
  logActivity,
  createNotification,
} from '../db/db';

export async function processCheckIn(req: Request, res: Response): Promise<void> {
  try {
    const { reservationId, keycardCount = 2, idVerified = true, notes } = req.body;

    if (!reservationId) {
      res.status(400).json({ success: false, message: 'Reservation ID is required for check-in.' });
      return;
    }

    // 1. Verify reservation
    const reservation = await Reservations.findById(reservationId);
    if (!reservation) {
      res.status(404).json({ success: false, message: 'Reservation not found.' });
      return;
    }

    if (reservation.status === 'checked_in') {
      res.status(400).json({ success: false, message: 'Guest is already checked in.' });
      return;
    }

    if (reservation.status === 'checked_out' || reservation.status === 'cancelled') {
      res.status(400).json({ success: false, message: `Cannot check in. Reservation status is '${reservation.status}'.` });
      return;
    }

    // 2. Verify guest
    const guest = await Guests.findById(reservation.guestId);

    // 3. Verify room
    const room = await Rooms.findById(reservation.roomId);
    if (!room) {
      res.status(404).json({ success: false, message: 'Assigned room not found.' });
      return;
    }

    // 4. Verify room availability/status
    if (room.status === 'occupied') {
      res.status(409).json({ success: false, message: `Room ${room.roomNumber} is currently occupied by another guest.` });
      return;
    }
    if (room.status === 'maintenance' || room.status === 'out_of_service') {
      res.status(409).json({ success: false, message: `Room ${room.roomNumber} is unavailable due to ${room.status}.` });
      return;
    }

    // 5. Check-in timestamps and user
    const checkInTime = new Date().toISOString();
    const staffName = req.user?.name || 'Front Desk Staff';

    // 6. Update reservation
    const updatedReservation = await Reservations.findByIdAndUpdate(reservationId, {
      status: 'checked_in',
      actualCheckInTime: checkInTime,
      checkedInBy: staffName,
    });

    // 7. Change room status to Occupied
    await Rooms.findByIdAndUpdate(room._id, { status: 'occupied' });

    // 8. Log activity
    await logActivity({
      userId: req.user?._id,
      userName: staffName,
      userRole: req.user?.role || 'receptionist',
      action: 'GUEST_CHECK_IN',
      entityType: 'reservation',
      entityId: reservationId,
      details: `Checked in guest ${reservation.guestName} into Room ${room.roomNumber} (${reservation.roomTypeName}). ${keycardCount} keycard(s) issued. ID verified: ${idVerified}.`,
    });

    // 9. Generate notification
    await createNotification({
      targetRole: 'all',
      title: 'Guest Checked In',
      message: `${reservation.guestName} has arrived and checked into Room ${room.roomNumber}.`,
      type: 'info',
    });

    res.json({
      success: true,
      message: `Check-in completed successfully for ${reservation.guestName} in Room ${room.roomNumber}.`,
      data: {
        reservation: updatedReservation,
        roomNumber: room.roomNumber,
        checkInTime,
      },
    });
  } catch (err: any) {
    console.error('Check-in error:', err);
    res.status(500).json({ success: false, message: 'An error occurred during check-in.' });
  }
}

export async function processCheckOut(req: Request, res: Response): Promise<void> {
  try {
    const {
      reservationId,
      paymentMethod = 'card',
      settlePayment = true,
      referenceNumber,
      notes,
    } = req.body;

    if (!reservationId) {
      res.status(400).json({ success: false, message: 'Reservation ID is required for check-out.' });
      return;
    }

    // 1. Verify active reservation
    const reservation = await Reservations.findById(reservationId);
    if (!reservation) {
      res.status(404).json({ success: false, message: 'Reservation not found.' });
      return;
    }

    if (reservation.status !== 'checked_in') {
      res.status(400).json({
        success: false,
        message: `Cannot check out reservation with status '${reservation.status}'. Guest must be checked in.`,
      });
      return;
    }

    const room = await Rooms.findById(reservation.roomId);

    // 2. Aggregate all service charges for this reservation
    const serviceRequests = await ServiceRequests.find({
      reservationId,
      status: { $ne: 'cancelled' as any },
    });

    const serviceTotal = serviceRequests.reduce((sum, sr) => sum + (sr.totalPrice || 0), 0);

    // 3. Authoritative recalculation of final folio
    const roomTotal = reservation.roomTotal;
    const discountAmount = reservation.discountAmount || 0;
    const subtotal = roomTotal + serviceTotal;
    const taxable = Math.max(0, subtotal - discountAmount);
    const taxAmount = Number((taxable * reservation.taxRate).toFixed(2));
    const grandTotal = Number((taxable + taxAmount).toFixed(2));
    let amountPaid = reservation.amountPaid || 0;
    let balanceDue = Number((grandTotal - amountPaid).toFixed(2));

    let newPaymentRecord = null;

    // Settle balance if requested
    if (settlePayment && balanceDue > 0) {
      const paymentAmount = balanceDue;
      const paymentNumber = `PAY-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const refNum = referenceNumber || `AUTH-SETTLE-${Date.now().toString().slice(-6)}`;

      newPaymentRecord = await Payments.create({
        paymentNumber,
        invoiceId: '', // linked below
        reservationId,
        guestId: reservation.guestId,
        guestName: reservation.guestName,
        amount: paymentAmount,
        paymentMethod,
        status: 'completed',
        referenceNumber: refNum,
        notes: `Check-out final folio settlement. ${notes || ''}`.trim(),
        recordedBy: req.user?.name || 'Front Desk',
        date: new Date().toISOString(),
      });

      amountPaid = grandTotal;
      balanceDue = 0;
    }

    const checkOutTime = new Date().toISOString();
    const staffName = req.user?.name || 'Front Desk Staff';

    // 4. Update reservation
    const updatedReservation = await Reservations.findByIdAndUpdate(reservationId, {
      status: 'checked_out',
      serviceTotal,
      taxAmount,
      grandTotal,
      amountPaid,
      balanceDue,
      paymentStatus: balanceDue <= 0 ? 'paid' : 'partially_paid',
      actualCheckOutTime: checkOutTime,
      checkedOutBy: staffName,
    });

    // 5. Change room status to 'cleaning'
    if (room) {
      await Rooms.findByIdAndUpdate(room._id, { status: 'cleaning' });
    }

    // 6. Automatically create housekeeping task
    const taskNumber = `HSK-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    await HousekeepingTasks.create({
      taskNumber,
      roomId: reservation.roomId,
      roomNumber: reservation.roomNumber,
      taskType: 'checkout_cleaning',
      priority: 'high',
      status: 'pending',
      scheduledDate: new Date().toISOString().split('T')[0],
      notes: `Immediate checkout deep clean for Room ${reservation.roomNumber}. Guest ${reservation.guestName} departed.`,
    });

    // 7. Finalize invoice
    let invoice = await Invoices.findOne({ reservationId });
    const invoiceItems: any[] = [
      {
        description: `${reservation.roomTypeName} (${reservation.numberOfNights} nights @ $${reservation.roomRate}/night)`,
        category: 'room',
        quantity: reservation.numberOfNights,
        unitPrice: reservation.roomRate,
        total: roomTotal,
      },
    ];

    for (const sr of serviceRequests) {
      invoiceItems.push({
        description: `${sr.serviceName} (Qty: ${sr.quantity})`,
        category: 'service',
        quantity: sr.quantity,
        unitPrice: sr.unitPrice,
        total: sr.totalPrice,
      });
    }

    if (discountAmount > 0) {
      invoiceItems.push({
        description: 'Applied Courtesy / VIP Discount',
        category: 'discount',
        quantity: 1,
        unitPrice: -discountAmount,
        total: -discountAmount,
      });
    }

    invoiceItems.push({
      description: `Hospitality & City Tax (${(reservation.taxRate * 100).toFixed(0)}%)`,
      category: 'tax',
      quantity: 1,
      unitPrice: taxAmount,
      total: taxAmount,
    });

    if (invoice) {
      await Invoices.findByIdAndUpdate(invoice._id, {
        items: invoiceItems,
        subtotal,
        taxAmount,
        discountAmount,
        total: grandTotal,
        amountPaid,
        balance: balanceDue,
        status: balanceDue <= 0 ? 'paid' : 'issued',
        paidAt: balanceDue <= 0 ? checkOutTime : undefined,
      });
      if (newPaymentRecord) {
        await Payments.findByIdAndUpdate(newPaymentRecord._id, { invoiceId: invoice._id });
      }
    } else {
      const invNum = `INV-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
      invoice = await Invoices.create({
        invoiceNumber: invNum,
        reservationId,
        guestId: reservation.guestId,
        guestName: reservation.guestName,
        guestEmail: reservation.guestEmail,
        roomNumber: reservation.roomNumber,
        checkInDate: reservation.checkInDate,
        checkOutDate: reservation.checkOutDate,
        items: invoiceItems,
        subtotal,
        taxAmount,
        discountAmount,
        total: grandTotal,
        amountPaid,
        balance: balanceDue,
        status: balanceDue <= 0 ? 'paid' : 'issued',
        dueDate: reservation.checkOutDate,
        issuedAt: checkOutTime,
        paidAt: balanceDue <= 0 ? checkOutTime : undefined,
      });
      if (newPaymentRecord) {
        await Payments.findByIdAndUpdate(newPaymentRecord._id, { invoiceId: invoice._id });
      }
    }

    // 8. Update guest statistics
    const guest = await Guests.findById(reservation.guestId);
    if (guest) {
      await Guests.findByIdAndUpdate(guest._id, {
        totalStays: (guest.totalStays || 0) + 1,
        totalSpent: Number(((guest.totalSpent || 0) + grandTotal).toFixed(2)),
      });
    }

    // 9. Activity Log
    await logActivity({
      userId: req.user?._id,
      userName: staffName,
      userRole: req.user?.role || 'staff',
      action: 'GUEST_CHECK_OUT',
      entityType: 'reservation',
      entityId: reservationId,
      details: `Completed check-out for ${reservation.guestName} (Room ${reservation.roomNumber}). Final folio: $${grandTotal}. Paid: $${amountPaid}. Room set to Cleaning. Housekeeping task created.`,
    });

    // 10. Notification
    await createNotification({
      targetRole: 'housekeeping',
      title: 'Checkout Cleaning Required',
      message: `Room ${reservation.roomNumber} has checked out. Deep cleaning task ${taskNumber} created.`,
      type: 'alert',
    });

    res.json({
      success: true,
      message: `Check-out completed successfully for ${reservation.guestName}. Room ${reservation.roomNumber} queued for housekeeping.`,
      data: {
        reservation: updatedReservation,
        invoice,
        payment: newPaymentRecord,
        grandTotal,
        balanceDue,
      },
    });
  } catch (err: any) {
    console.error('Check-out error:', err);
    res.status(500).json({ success: false, message: 'An error occurred during check-out.' });
  }
}
