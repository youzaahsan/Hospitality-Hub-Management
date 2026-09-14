import React, { useState, useEffect } from 'react';
import { X, Calendar, User, Mail, Phone, CheckCircle, ShieldCheck, Sparkles } from 'lucide-react';
import { Room, RoomType } from '../../types';
import { api } from '../../services/api';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRoomType?: RoomType | null;
  initialCheckIn?: string;
  initialCheckOut?: string;
  onBookingSuccess?: (reservation: any) => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  selectedRoomType,
  initialCheckIn,
  initialCheckOut,
  onBookingSuccess,
}) => {
  const [checkInDate, setCheckInDate] = useState(
    initialCheckIn || new Date().toISOString().split('T')[0]
  );
  const [checkOutDate, setCheckOutDate] = useState(
    initialCheckOut || new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]
  );
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [selectedTypeId, setSelectedTypeId] = useState<string>(selectedRoomType?._id || '');
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);

  // Guest details
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');

  // Status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedReservation, setConfirmedReservation] = useState<any | null>(null);

  useEffect(() => {
    async function loadTypes() {
      try {
        const res = await api.get<{ success: boolean; data: RoomType[] }>('/room-types');
        if (res.success) {
          setRoomTypes(res.data);
          if (!selectedTypeId && res.data.length > 0) {
            setSelectedTypeId(res.data[0]._id);
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadTypes();
  }, []);

  useEffect(() => {
    if (selectedRoomType) {
      setSelectedTypeId(selectedRoomType._id);
    }
  }, [selectedRoomType]);

  const activeType = roomTypes.find((t) => t._id === selectedTypeId);

  // Calculate pricing
  const nights = Math.max(
    1,
    Math.round(
      (new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / (1000 * 60 * 60 * 24)
    )
  );
  const rate = activeType ? activeType.basePrice : 0;
  const roomTotal = rate * nights;
  const tax = Number((roomTotal * 0.12).toFixed(2));
  const grandTotal = Number((roomTotal + tax).toFixed(2));

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName || !guestEmail || !guestPhone) {
      setError('Please provide your full name, email address, and phone number.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        guestName,
        guestEmail,
        guestPhone,
        roomTypeId: selectedTypeId,
        checkInDate,
        checkOutDate,
        adults: Number(adults),
        children: Number(children),
        specialRequests,
      };

      const res = await api.post<{ success: boolean; data: any; message: string }>('/reservations', payload);
      if (res.success && res.data) {
        setConfirmedReservation(res.data);
        if (onBookingSuccess) onBookingSuccess(res.data);
      } else {
        setError(res.message || 'Booking failed.');
      }
    } catch (err: any) {
      setError(err.message || 'Unable to confirm reservation. Please check room availability.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-zinc-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 bg-zinc-950 text-white flex items-center justify-between border-b border-zinc-800">
          <div>
            <div className="text-amber-400 text-xs tracking-wider uppercase font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Direct Luxury Reservation
            </div>
            <h2 className="text-lg font-serif font-bold text-white mt-0.5">The Grand Imperial & Spa</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {confirmedReservation ? (
          /* Confirmation Receipt View */
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-200 text-emerald-600">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-serif font-bold text-zinc-900">Reservation Confirmed</h3>
            <p className="text-sm text-zinc-500 mt-1">
              Confirmation Number:{' '}
              <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-mono">
                {confirmedReservation.reservationNumber}
              </span>
            </p>

            <div className="mt-6 p-4 rounded-xl bg-zinc-50 border border-zinc-200 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-zinc-500">Guest:</span>
                <span className="font-semibold text-zinc-900">{confirmedReservation.guestName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Suite:</span>
                <span className="font-semibold text-zinc-900">
                  {confirmedReservation.roomTypeName} (Room {confirmedReservation.roomNumber})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Dates:</span>
                <span className="font-semibold text-zinc-900">
                  {confirmedReservation.checkInDate} to {confirmedReservation.checkOutDate} ({confirmedReservation.numberOfNights} nights)
                </span>
              </div>
              <div className="flex justify-between border-t border-zinc-200 pt-2 text-sm font-bold">
                <span>Total Folio:</span>
                <span className="text-amber-800">${confirmedReservation.grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <p className="text-xs text-zinc-500 mt-4">
              A copy of your reservation confirmation and arrival instructions has been recorded in the hotel system.
            </p>

            <div className="mt-6 flex justify-center">
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
              >
                Close & Return
              </button>
            </div>
          </div>
        ) : (
          /* Booking Form */
          <form onSubmit={handleBook} className="p-6 space-y-5">
            {error && (
              <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
                {error}
              </div>
            )}

            {/* Room Type Selector */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">
                Select Suite / Villa
              </label>
              <select
                value={selectedTypeId}
                onChange={(e) => setSelectedTypeId(e.target.value)}
                className="w-full text-sm border border-zinc-300 rounded-lg px-3 py-2 bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-medium"
              >
                {roomTypes.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name} — ${t.basePrice}/night (Capacity: {t.capacity} guests)
                  </option>
                ))}
              </select>
            </div>

            {/* Dates & Guests Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-600 mb-1">Check-in</label>
                <input
                  type="date"
                  value={checkInDate}
                  onChange={(e) => setCheckInDate(e.target.value)}
                  className="w-full text-xs border border-zinc-300 rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-600 mb-1">Check-out</label>
                <input
                  type="date"
                  value={checkOutDate}
                  min={checkInDate}
                  onChange={(e) => setCheckOutDate(e.target.value)}
                  className="w-full text-xs border border-zinc-300 rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-600 mb-1">Adults</label>
                <select
                  value={adults}
                  onChange={(e) => setAdults(Number(e.target.value))}
                  className="w-full text-xs border border-zinc-300 rounded-lg px-2 py-1.5 focus:outline-hidden"
                >
                  <option value={1}>1 Adult</option>
                  <option value={2}>2 Adults</option>
                  <option value={3}>3 Adults</option>
                  <option value={4}>4 Adults</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-600 mb-1">Children</label>
                <select
                  value={children}
                  onChange={(e) => setChildren(Number(e.target.value))}
                  className="w-full text-xs border border-zinc-300 rounded-lg px-2 py-1.5 focus:outline-hidden"
                >
                  <option value={0}>None</option>
                  <option value={1}>1 Child</option>
                  <option value={2}>2 Children</option>
                </select>
              </div>
            </div>

            {/* Guest Info */}
            <div className="space-y-3 pt-2 border-t border-zinc-100">
              <h4 className="text-xs font-semibold text-zinc-700 uppercase tracking-wider">
                Guest Primary Details
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-zinc-600 mb-1">Full Legal Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Lord Marcus Vance"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full text-xs border border-zinc-300 rounded-lg px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-600 mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="marcus.vance@luxury.com"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    className="w-full text-xs border border-zinc-300 rounded-lg px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-zinc-600 mb-1">Telephone / WhatsApp</label>
                <input
                  type="tel"
                  placeholder="+1 (555) 345-9801"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  className="w-full text-xs border border-zinc-300 rounded-lg px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] text-zinc-600 mb-1">Special Preferences / Concierge Notes</label>
                <textarea
                  rows={2}
                  placeholder="High floor preference, feather-free pillows, airport transfer requests..."
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  className="w-full text-xs border border-zinc-300 rounded-lg px-3 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Price Breakdown Box */}
            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 text-xs text-zinc-700 space-y-1.5">
              <div className="flex justify-between">
                <span>{nights} night(s) × ${rate.toFixed(2)}:</span>
                <span className="font-semibold text-zinc-900">${roomTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-zinc-600">
                <span>Hospitality & Resort Tax (12%):</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-amber-200/80 pt-1.5 font-bold text-sm text-zinc-900">
                <span>Estimated Folio Total:</span>
                <span className="text-amber-900">${grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Zero pre-payment penalty • Pay at reception</span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:text-zinc-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all disabled:opacity-50"
                >
                  {loading ? 'Confirming with PMS...' : 'Confirm Reservation'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
