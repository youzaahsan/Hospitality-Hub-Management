import { Request, Response } from 'express';
import { Rooms, RoomTypes, Reservations, logActivity } from '../db/db';
import { IRoom } from '../models/types';

export async function getRooms(req: Request, res: Response): Promise<void> {
  try {
    const { status, roomTypeId, floor, search } = req.query;
    const filter: any = { isActive: true };

    if (status && status !== 'all') {
      filter.status = status;
    }
    if (roomTypeId && roomTypeId !== 'all') {
      filter.roomTypeId = roomTypeId;
    }
    if (floor && floor !== 'all') {
      filter.floor = Number(floor);
    }

    let rooms = await Rooms.find(filter);

    if (search) {
      const q = String(search).toLowerCase();
      rooms = rooms.filter((r) => r.roomNumber.toLowerCase().includes(q) || (r.description && r.description.toLowerCase().includes(q)));
    }

    // Enrich with roomType
    const roomTypes = await RoomTypes.find({});
    const typeMap = new Map(roomTypes.map((rt) => [rt._id, rt]));

    const enriched = rooms.map((room) => ({
      ...room,
      roomType: typeMap.get(room.roomTypeId) || null,
    }));

    res.json({ success: true, count: enriched.length, data: enriched });
  } catch (err: any) {
    console.error('getRooms error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch rooms.' });
  }
}

export async function getRoomById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const room = await Rooms.findById(id);
    if (!room) {
      res.status(404).json({ success: false, message: 'Room not found.' });
      return;
    }

    const roomType = await RoomTypes.findById(room.roomTypeId);
    res.json({ success: true, data: { ...room, roomType } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch room.' });
  }
}

export async function createRoom(req: Request, res: Response): Promise<void> {
  try {
    const { roomNumber, roomTypeId, floor, pricePerNight, status = 'available', description, features = [], images = [] } = req.body;

    if (!roomNumber || !roomTypeId || !floor || !pricePerNight) {
      res.status(400).json({ success: false, message: 'Room number, room type, floor, and price per night are required.' });
      return;
    }

    const existing = await Rooms.findOne({ roomNumber: String(roomNumber).trim() });
    if (existing) {
      res.status(409).json({ success: false, message: `Room ${roomNumber} already exists.` });
      return;
    }

    const roomType = await RoomTypes.findById(roomTypeId);
    if (!roomType) {
      res.status(400).json({ success: false, message: 'Invalid room type ID provided.' });
      return;
    }

    const room = await Rooms.create({
      roomNumber: String(roomNumber).trim(),
      roomTypeId,
      floor: Number(floor),
      pricePerNight: Number(pricePerNight),
      status,
      description: description || roomType.description,
      features: features.length ? features : roomType.amenities.slice(0, 4),
      images: images.length ? images : roomType.images,
      isActive: true,
      lastCleaned: new Date().toISOString(),
    });

    await logActivity({
      userName: req.user?.name || 'System Admin',
      userRole: req.user?.role || 'admin',
      action: 'ROOM_CREATED',
      entityType: 'room',
      entityId: room._id,
      details: `Created new Room ${room.roomNumber} (${roomType.name}, Floor ${room.floor}) at $${room.pricePerNight}/night.`,
    });

    res.status(201).json({ success: true, message: `Room ${room.roomNumber} created successfully.`, data: room });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to create room.' });
  }
}

export async function updateRoom(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const room = await Rooms.findById(id);
    if (!room) {
      res.status(404).json({ success: false, message: 'Room not found.' });
      return;
    }

    const updated = await Rooms.findByIdAndUpdate(id, req.body);

    await logActivity({
      userName: req.user?.name || 'Staff',
      userRole: req.user?.role || 'staff',
      action: 'ROOM_UPDATED',
      entityType: 'room',
      entityId: id,
      details: `Updated Room ${room.roomNumber}. Status: ${req.body.status || room.status}.`,
    });

    res.json({ success: true, message: `Room ${room.roomNumber} updated successfully.`, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to update room.' });
  }
}

export async function deleteRoom(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const room = await Rooms.findById(id);
    if (!room) {
      res.status(404).json({ success: false, message: 'Room not found.' });
      return;
    }

    // Check active reservations
    const activeRes = await Reservations.findOne({
      roomId: id,
      status: { $in: ['confirmed', 'checked_in'] as any },
    });
    if (activeRes) {
      res.status(409).json({ success: false, message: `Cannot delete room ${room.roomNumber} with active or upcoming reservations.` });
      return;
    }

    await Rooms.findByIdAndUpdate(id, { isActive: false });

    await logActivity({
      userName: req.user?.name || 'Admin',
      userRole: req.user?.role || 'admin',
      action: 'ROOM_DEACTIVATED',
      entityType: 'room',
      entityId: id,
      details: `Deactivated Room ${room.roomNumber}.`,
    });

    res.json({ success: true, message: `Room ${room.roomNumber} has been deactivated.` });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to delete room.' });
  }
}

export async function getRoomTypes(req: Request, res: Response): Promise<void> {
  try {
    const roomTypes = await RoomTypes.find({ isActive: true });
    res.json({ success: true, count: roomTypes.length, data: roomTypes });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch room types.' });
  }
}

export async function createRoomType(req: Request, res: Response): Promise<void> {
  try {
    const { name, code, description, basePrice, capacity, bedType, sizeSqFt, amenities = [], images = [] } = req.body;

    if (!name || !basePrice || !capacity) {
      res.status(400).json({ success: false, message: 'Room type name, base price, and capacity are required.' });
      return;
    }

    const roomType = await RoomTypes.create({
      name,
      code: code || name.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 6),
      description: description || '',
      basePrice: Number(basePrice),
      capacity: Number(capacity),
      bedType: bedType || 'King Bed',
      sizeSqFt: Number(sizeSqFt) || 500,
      amenities: Array.isArray(amenities) ? amenities : [],
      images: Array.isArray(images) && images.length ? images : ['https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&q=80&w=1000'],
      isActive: true,
    });

    res.status(201).json({ success: true, message: 'Room type created.', data: roomType });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to create room type.' });
  }
}

export async function updateRoomType(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const updated = await RoomTypes.findByIdAndUpdate(id, req.body);
    if (!updated) {
      res.status(404).json({ success: false, message: 'Room type not found.' });
      return;
    }
    res.json({ success: true, message: 'Room type updated.', data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to update room type.' });
  }
}

// REAL AVAILABILITY CHECK WITH DOUBLE-BOOKING PREVENTATIVE VALIDATION
export async function checkAvailability(req: Request, res: Response): Promise<void> {
  try {
    const { checkIn, checkOut, guests, roomTypeId } = req.query;

    if (!checkIn || !checkOut) {
      res.status(400).json({ success: false, message: 'Both check-in and check-out dates (YYYY-MM-DD) are required.' });
      return;
    }

    const checkInDate = String(checkIn);
    const checkOutDate = String(checkOut);

    if (checkInDate >= checkOutDate) {
      res.status(400).json({ success: false, message: 'Check-out date must be strictly after check-in date.' });
      return;
    }

    const guestCount = guests ? Number(guests) : 1;

    // Get all active room types and active rooms
    const allRoomTypes = await RoomTypes.find({ isActive: true });
    const typeMap = new Map(allRoomTypes.map((rt) => [rt._id, rt]));

    let candidateRooms = await Rooms.find({
      isActive: true,
      status: { $ne: 'out_of_service' as any },
    });

    if (roomTypeId && roomTypeId !== 'all') {
      candidateRooms = candidateRooms.filter((r) => r.roomTypeId === roomTypeId);
    }

    // Filter candidate rooms by capacity if guests specified
    candidateRooms = candidateRooms.filter((r) => {
      const type = typeMap.get(r.roomTypeId);
      return type ? type.capacity >= guestCount : true;
    });

    // Find all reservations that overlap with requested range
    // Overlap condition: res.checkInDate < requestedCheckOut && res.checkOutDate > requestedCheckIn
    const allActiveReservations = await Reservations.find({
      status: { $in: ['confirmed', 'checked_in'] as any },
    });

    const conflictingRoomIds = new Set<string>();
    for (const res of allActiveReservations) {
      if (res.checkInDate < checkOutDate && res.checkOutDate > checkInDate) {
        conflictingRoomIds.add(res.roomId);
      }
    }

    // Available rooms are candidate rooms NOT in conflictingRoomIds
    const availableRooms = candidateRooms
      .filter((r) => !conflictingRoomIds.has(r._id))
      .map((r) => ({
        ...r,
        roomType: typeMap.get(r.roomTypeId),
      }));

    // Calculate nights
    const diffTime = Math.abs(new Date(checkOutDate).getTime() - new Date(checkInDate).getTime());
    const numberOfNights = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

    res.json({
      success: true,
      checkInDate,
      checkOutDate,
      numberOfNights,
      guestCount,
      totalAvailable: availableRooms.length,
      availableRooms,
    });
  } catch (err: any) {
    console.error('checkAvailability error:', err);
    res.status(500).json({ success: false, message: 'Failed to verify availability.' });
  }
}
