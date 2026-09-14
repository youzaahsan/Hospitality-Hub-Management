import { Request, Response } from 'express';
import {
  Services,
  ServiceRequests,
  Reservations,
  Invoices,
  logActivity,
  createNotification,
} from '../db/db';

export async function getServices(req: Request, res: Response): Promise<void> {
  try {
    const { category } = req.query;
    let list = await Services.find({ isActive: true });
    if (category && category !== 'all') {
      list = list.filter((s) => s.category === category);
    }
    res.json({ success: true, count: list.length, data: list });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch services.' });
  }
}

export async function createService(req: Request, res: Response): Promise<void> {
  try {
    const { name, category, description, price, unit, iconName } = req.body;
    if (!name || !category || !price) {
      res.status(400).json({ success: false, message: 'Name, category, and price are required.' });
      return;
    }

    const service = await Services.create({
      name,
      category,
      description: description || '',
      price: Number(price),
      unit: unit || 'per order',
      iconName: iconName || 'Sparkles',
      isActive: true,
    });

    await logActivity({
      userName: req.user?.name || 'Staff',
      userRole: req.user?.role || 'staff',
      action: 'SERVICE_CREATED',
      entityType: 'service',
      entityId: service._id,
      details: `Created new service item: ${service.name} at $${service.price} ${service.unit}.`,
    });

    res.status(201).json({ success: true, message: 'Service created successfully.', data: service });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create service.' });
  }
}

export async function updateService(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const updated = await Services.findByIdAndUpdate(id, req.body);
    if (!updated) {
      res.status(404).json({ success: false, message: 'Service not found.' });
      return;
    }
    res.json({ success: true, message: 'Service updated.', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update service.' });
  }
}

export async function deleteService(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    await Services.findByIdAndUpdate(id, { isActive: false });
    res.json({ success: true, message: 'Service deactivated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete service.' });
  }
}

export async function getServiceRequests(req: Request, res: Response): Promise<void> {
  try {
    const { status, reservationId, guestId, roomNumber } = req.query;
    let list = await ServiceRequests.find({});

    if (status && status !== 'all') {
      list = list.filter((r) => r.status === status);
    }
    if (reservationId && reservationId !== 'all') {
      list = list.filter((r) => r.reservationId === reservationId);
    }
    if (guestId && guestId !== 'all') {
      list = list.filter((r) => r.guestId === guestId);
    }
    if (roomNumber && roomNumber !== 'all') {
      list = list.filter((r) => r.roomNumber === roomNumber);
    }

    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json({ success: true, count: list.length, data: list });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch service requests.' });
  }
}

export async function createServiceRequest(req: Request, res: Response): Promise<void> {
  try {
    const { reservationId, serviceId, quantity = 1, notes } = req.body;

    if (!reservationId || !serviceId) {
      res.status(400).json({ success: false, message: 'Reservation ID and Service ID are required.' });
      return;
    }

    const reservation = await Reservations.findById(reservationId);
    if (!reservation) {
      res.status(404).json({ success: false, message: 'Active reservation not found.' });
      return;
    }

    const service = await Services.findById(serviceId);
    if (!service) {
      res.status(404).json({ success: false, message: 'Service not found.' });
      return;
    }

    const qty = Math.max(1, Number(quantity) || 1);
    const totalPrice = Number((service.price * qty).toFixed(2));
    const requestNumber = `SR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newRequest = await ServiceRequests.create({
      requestNumber,
      reservationId,
      guestId: reservation.guestId,
      guestName: reservation.guestName,
      roomNumber: reservation.roomNumber,
      serviceId,
      serviceName: service.name,
      quantity: qty,
      unitPrice: service.price,
      totalPrice,
      status: 'pending',
      notes,
      requestedDate: new Date().toISOString(),
    });

    // Update reservation's serviceTotal and grandTotal
    const newServiceTotal = Number(((reservation.serviceTotal || 0) + totalPrice).toFixed(2));
    const subtotal = reservation.roomTotal + newServiceTotal;
    const taxable = Math.max(0, subtotal - (reservation.discountAmount || 0));
    const taxAmount = Number((taxable * reservation.taxRate).toFixed(2));
    const grandTotal = Number((taxable + taxAmount).toFixed(2));
    const balanceDue = Number((grandTotal - reservation.amountPaid).toFixed(2));

    await Reservations.findByIdAndUpdate(reservationId, {
      serviceTotal: newServiceTotal,
      taxAmount,
      grandTotal,
      balanceDue,
    });

    // Also update invoice items if invoice exists
    const invoice = await Invoices.findOne({ reservationId });
    if (invoice && invoice.status !== 'paid') {
      const items = [...invoice.items];
      items.push({
        description: `${service.name} (Qty: ${qty})`,
        category: 'service',
        quantity: qty,
        unitPrice: service.price,
        total: totalPrice,
      });

      await Invoices.findByIdAndUpdate(invoice._id, {
        items,
        subtotal,
        taxAmount,
        total: grandTotal,
        balance: balanceDue,
      });
    }

    await logActivity({
      userName: req.user?.name || reservation.guestName,
      userRole: req.user?.role || 'guest',
      action: 'SERVICE_REQUESTED',
      entityType: 'service',
      entityId: newRequest._id,
      details: `Service requested: ${service.name} (Qty ${qty}, $${totalPrice}) for Room ${reservation.roomNumber} (${reservation.guestName}).`,
    });

    await createNotification({
      targetRole: 'all',
      title: 'New Service Request',
      message: `Room ${reservation.roomNumber} requested: ${service.name} ($${totalPrice}).`,
      type: 'info',
    });

    res.status(201).json({
      success: true,
      message: `Service request ${requestNumber} submitted successfully.`,
      data: newRequest,
    });
  } catch (err: any) {
    console.error('createServiceRequest error:', err);
    res.status(500).json({ success: false, message: 'Failed to create service request.' });
  }
}

export async function updateServiceRequestStatus(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { status, assignedStaffId, notes } = req.body;

    const current = await ServiceRequests.findById(id);
    if (!current) {
      res.status(404).json({ success: false, message: 'Service request not found.' });
      return;
    }

    const update: any = { status };
    if (assignedStaffId) update.assignedStaffId = assignedStaffId;
    if (notes) update.notes = notes;
    if (status === 'completed') update.fulfilledDate = new Date().toISOString();

    const updated = await ServiceRequests.findByIdAndUpdate(id, update);

    await logActivity({
      userName: req.user?.name || 'Staff',
      userRole: req.user?.role || 'staff',
      action: 'SERVICE_REQUEST_STATUS',
      entityType: 'service',
      entityId: id,
      details: `Service request ${current.requestNumber} status changed to '${status}'.`,
    });

    res.json({ success: true, message: `Status updated to ${status}.`, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update service request status.' });
  }
}
