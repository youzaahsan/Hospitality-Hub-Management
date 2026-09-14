import { Request, Response } from 'express';
import {
  Invoices,
  Payments,
  Reservations,
  ServiceRequests,
  SystemSettings,
  logActivity,
  createNotification,
} from '../db/db';

export async function getInvoices(req: Request, res: Response): Promise<void> {
  try {
    const { status, guestId, search } = req.query;
    let list = await Invoices.find({});

    if (status && status !== 'all') {
      list = list.filter((inv) => inv.status === status);
    }
    if (guestId && guestId !== 'all') {
      list = list.filter((inv) => inv.guestId === guestId);
    }
    if (search) {
      const q = String(search).toLowerCase();
      list = list.filter(
        (inv) =>
          inv.invoiceNumber.toLowerCase().includes(q) ||
          inv.guestName.toLowerCase().includes(q) ||
          inv.roomNumber.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json({ success: true, count: list.length, data: list });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch invoices.' });
  }
}

export async function getInvoiceById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const invoice = await Invoices.findById(id);
    if (!invoice) {
      res.status(404).json({ success: false, message: 'Invoice not found.' });
      return;
    }

    // Fetch payments associated with this invoice or reservation
    const payments = await Payments.find({
      $or: [{ invoiceId: id }, { reservationId: invoice.reservationId }],
    });

    const settings = (await SystemSettings.findOne({})) || {};

    res.json({
      success: true,
      data: {
        ...invoice,
        payments,
        hotelDetails: settings,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch invoice.' });
  }
}

export async function getPayments(req: Request, res: Response): Promise<void> {
  try {
    const { method, reservationId, guestId } = req.query;
    let list = await Payments.find({});

    if (method && method !== 'all') {
      list = list.filter((p) => p.paymentMethod === method);
    }
    if (reservationId && reservationId !== 'all') {
      list = list.filter((p) => p.reservationId === reservationId);
    }
    if (guestId && guestId !== 'all') {
      list = list.filter((p) => p.guestId === guestId);
    }

    list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    res.json({ success: true, count: list.length, data: list });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch payments.' });
  }
}

export async function recordPayment(req: Request, res: Response): Promise<void> {
  try {
    const {
      invoiceId,
      reservationId,
      amount,
      paymentMethod = 'card',
      referenceNumber,
      notes,
    } = req.body;

    if (!amount || amount <= 0) {
      res.status(400).json({ success: false, message: 'A positive payment amount is required.' });
      return;
    }

    let invoice = invoiceId ? await Invoices.findById(invoiceId) : null;
    let reservation = reservationId ? await Reservations.findById(reservationId) : null;

    if (!invoice && reservation) {
      invoice = await Invoices.findOne({ reservationId: reservation._id });
    }
    if (!reservation && invoice) {
      reservation = await Reservations.findById(invoice.reservationId);
    }

    if (!invoice && !reservation) {
      res.status(400).json({ success: false, message: 'Valid invoice ID or reservation ID is required.' });
      return;
    }

    const payAmount = Number(Number(amount).toFixed(2));
    const guestId = invoice?.guestId || reservation?.guestId || '';
    const guestName = invoice?.guestName || reservation?.guestName || 'Guest';

    const paymentNumber = `PAY-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const ref = referenceNumber || `REF-${Date.now().toString().slice(-6)}`;

    const payment = await Payments.create({
      paymentNumber,
      invoiceId: invoice?._id || '',
      reservationId: reservation?._id || '',
      guestId,
      guestName,
      amount: payAmount,
      paymentMethod,
      status: 'completed',
      referenceNumber: ref,
      notes,
      recordedBy: req.user?.name || 'Staff',
      date: new Date().toISOString(),
    });

    // Update invoice if exists
    if (invoice) {
      const newPaid = Number(((invoice.amountPaid || 0) + payAmount).toFixed(2));
      const newBalance = Number(Math.max(0, invoice.total - newPaid).toFixed(2));
      const newStatus = newBalance <= 0 ? 'paid' : 'issued';

      await Invoices.findByIdAndUpdate(invoice._id, {
        amountPaid: newPaid,
        balance: newBalance,
        status: newStatus,
        paidAt: newBalance <= 0 ? new Date().toISOString() : invoice.paidAt,
      });
    }

    // Update reservation payment state
    if (reservation) {
      const newPaid = Number(((reservation.amountPaid || 0) + payAmount).toFixed(2));
      const newBalance = Number(Math.max(0, reservation.grandTotal - newPaid).toFixed(2));
      let paymentStatus = reservation.paymentStatus;

      if (newBalance <= 0) paymentStatus = 'paid';
      else if (newPaid > 0) paymentStatus = 'partially_paid';

      await Reservations.findByIdAndUpdate(reservation._id, {
        amountPaid: newPaid,
        balanceDue: newBalance,
        paymentStatus,
      });
    }

    await logActivity({
      userId: req.user?._id,
      userName: req.user?.name || 'Cashier',
      userRole: req.user?.role || 'receptionist',
      action: 'PAYMENT_RECORDED',
      entityType: 'payment',
      entityId: payment._id,
      details: `Recorded payment of $${payAmount} via ${paymentMethod} for ${guestName}. Reference: ${ref}.`,
    });

    await createNotification({
      targetRole: 'all',
      title: 'Payment Received',
      message: `Payment of $${payAmount} received for ${guestName} (${paymentMethod}).`,
      type: 'success',
    });

    res.status(201).json({
      success: true,
      message: `Payment ${paymentNumber} recorded successfully.`,
      data: payment,
    });
  } catch (err: any) {
    console.error('recordPayment error:', err);
    res.status(500).json({ success: false, message: 'Failed to record payment.' });
  }
}

// Calculate authoritative folio for a reservation
export async function calculateFolio(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const reservation = await Reservations.findById(id);
    if (!reservation) {
      res.status(404).json({ success: false, message: 'Reservation not found.' });
      return;
    }

    const services = await ServiceRequests.find({
      reservationId: id,
      status: { $ne: 'cancelled' as any },
    });

    const serviceTotal = services.reduce((sum, s) => sum + (s.totalPrice || 0), 0);
    const roomTotal = reservation.roomTotal;
    const discountAmount = reservation.discountAmount || 0;
    const subtotal = roomTotal + serviceTotal;
    const taxable = Math.max(0, subtotal - discountAmount);
    const taxAmount = Number((taxable * reservation.taxRate).toFixed(2));
    const grandTotal = Number((taxable + taxAmount).toFixed(2));
    const amountPaid = reservation.amountPaid || 0;
    const balanceDue = Number(Math.max(0, grandTotal - amountPaid).toFixed(2));

    const payments = await Payments.find({ reservationId: id });

    res.json({
      success: true,
      data: {
        reservationId: id,
        reservationNumber: reservation.reservationNumber,
        guestName: reservation.guestName,
        roomNumber: reservation.roomNumber,
        numberOfNights: reservation.numberOfNights,
        roomRate: reservation.roomRate,
        roomTotal,
        serviceTotal,
        services,
        discountAmount,
        subtotal,
        taxRate: reservation.taxRate,
        taxAmount,
        grandTotal,
        amountPaid,
        balanceDue,
        paymentStatus: reservation.paymentStatus,
        payments,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to calculate folio.' });
  }
}
