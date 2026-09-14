export type UserRole = 'admin' | 'manager' | 'receptionist' | 'housekeeping' | 'guest';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  isActive?: boolean;
}

export interface RoomType {
  _id: string;
  name: string;
  code: string;
  description: string;
  basePrice: number;
  capacity: number;
  bedType: string;
  sizeSqFt: number;
  amenities: string[];
  images: string[];
  isActive: boolean;
}

export type RoomStatus = 'available' | 'reserved' | 'occupied' | 'cleaning' | 'maintenance' | 'out_of_service';

export interface Room {
  _id: string;
  roomNumber: string;
  roomTypeId: string;
  roomType?: RoomType;
  floor: number;
  pricePerNight: number;
  status: RoomStatus;
  description?: string;
  features: string[];
  images: string[];
  lastCleaned?: string;
  isActive: boolean;
}

export type ReservationStatus = 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show';
export type PaymentStatus = 'unpaid' | 'partially_paid' | 'paid' | 'refunded';

export interface Reservation {
  _id: string;
  reservationNumber: string;
  guestId: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  roomId: string;
  roomNumber: string;
  roomTypeId: string;
  roomTypeName: string;
  checkInDate: string;
  checkOutDate: string;
  actualCheckInTime?: string;
  actualCheckOutTime?: string;
  adults: number;
  children: number;
  numberOfNights: number;
  roomRate: number;
  roomTotal: number;
  serviceTotal: number;
  taxRate: number;
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

export interface InvoiceItem {
  description: string;
  category: 'room' | 'service' | 'tax' | 'discount';
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  _id: string;
  invoiceNumber: string;
  reservationId: string;
  guestId: string;
  guestName: string;
  guestEmail: string;
  roomNumber: string;
  checkInDate: string;
  checkOutDate: string;
  items: InvoiceItem[];
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
  payments?: Payment[];
  hotelDetails?: SystemSetting;
}

export interface Payment {
  _id: string;
  paymentNumber: string;
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
}

export interface HotelService {
  _id: string;
  name: string;
  category: 'dining' | 'spa' | 'transport' | 'laundry' | 'room_service' | 'concierge';
  description: string;
  price: number;
  unit: string;
  iconName?: string;
  isActive: boolean;
}

export type ServiceRequestStatus = 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';

export interface ServiceRequest {
  _id: string;
  requestNumber: string;
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
}

export type HousekeepingPriority = 'low' | 'normal' | 'high' | 'urgent';
export type HousekeepingStatus = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'inspected';

export interface HousekeepingTask {
  _id: string;
  taskNumber: string;
  roomId: string;
  roomNumber: string;
  taskType: 'checkout_cleaning' | 'daily_refresh' | 'deep_clean' | 'inspection' | 'turndown';
  priority: HousekeepingPriority;
  status: HousekeepingStatus;
  assignedTo?: string;
  assignedToName?: string;
  scheduledDate: string;
  startedAt?: string;
  completedAt?: string;
  inspectedBy?: string;
  notes?: string;
  issuesReported?: string;
  createdAt: string;
}

export type MaintenancePriority = 'low' | 'medium' | 'high' | 'critical';
export type MaintenanceStatus = 'open' | 'assigned' | 'in_progress' | 'resolved' | 'closed';

export interface MaintenanceRequest {
  _id: string;
  ticketNumber: string;
  roomId?: string;
  roomNumber?: string;
  facilityArea?: string;
  title: string;
  description: string;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  reportedBy: string;
  assignedStaffName?: string;
  resolutionNotes?: string;
  estimatedCost?: number;
  reportedAt: string;
  resolvedAt?: string;
  createdAt: string;
}

export interface FeedbackItem {
  _id: string;
  reservationId?: string;
  guestId?: string;
  guestName: string;
  guestEmail?: string;
  rating: number;
  categories?: {
    cleanliness: number;
    staff: number;
    comfort: number;
    facilities: number;
    valueForMoney: number;
  };
  title?: string;
  comment?: string;
  comments?: string;
  response?: string;
  respondedBy?: string;
  respondedAt?: string;
  isPublished?: boolean;
  createdAt: string;
}

export type Feedback = FeedbackItem;

export interface NotificationItem {
  _id: string;
  userId: string;
  targetRole?: UserRole | 'all';
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface Guest {
  _id: string;
  userId?: string;
  fullName: string;
  email: string;
  phone: string;
  idType?: string;
  idNumber?: string;
  address?: string;
  nationality?: string;
  vipStatus: boolean;
  totalStays: number;
  totalSpent: number;
  notes?: string;
}

export interface StaffMember {
  _id: string;
  userId: string;
  name?: string;
  email?: string;
  role?: string;
  employeeId: string;
  department: string;
  position: string;
  shift: 'morning' | 'evening' | 'night';
  salary?: number;
  hireDate: string;
  status: 'active' | 'on_leave' | 'terminated';
}

export interface ActivityLog {
  _id: string;
  userId?: string;
  userName: string;
  userRole: string;
  action: string;
  entityType: string;
  entityId?: string;
  details: string;
  createdAt: string;
}

export interface SystemSetting {
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
}
