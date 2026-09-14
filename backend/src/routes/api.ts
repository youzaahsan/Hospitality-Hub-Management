import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import * as authController from '../controllers/authController';
import * as roomController from '../controllers/roomController';
import * as reservationController from '../controllers/reservationController';
import * as checkInOutController from '../controllers/checkInOutController';
import * as billingController from '../controllers/billingController';
import * as serviceController from '../controllers/serviceController';
import * as housekeepingController from '../controllers/housekeepingController';
import * as maintenanceController from '../controllers/maintenanceController';
import * as feedbackController from '../controllers/feedbackController';
import * as notificationController from '../controllers/notificationController';
import * as reportAnalyticsController from '../controllers/reportAnalyticsController';
import * as userController from '../controllers/userController';

const router = Router();

// ===================== AUTH ROUTES =====================
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.get('/auth/me', authenticate, authController.getMe);
router.post('/auth/forgot-password', authController.forgotPassword);
router.post('/auth/reset-password', authController.resetPassword);

// ===================== ROOMS & ROOM TYPES =====================
router.get('/rooms', roomController.getRooms);
router.get('/rooms/:id', roomController.getRoomById);
router.post('/rooms', authenticate, authorize('admin', 'manager'), roomController.createRoom);
router.put('/rooms/:id', authenticate, authorize('admin', 'manager', 'receptionist', 'housekeeping'), roomController.updateRoom);
router.delete('/rooms/:id', authenticate, authorize('admin'), roomController.deleteRoom);

router.get('/room-types', roomController.getRoomTypes);
router.post('/room-types', authenticate, authorize('admin', 'manager'), roomController.createRoomType);
router.put('/room-types/:id', authenticate, authorize('admin', 'manager'), roomController.updateRoomType);

// Live availability checking
router.get('/availability', roomController.checkAvailability);

// ===================== RESERVATIONS =====================
router.get('/reservations', authenticate, reservationController.getReservations);
router.get('/reservations/my-bookings', authenticate, reservationController.getMyBookings);
router.get('/reservations/:id', authenticate, reservationController.getReservationById);
router.post('/reservations', authenticate, reservationController.createReservation);
router.put('/reservations/:id', authenticate, reservationController.updateReservation);
router.post('/reservations/:id/cancel', authenticate, reservationController.cancelReservation);

// ===================== CHECK-IN & CHECK-OUT =====================
router.post('/check-in', authenticate, authorize('admin', 'manager', 'receptionist'), checkInOutController.processCheckIn);
router.post('/check-out', authenticate, authorize('admin', 'manager', 'receptionist'), checkInOutController.processCheckOut);

// ===================== BILLING, INVOICES, PAYMENTS =====================
router.get('/invoices', authenticate, billingController.getInvoices);
router.get('/invoices/:id', authenticate, billingController.getInvoiceById);
router.get('/payments', authenticate, billingController.getPayments);
router.post('/payments', authenticate, authorize('admin', 'manager', 'receptionist'), billingController.recordPayment);
router.get('/billing/reservation/:id/calculate', authenticate, billingController.calculateFolio);

// ===================== HOTEL SERVICES =====================
router.get('/services', serviceController.getServices);
router.post('/services', authenticate, authorize('admin', 'manager'), serviceController.createService);
router.put('/services/:id', authenticate, authorize('admin', 'manager'), serviceController.updateService);
router.delete('/services/:id', authenticate, authorize('admin'), serviceController.deleteService);

router.get('/service-requests', authenticate, serviceController.getServiceRequests);
router.post('/service-requests', authenticate, serviceController.createServiceRequest);
router.put('/service-requests/:id/status', authenticate, serviceController.updateServiceRequestStatus);

// ===================== HOUSEKEEPING =====================
router.get('/housekeeping', authenticate, housekeepingController.getHousekeepingTasks);
router.post('/housekeeping', authenticate, authorize('admin', 'manager', 'receptionist', 'housekeeping'), housekeepingController.createHousekeepingTask);
router.put('/housekeeping/:id/status', authenticate, authorize('admin', 'manager', 'housekeeping'), housekeepingController.updateHousekeepingStatus);
router.put('/housekeeping/:id/assign', authenticate, authorize('admin', 'manager'), housekeepingController.assignHousekeepingTask);

// ===================== MAINTENANCE =====================
router.get('/maintenance', authenticate, maintenanceController.getMaintenanceRequests);
router.post('/maintenance', authenticate, maintenanceController.createMaintenanceRequest);
router.put('/maintenance/:id/status', authenticate, authorize('admin', 'manager'), maintenanceController.updateMaintenanceStatus);

// ===================== FEEDBACK =====================
router.get('/feedback', feedbackController.getFeedback);
router.post('/feedback', feedbackController.submitFeedback);
router.post('/feedback/:id/respond', authenticate, authorize('admin', 'manager'), feedbackController.respondToFeedback);

// ===================== NOTIFICATIONS =====================
router.get('/notifications', authenticate, notificationController.getNotifications);
router.put('/notifications/:id/read', authenticate, notificationController.markAsRead);
router.put('/notifications/mark-all-read', authenticate, notificationController.markAllAsRead);

// ===================== REPORTS & ANALYTICS =====================
router.get('/analytics/dashboard', authenticate, authorize('admin', 'manager'), reportAnalyticsController.getDashboardAnalytics);
router.get('/reports', authenticate, authorize('admin', 'manager'), reportAnalyticsController.getReports);

// ===================== USERS, STAFF, GUESTS =====================
router.get('/users', authenticate, authorize('admin'), userController.getUsers);
router.put('/users/:id', authenticate, authorize('admin'), userController.updateUser);
router.get('/staff', authenticate, authorize('admin', 'manager'), userController.getStaff);
router.post('/staff', authenticate, authorize('admin'), userController.createStaff);
router.get('/guests', authenticate, authorize('admin', 'manager', 'receptionist'), userController.getGuests);
router.put('/guests/:id', authenticate, authorize('admin', 'manager', 'receptionist'), userController.updateGuest);

// ===================== SETTINGS & ACTIVITY LOGS =====================
router.get('/settings', userController.getSettings);
router.put('/settings', authenticate, authorize('admin'), userController.updateSettings);
router.get('/activity-logs', authenticate, authorize('admin', 'manager'), userController.getActivityLogs);

// System Demo Reset
router.post('/system/reset-demo', authenticate, authorize('admin'), userController.resetDemoData);

export default router;
