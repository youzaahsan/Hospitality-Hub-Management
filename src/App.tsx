import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { NotificationsDrawer } from './components/notifications/NotificationsDrawer';
import { PublicWebsite } from './components/public/PublicWebsite';
import { BookingModal } from './components/public/BookingModal';
import { AnalyticsOverview } from './components/dashboard/AnalyticsOverview';
import { ReservationsView } from './components/reservations/ReservationsView';
import { CheckInOutCenter } from './components/checkinout/CheckInOutCenter';
import { RoomMatrixView } from './components/rooms/RoomMatrixView';
import { BillingView } from './components/billing/BillingView';
import { HousekeepingView } from './components/housekeeping/HousekeepingView';
import { ServicesView } from './components/services/ServicesView';
import { MaintenanceView } from './components/maintenance/MaintenanceView';
import { FeedbackView } from './components/feedback/FeedbackView';
import { StaffView } from './components/staff/StaffView';
import { ReportsView } from './components/reports/ReportsView';
import { Reservation } from './types';

const MainAppContent: React.FC = () => {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('overview');
  const [isPublicView, setIsPublicView] = useState<boolean>(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState<boolean>(false);

  // Cross-component workflow state
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [serviceOrderReservation, setServiceOrderReservation] = useState<Reservation | null>(null);

  const handleQuickAction = (action: string) => {
    if (action === 'new-reservation') {
      setIsBookingModalOpen(true);
    } else if (action === 'checkinout') {
      setCurrentTab('checkinout');
    }
  };

  const handleCheckIn = (res: Reservation) => {
    setCurrentTab('checkinout');
  };

  const handleCheckOut = (res: Reservation) => {
    setCurrentTab('checkinout');
  };

  const handleViewInvoice = (resIdOrInvoiceId: string) => {
    setSelectedInvoiceId(resIdOrInvoiceId);
    setCurrentTab('billing');
  };

  const handleOrderService = (res: Reservation) => {
    setServiceOrderReservation(res);
    setCurrentTab('services');
  };

  // If user chooses to view the Public Guest Experience
  if (isPublicView) {
    return (
      <div className="min-h-screen bg-white">
        <PublicWebsite
          onSwitchToStaff={() => setIsPublicView(false)}
          onBookNow={() => setIsBookingModalOpen(true)}
        />
        {isBookingModalOpen && (
          <BookingModal
            isOpen={isBookingModalOpen}
            onClose={() => setIsBookingModalOpen(false)}
            onBookingSuccess={() => {
              setIsBookingModalOpen(false);
              // Option to switch to staff or stay on public site
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col font-sans text-zinc-900 antialiased">
      {/* Header with quick switch to guest site */}
      <Header
        onToggleNotifications={() => setIsNotificationsOpen(!isNotificationsOpen)}
        onOpenPublicSite={() => setIsPublicView(true)}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Role-Based PMS Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={(tab) => {
            if (tab === 'public') {
              setIsPublicView(true);
            } else {
              setCurrentTab(tab);
            }
          }}
        />

        {/* Main Operational View Port */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {currentTab === 'overview' && (
              <AnalyticsOverview onQuickAction={handleQuickAction} />
            )}

            {currentTab === 'reservations' && (
              <ReservationsView
                onCheckIn={handleCheckIn}
                onCheckOut={handleCheckOut}
                onViewInvoice={handleViewInvoice}
                onNewReservation={() => setIsBookingModalOpen(true)}
                onOrderService={handleOrderService}
              />
            )}

            {currentTab === 'checkinout' && (
              <CheckInOutCenter
                onViewInvoice={handleViewInvoice}
                onRefreshAll={() => {}}
              />
            )}

            {currentTab === 'rooms' && <RoomMatrixView />}

            {currentTab === 'billing' && (
              <BillingView initialInvoiceId={selectedInvoiceId} />
            )}

            {currentTab === 'housekeeping' && <HousekeepingView />}

            {currentTab === 'services' && (
              <ServicesView initialReservation={serviceOrderReservation} />
            )}

            {currentTab === 'maintenance' && <MaintenanceView />}

            {currentTab === 'feedback' && <FeedbackView />}

            {currentTab === 'staff' && <StaffView />}

            {currentTab === 'reports' && <ReportsView />}
          </div>
        </main>
      </div>

      {/* Notifications Drawer */}
      <NotificationsDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />

      {/* Booking Modal */}
      {isBookingModalOpen && (
        <BookingModal
          isOpen={isBookingModalOpen}
          onClose={() => setIsBookingModalOpen(false)}
          onBookingSuccess={() => {
            setIsBookingModalOpen(false);
            setCurrentTab('reservations');
          }}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
