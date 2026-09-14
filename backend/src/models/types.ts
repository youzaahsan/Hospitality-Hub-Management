export type UserRole = 'admin' | 'manager' | 'receptionist' | 'housekeeping' | 'guest';

export interface IUser {
  _id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IStaff {
  _id: string;
  userId: string;
  employeeId: string;
  department: string;
  position: string;
  shift: 'morning' | 'evening' | 'night';
  salary?: number;
  hireDate: string;
  emergencyContact?: string;
  status: 'active' | 'on_leave' | 'terminated';
}

export interface IGuest {
  _id: string;
  userId?: string;
  fullName: string;
  email: string;
  phone: string;
  idType?: 'passport' | 'national_id' | 'driver_license';
  idNumber?: string;
  address?: string;
  nationality?: string;
  vipStatus: boolean;
  totalStays: number;
  totalSpent: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IRoomType {
  _id: string;
  name: string; // Standard, Deluxe, Executive Suite, Presidential Suite, Royal Penthouse
  code: string;
  description: string;
  basePrice: number;
  capacity: number; // max guests
  bedType: string;
  sizeSqFt: number;
  amenities: string[];
  images: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type RoomStatus = 'available' | 'reserved' | 'occupied' | 'cleaning' | 'maintenance' | 'out_of_service';

export interface IRoom {
  _id: string;
  roomNumber: string;
  roomTypeId: string;
  floor: number;
  pricePerNight: number;
  status: RoomStatus;
  description?: string;
  features: string[];
  images: string[];
  lastCleaned?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ReservationStatus = 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show';
export type PaymentStatus = 'unpaid' | 'partially_paid' | 'paid' | 'refunded';

export interface IReservation {
  _id: string;
  reservationNumber: string; // e.g., LUX-2026-001
  guestId: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  roomId: string;
  roomNumber: string;
  roomTypeId: string;
  roomTypeName: string;
  checkInDate: string; // YYYY-MM-DD
  checkOutDate: string; // YYYY-MM-DD
  actualCheckInTime?: string;
  actualCheckOutTime?: string;
  adults: number;
  children: number;
  numberOfNights: number;
  roomRate: number;
  roomTotal: number;
  serviceTotal: number;
  taxRate: number; // e.g. 0.12 (12%)
  taxAmount: number;
  discountAmount: number;
  grandTotal: number;
  amountPaid: number;
  balanceDue: number;
  paymentStatus: PaymentStatus;
  status: ReservationStatus;
  specialRequests?: string;
  checkedInBy?: string;
  checkedOutBy?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IInvoice {
  _id: string;
  invoiceNumber: string; // INV-2026-0001
  reservationId: string;
  guestId: string;
  guestName: string;
  guestEmail: string;
  roomNumber: string;
  checkInDate: string;
  checkOutDate: string;
  items: Array<{
    description: string;
    category: 'room' | 'service' | 'tax' | 'discount';
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  amountPaid: number;
  balance: number;
  status: 'draft' | 'issued' | 'paid' | 'cancelled';
  dueDate: string;
  issuedAt: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IPayment {
  _id: string;
  paymentNumber: string; // PAY-2026-0001
  invoiceId: string;
  reservationId: string;
  guestId: string;
  guestName: string;
  amount: number;
  paymentMethod: 'cash' | 'card' | 'bank_transfer';
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  referenceNumber: string;
  notes?: string;
  recordedBy: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface IService {
  _id: string;
  name: string;
  category: 'dining' | 'spa' | 'transport' | 'laundry' | 'room_service' | 'concierge';
  description: string;
  price: number;
  unit: string; // per order, per hour, per item, etc.
  iconName?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ServiceRequestStatus = 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';

export interface IServiceRequest {
  _id: string;
  requestNumber: string; // SR-2026-0001
  reservationId: string;
  guestId: string;
  guestName: string;
  roomNumber: string;
  serviceId: string;
  serviceName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status: ServiceRequestStatus;
  notes?: string;
  requestedDate: string;
  fulfilledDate?: string;
  assignedStaffId?: string;
  createdAt: string;
  updatedAt: string;
}

export type HousekeepingPriority = 'low' | 'normal' | 'high' | 'urgent';
export type HousekeepingStatus = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'inspected';

export interface IHousekeepingTask {
  _id: string;
  taskNumber: string;
  roomId: string;
  roomNumber: string;
  taskType: 'checkout_cleaning' | 'daily_refresh' | 'deep_clean' | 'inspection' | 'turndown';
  priority: HousekeepingPriority;
  status: HousekeepingStatus;
  assignedTo?: string; // staff ID or name
  assignedToName?: string;
  scheduledDate: string;
  startedAt?: string;
  completedAt?: string;
  inspectedBy?: string;
  notes?: string;
  issuesReported?: string;
  createdAt: string;
  updatedAt: string;
}

export type MaintenancePriority = 'low' | 'medium' | 'high' | 'critical';
export type MaintenanceStatus = 'open' | 'assigned' | 'in_progress' | 'resolved' | 'closed';

export interface IMaintenanceRequest {
  _id: string;
  ticketNumber: string;
  roomId?: string;
  roomNumber?: string;
  facilityArea?: string; // e.g., 'Spa', 'Lobby AC', 'Elevator B'
  title: string;
  description: string;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  reportedBy: string;
  assignedStaffId?: string;
  assignedStaffName?: string;
  resolutionNotes?: string;
  estimatedCost?: number;
  reportedAt: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IFeedback {
  _id: string;
  reservationId?: string;
  guestId?: string;
  guestName: string;
  guestEmail: string;
  rating: number; // 1 to 5
  categories: {
    cleanliness: number;
    staff: number;
    comfort: number;
    facilities: number;
    valueForMoney: number;
  };
  title: string;
  comment: string;
  response?: string;
  respondedBy?: string;
  respondedAt?: string;
  isPublished: boolean;
  createdAt: string;
}

export interface INotification {
  _id: string;
  userId: string; // 'all' or specific user/guest
  targetRole?: UserRole | 'all';
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface IActivityLog {
  _id: string;
  userId?: string;
  userName: string;
  userRole: string;
  action: string;
  entityType: 'reservation' | 'room' | 'guest' | 'invoice' | 'payment' | 'housekeeping' | 'maintenance' | 'service' | 'auth';
  entityId?: string;
  details: string;
  ipAddress?: string;
  createdAt: string;
}

export interface ISystemSetting {
  _id: string;
  hotelName: string;
  hotelAddress: string;
  hotelPhone: string;
  hotelEmail: string;
  hotelWebsite: string;
  taxRatePercentage: number;
  currencySymbol: string;
  currencyCode: string;
  checkInTime: string;
  checkOutTime: string;
  cancellationPolicyHours: number;
  updatedAt: string;
}
