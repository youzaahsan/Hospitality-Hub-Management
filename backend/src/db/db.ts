import fs from 'fs';
import path from 'path';
import {
  IUser,
  IStaff,
  IGuest,
  IRoomType,
  IRoom,
  IReservation,
  IInvoice,
  IPayment,
  IService,
  IServiceRequest,
  IHousekeepingTask,
  IMaintenanceRequest,
  IFeedback,
  INotification,
  ISystemSetting,
  IActivityLog,
} from '../models/types';
import {
  initialUsers,
  initialStaff,
  initialGuests,
  initialRoomTypes,
  initialRooms,
  initialServices,
  initialReservations,
  initialInvoices,
  initialPayments,
  initialServiceRequests,
  initialHousekeepingTasks,
  initialMaintenanceRequests,
  initialFeedback,
  initialNotifications,
  initialActivityLogs,
  defaultSettings,
} from '../seed/seedData';

const DATA_DIR = path.resolve(process.cwd(), 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export type FilterQuery<T> = {
  [K in keyof T]?: T[K] | { $in?: any[]; $gte?: any; $lte?: any; $ne?: any; $regex?: RegExp | string };
} & {
  $or?: FilterQuery<T>[];
  $and?: FilterQuery<T>[];
};

export class Collection<T extends { _id: string }> {
  private filePath: string;
  private name: string;
  private cache: T[] | null = null;

  constructor(name: string, private initialData: T[]) {
    this.name = name;
    this.filePath = path.join(DATA_DIR, `${name}.json`);
    this.initialize();
  }

  private initialize() {
    try {
      if (!fs.existsSync(this.filePath)) {
        this.cache = [...this.initialData];
        fs.writeFileSync(this.filePath, JSON.stringify(this.initialData, null, 2), 'utf-8');
      } else {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        this.cache = JSON.parse(raw);
      }
    } catch (err) {
      console.error(`Error initializing collection ${this.name}:`, err);
      this.cache = [...this.initialData];
    }
  }

  private persist() {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.cache || [], null, 2), 'utf-8');
    } catch (err) {
      console.error(`Error saving collection ${this.name}:`, err);
    }
  }

  private matches(item: T, filter: FilterQuery<T>): boolean {
    for (const key of Object.keys(filter) as (keyof FilterQuery<T>)[]) {
      if (key === '$or') {
        const orConditions = filter.$or as FilterQuery<T>[];
        if (!orConditions.some((cond) => this.matches(item, cond))) {
          return false;
        }
        continue;
      }
      if (key === '$and') {
        const andConditions = filter.$and as FilterQuery<T>[];
        if (!andConditions.every((cond) => this.matches(item, cond))) {
          return false;
        }
        continue;
      }

      const itemVal = item[key as unknown as keyof T];
      const condVal = filter[key];

      if (condVal && typeof condVal === 'object' && !Array.isArray(condVal)) {
        const condObj = condVal as any;
        if (condObj.$in && Array.isArray(condObj.$in)) {
          if (!condObj.$in.includes(itemVal)) return false;
        }
        if (condObj.$ne !== undefined) {
          if (itemVal === condObj.$ne) return false;
        }
        if (condObj.$gte !== undefined) {
          if ((itemVal as any) < condObj.$gte) return false;
        }
        if (condObj.$lte !== undefined) {
          if ((itemVal as any) > condObj.$lte) return false;
        }
        if (condObj.$regex !== undefined) {
          const reg = typeof condObj.$regex === 'string' ? new RegExp(condObj.$regex, 'i') : condObj.$regex;
          if (!reg.test(String(itemVal || ''))) return false;
        }
      } else {
        if (itemVal !== condVal) {
          return false;
        }
      }
    }
    return true;
  }

  public async find(
    filter: FilterQuery<T> = {},
    options?: { sort?: Record<string, 1 | -1>; skip?: number; limit?: number }
  ): Promise<T[]> {
    if (!this.cache) this.initialize();
    let results = (this.cache || []).filter((item) => this.matches(item, filter));

    if (options?.sort) {
      const [sortField, sortOrder] = Object.entries(options.sort)[0] || [];
      if (sortField) {
        results = [...results].sort((a: any, b: any) => {
          const valA = a[sortField];
          const valB = b[sortField];
          if (valA < valB) return sortOrder === 1 ? -1 : 1;
          if (valA > valB) return sortOrder === 1 ? 1 : -1;
          return 0;
        });
      }
    }

    if (options?.skip) {
      results = results.slice(options.skip);
    }
    if (options?.limit) {
      results = results.slice(0, options.limit);
    }

    return JSON.parse(JSON.stringify(results));
  }

  public async findOne(filter: FilterQuery<T>): Promise<T | null> {
    if (!this.cache) this.initialize();
    const item = (this.cache || []).find((i) => this.matches(i, filter));
    return item ? JSON.parse(JSON.stringify(item)) : null;
  }

  public async findById(id: string): Promise<T | null> {
    if (!this.cache) this.initialize();
    const item = (this.cache || []).find((i) => i._id === id);
    return item ? JSON.parse(JSON.stringify(item)) : null;
  }

  public async create(data: any): Promise<T> {
    if (!this.cache) this.initialize();
    const now = new Date().toISOString();
    const newItem: any = {
      _id: data._id || `${this.name.slice(0, 3)}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now,
      ...data,
    };
    this.cache!.unshift(newItem);
    this.persist();
    return JSON.parse(JSON.stringify(newItem));
  }

  public async findByIdAndUpdate(id: string, update: Partial<T>): Promise<T | null> {
    if (!this.cache) this.initialize();
    const idx = (this.cache || []).findIndex((i) => i._id === id);
    if (idx === -1) return null;

    const updated = {
      ...this.cache![idx],
      ...update,
      _id: id,
      updatedAt: new Date().toISOString(),
    };
    this.cache![idx] = updated;
    this.persist();
    return JSON.parse(JSON.stringify(updated));
  }

  public async findByIdAndDelete(id: string): Promise<boolean> {
    if (!this.cache) this.initialize();
    const initialLen = this.cache!.length;
    this.cache = this.cache!.filter((i) => i._id !== id);
    if (this.cache.length !== initialLen) {
      this.persist();
      return true;
    }
    return false;
  }

  public async countDocuments(filter: FilterQuery<T> = {}): Promise<number> {
    if (!this.cache) this.initialize();
    return (this.cache || []).filter((item) => this.matches(item, filter)).length;
  }

  public async resetToDefault(): Promise<void> {
    this.cache = JSON.parse(JSON.stringify(this.initialData));
    this.persist();
  }
}

// Collections instances
export const Users = new Collection<IUser>('users', initialUsers);
export const Staff = new Collection<IStaff>('staff', initialStaff);
export const Guests = new Collection<IGuest>('guests', initialGuests);
export const RoomTypes = new Collection<IRoomType>('roomTypes', initialRoomTypes);
export const Rooms = new Collection<IRoom>('rooms', initialRooms);
export const Reservations = new Collection<IReservation>('reservations', initialReservations);
export const Invoices = new Collection<IInvoice>('invoices', initialInvoices);
export const Payments = new Collection<IPayment>('payments', initialPayments);
export const Services = new Collection<IService>('services', initialServices);
export const ServiceRequests = new Collection<IServiceRequest>('serviceRequests', initialServiceRequests);
export const HousekeepingTasks = new Collection<IHousekeepingTask>('housekeepingTasks', initialHousekeepingTasks);
export const MaintenanceRequests = new Collection<IMaintenanceRequest>('maintenanceRequests', initialMaintenanceRequests);
export const Feedback = new Collection<IFeedback>('feedback', initialFeedback);
export const Notifications = new Collection<INotification>('notifications', initialNotifications);
export const SystemSettings = new Collection<ISystemSetting>('settings', [defaultSettings]);
export const ActivityLogs = new Collection<IActivityLog>('activityLogs', initialActivityLogs);

// Global booking lock mutex to guarantee no double-booking race conditions
const bookingLocks = new Set<string>();

export async function acquireBookingLock<R>(roomId: string, action: () => Promise<R>): Promise<R> {
  while (bookingLocks.has(roomId)) {
    await new Promise((resolve) => setTimeout(resolve, 30));
  }
  bookingLocks.add(roomId);
  try {
    return await action();
  } finally {
    bookingLocks.delete(roomId);
  }
}

// Activity Logger helper
export async function logActivity(params: {
  userId?: string;
  userName: string;
  userRole: string;
  action: string;
  entityType: 'reservation' | 'room' | 'guest' | 'invoice' | 'payment' | 'housekeeping' | 'maintenance' | 'service' | 'auth';
  entityId?: string;
  details: string;
  ipAddress?: string;
}) {
  try {
    await ActivityLogs.create(params);
  } catch (err) {
    console.error('Failed to write activity log:', err);
  }
}

// Notification helper
export async function createNotification(params: {
  userId?: string;
  targetRole?: any;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'alert';
  link?: string;
}) {
  try {
    await Notifications.create({
      userId: params.userId || 'all',
      targetRole: params.targetRole || 'all',
      title: params.title,
      message: params.message,
      type: params.type || 'info',
      link: params.link,
      isRead: false,
    });
  } catch (err) {
    console.error('Failed to create notification:', err);
  }
}
