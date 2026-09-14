import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Filter,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
  KeyRound,
  Eye,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { Reservation, ReservationStatus } from '../../types';
import { api } from '../../services/api';
import { StatusBadge } from '../common/Badge';

interface ReservationsViewProps {
  onCheckIn: (reservation: Reservation) => void;
  onCheckOut: (reservation: Reservation) => void;
  onViewInvoice: (reservationId: string) => void;
  onNewReservation: () => void;
  onOrderService: (reservation: Reservation) => void;
}

export const ReservationsView: React.FC<ReservationsViewProps> = ({
  onCheckIn,
  onCheckOut,
  onViewInvoice,
  onNewReservation,
  onOrderService,
}) => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedResForDetail, setSelectedResForDetail] = useState<Reservation | null>(null);

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ success: boolean; data: Reservation[] }>('/reservations');
      if (res.success) {
        setReservations(res.data);
      }
    } catch (err) {
      console.error('Failed to load reservations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  const handleCancel = async (id: string) => {
    const reason = window.prompt('Please enter reason for cancellation:');
    if (reason === null) return;

    try {
      await api.post(`/reservations/${id}/cancel`, { reason });
      await fetchReservations();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel reservation');
    }
  };

  // Filtering
  const filtered = reservations.filter((r) => {
    const matchesSearch =
      r.reservationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.guestEmail.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-5">
      {/* Top Header & Search Bar */}
      <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-serif font-bold text-zinc-900">Reservations & Bookings</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Active guest stays, confirmed arrivals, and automated folio ledger accounts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchReservations}
            className="p-2 text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 rounded-xl transition-colors"
            title="Refresh list"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={onNewReservation}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            New Reservation
          </button>
        </div>
      </div>

      {/* Filters & Search input */}
      <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search guest, suite #, or LUX-2026..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 border border-zinc-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {['all', 'confirmed', 'checked_in', 'checked_out', 'cancelled'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize whitespace-nowrap transition-colors ${
                statusFilter === st
                  ? 'bg-zinc-900 text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Reservations Table */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-600">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 uppercase tracking-wider font-semibold text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Reservation #</th>
                <th className="py-3.5 px-4">Guest</th>
                <th className="py-3.5 px-4">Suite / Villa</th>
                <th className="py-3.5 px-4">Dates</th>
                <th className="py-3.5 px-4">Folio Total</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-400">
                    Loading reservations...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-400">
                    No reservations matching current filters.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r._id} className="hover:bg-zinc-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-medium text-zinc-900">
                      {r.reservationNumber}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-zinc-900">{r.guestName}</div>
                      <div className="text-[11px] text-zinc-400">{r.guestEmail}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-medium text-zinc-800">{r.roomTypeName}</div>
                      <div className="text-[11px] text-zinc-400">Room {r.roomNumber}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div>
                        {r.checkInDate} → {r.checkOutDate}
                      </div>
                      <div className="text-[11px] text-zinc-400">{r.numberOfNights} nights</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-zinc-900">${r.grandTotal.toFixed(2)}</div>
                      <div className="text-[10px]">
                        {r.balanceDue > 0 ? (
                          <span className="text-amber-700 font-medium">Due: ${r.balanceDue.toFixed(2)}</span>
                        ) : (
                          <span className="text-emerald-700 font-medium">Fully Paid</span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge status={r.status} type="reservation" />
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {/* Check In action */}
                        {r.status === 'confirmed' && (
                          <button
                            onClick={() => onCheckIn(r)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] rounded-md transition-colors"
                            title="Process Guest Arrival Check-In"
                          >
                            Check In
                          </button>
                        )}

                        {/* Check Out action */}
                        {r.status === 'checked_in' && (
                          <button
                            onClick={() => onCheckOut(r)}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[11px] rounded-md transition-colors"
                            title="Settle Folio & Check Out"
                          >
                            Check Out
                          </button>
                        )}

                        {/* Order Service */}
                        {r.status === 'checked_in' && (
                          <button
                            onClick={() => onOrderService(r)}
                            className="p-1.5 text-zinc-500 hover:text-amber-700 hover:bg-zinc-100 rounded-md transition-colors"
                            title="Add In-Room Dining or Spa Service"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* View Folio / Invoice */}
                        <button
                          onClick={() => onViewInvoice(r._id)}
                          className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors"
                          title="View Invoice & Folio"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>

                        {/* Cancel */}
                        {(r.status === 'confirmed' || r.status === 'pending') && (
                          <button
                            onClick={() => handleCancel(r._id)}
                            className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                            title="Cancel Booking"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
