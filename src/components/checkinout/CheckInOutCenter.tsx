import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  LogOut,
  CheckCircle,
  Clock,
  ShieldCheck,
  CreditCard,
  FileText,
  Sparkles,
  AlertCircle,
  RefreshCw,
  X,
} from 'lucide-react';
import { Reservation, Room } from '../../types';
import { api } from '../../services/api';

interface CheckInOutCenterProps {
  onRefreshAll?: () => void;
  onViewInvoice?: (reservationId: string) => void;
}

export const CheckInOutCenter: React.FC<CheckInOutCenterProps> = ({ onRefreshAll, onViewInvoice }) => {
  const [arrivals, setArrivals] = useState<Reservation[]>([]);
  const [inHouse, setInHouse] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  // Active modal state
  const [checkInTarget, setCheckInTarget] = useState<Reservation | null>(null);
  const [checkOutTarget, setCheckOutTarget] = useState<Reservation | null>(null);

  // Check In form fields
  const [idType, setIdType] = useState('Passport');
  const [idNumber, setIdNumber] = useState('');
  const [keyCardNumber, setKeyCardNumber] = useState('');
  const [checkInNotes, setCheckInNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Check Out form fields
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash' | 'bank_transfer'>('card');
  const [paymentReference, setPaymentReference] = useState('');
  const [settleAmount, setSettleAmount] = useState<number>(0);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ success: boolean; data: Reservation[] }>('/reservations');
      if (res.success) {
        setArrivals(res.data.filter((r) => r.status === 'confirmed'));
        setInHouse(res.data.filter((r) => r.status === 'checked_in'));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCheckIn = (res: Reservation) => {
    setCheckInTarget(res);
    setIdType('Passport');
    setIdNumber('');
    setKeyCardNumber(`CARD-${res.roomNumber}-${Math.floor(100 + Math.random() * 900)}`);
    setCheckInNotes('');
    setActionError(null);
  };

  const handleExecuteCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkInTarget) return;

    setActionLoading(true);
    setActionError(null);
    try {
      const res = await api.post<{ success: boolean; message: string }>('/check-in', {
        reservationId: checkInTarget._id,
        idType,
        idNumber: idNumber || 'VERIFIED-ON-ARRIVAL',
        keyCardNumber,
        notes: checkInNotes,
      });

      if (res.success) {
        setCheckInTarget(null);
        await loadData();
        if (onRefreshAll) onRefreshAll();
      }
    } catch (err: any) {
      setActionError(err.message || 'Check-in failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenCheckOut = (res: Reservation) => {
    setCheckOutTarget(res);
    setPaymentMethod('card');
    setPaymentReference(`AUTH-${Date.now().toString().slice(-6)}`);
    setSettleAmount(res.balanceDue);
    setActionError(null);
  };

  const handleExecuteCheckOut = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkOutTarget) return;

    setActionLoading(true);
    setActionError(null);
    try {
      const res = await api.post<{ success: boolean; message: string }>('/check-out', {
        reservationId: checkOutTarget._id,
        paymentMethod,
        paymentReference,
        settleBalance: settleAmount > 0,
        amountToSettle: Number(settleAmount),
      });

      if (res.success) {
        setCheckOutTarget(null);
        await loadData();
        if (onRefreshAll) onRefreshAll();
      }
    } catch (err: any) {
      setActionError(err.message || 'Check-out failed.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-2xs flex items-center justify-between">
        <div>
          <h2 className="text-xl font-serif font-bold text-zinc-900">Front Desk Arrival & Departure Center</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Real-time check-in validation, keycard issuance, folio settlement, and automated housekeeping dispatch.
          </p>
        </div>
        <button
          onClick={loadData}
          className="p-2 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 rounded-xl transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Two-Column Grid: Arrivals & Departures */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Arrivals Panel */}
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xs p-5 flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900">Confirmed Arrivals</h3>
                <p className="text-[11px] text-zinc-500">Guests scheduled to arrive ({arrivals.length})</p>
              </div>
            </div>
          </div>

          <div className="mt-4 flex-1 space-y-3 overflow-y-auto max-h-[500px]">
            {arrivals.length === 0 ? (
              <div className="py-12 text-center text-zinc-400 text-xs">
                No arrivals pending today. All incoming guests checked in!
              </div>
            ) : (
              arrivals.map((r) => (
                <div
                  key={r._id}
                  className="p-4 rounded-xl border border-zinc-200 hover:border-emerald-300 bg-zinc-50/50 hover:bg-white transition-all shadow-2xs flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-zinc-900 text-xs">{r.guestName}</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-mono font-semibold">
                        Room {r.roomNumber}
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-500 mt-1">
                      {r.roomTypeName} • {r.numberOfNights} nights ({r.checkInDate} to {r.checkOutDate})
                    </div>
                    <div className="text-[10px] text-zinc-400 mt-0.5 font-mono">{r.reservationNumber}</div>
                  </div>

                  <button
                    onClick={() => handleOpenCheckIn(r)}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors shrink-0 flex items-center gap-1"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Check In</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Departures Panel */}
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xs p-5 flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <LogOut className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900">In-House Guests</h3>
                <p className="text-[11px] text-zinc-500">Currently occupying suites ({inHouse.length})</p>
              </div>
            </div>
          </div>

          <div className="mt-4 flex-1 space-y-3 overflow-y-auto max-h-[500px]">
            {inHouse.length === 0 ? (
              <div className="py-12 text-center text-zinc-400 text-xs">No active checked-in guests found.</div>
            ) : (
              inHouse.map((r) => (
                <div
                  key={r._id}
                  className="p-4 rounded-xl border border-zinc-200 hover:border-blue-300 bg-zinc-50/50 hover:bg-white transition-all shadow-2xs flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-zinc-900 text-xs">{r.guestName}</span>
                      <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-mono font-semibold">
                        Room {r.roomNumber}
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-500 mt-1">
                      {r.roomTypeName} • Folio: ${r.grandTotal.toFixed(2)}
                    </div>
                    <div className="text-[10px] mt-0.5">
                      {r.balanceDue > 0 ? (
                        <span className="text-amber-700 font-semibold">Balance: ${r.balanceDue.toFixed(2)}</span>
                      ) : (
                        <span className="text-emerald-700 font-medium">Fully Settled</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {onViewInvoice && (
                      <button
                        onClick={() => onViewInvoice(r._id)}
                        className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors"
                        title="View Folio"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleOpenCheckOut(r)}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors flex items-center gap-1"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Check Out</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Fast Check-In Modal */}
      {checkInTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-zinc-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div>
                <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-emerald-600" />
                  Fast Check-In: Room {checkInTarget.roomNumber}
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">Guest: {checkInTarget.guestName}</p>
              </div>
              <button
                onClick={() => setCheckInTarget(null)}
                className="p-1 text-zinc-400 hover:text-zinc-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {actionError && (
              <div className="mt-3 p-2.5 text-xs bg-rose-50 text-rose-700 border border-rose-200 rounded-lg">
                {actionError}
              </div>
            )}

            <form onSubmit={handleExecuteCheckIn} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">ID Document Type</label>
                  <select
                    value={idType}
                    onChange={(e) => setIdType(e.target.value)}
                    className="w-full border border-zinc-300 rounded-lg p-2 focus:outline-hidden"
                  >
                    <option value="Passport">Passport</option>
                    <option value="Drivers License">Driver's License</option>
                    <option value="National Identity Card">National ID</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">ID Number</label>
                  <input
                    type="text"
                    placeholder="e.g. P18928374"
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    className="w-full border border-zinc-300 rounded-lg p-2 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">RFID Keycard Assigned</label>
                <input
                  type="text"
                  value={keyCardNumber}
                  onChange={(e) => setKeyCardNumber(e.target.value)}
                  className="w-full border border-zinc-300 rounded-lg p-2 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Front Desk Check-In Notes</label>
                <textarea
                  rows={2}
                  placeholder="Welcome drink served, champagne delivered to room..."
                  value={checkInNotes}
                  onChange={(e) => setCheckInNotes(e.target.value)}
                  className="w-full border border-zinc-300 rounded-lg p-2"
                />
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Confirming check-in will immediately update Room {checkInTarget.roomNumber} status to{' '}
                  <strong>Occupied</strong> and notify the concierge.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCheckInTarget(null)}
                  className="px-4 py-2 font-semibold text-zinc-600 hover:text-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-xs disabled:opacity-50"
                >
                  {actionLoading ? 'Processing...' : 'Complete Check-In'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fast Check-Out Modal */}
      {checkOutTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-zinc-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div>
                <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                  <LogOut className="w-5 h-5 text-blue-600" />
                  Departure & Folio: Room {checkOutTarget.roomNumber}
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">Guest: {checkOutTarget.guestName}</p>
              </div>
              <button
                onClick={() => setCheckOutTarget(null)}
                className="p-1 text-zinc-400 hover:text-zinc-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {actionError && (
              <div className="mt-3 p-2.5 text-xs bg-rose-50 text-rose-700 border border-rose-200 rounded-lg">
                {actionError}
              </div>
            )}

            <form onSubmit={handleExecuteCheckOut} className="mt-4 space-y-4 text-xs">
              {/* Folio Summary Box */}
              <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Room Total:</span>
                  <span className="font-semibold text-zinc-900">${checkOutTarget.roomTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">In-Room Dining / Services:</span>
                  <span className="font-semibold text-zinc-900">${checkOutTarget.serviceTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Hospitality Tax (12%):</span>
                  <span>${checkOutTarget.taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-zinc-200 pt-1.5 font-bold text-sm">
                  <span>Grand Total:</span>
                  <span>${checkOutTarget.grandTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">Already Paid:</span>
                  <span className="text-emerald-700 font-semibold">${checkOutTarget.amountPaid.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-zinc-200 pt-1.5 font-bold text-sm text-amber-900">
                  <span>Balance Due:</span>
                  <span>${checkOutTarget.balanceDue.toFixed(2)}</span>
                </div>
              </div>

              {/* Settlement if balance due > 0 */}
              {checkOutTarget.balanceDue > 0 && (
                <div className="space-y-3 pt-2 border-t border-zinc-100">
                  <h4 className="font-bold text-zinc-800">Settle Outstanding Folio Balance</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-zinc-600 mb-1">Payment Method</label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value as any)}
                        className="w-full border border-zinc-300 rounded-lg p-2"
                      >
                        <option value="card">Credit / Debit Card</option>
                        <option value="cash">Cash</option>
                        <option value="bank_transfer">Bank Wire</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold text-zinc-600 mb-1">Amount to Charge</label>
                      <input
                        type="number"
                        step="0.01"
                        value={settleAmount}
                        onChange={(e) => setSettleAmount(Number(e.target.value))}
                        className="w-full border border-zinc-300 rounded-lg p-2 font-bold text-zinc-900"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-zinc-600 mb-1">Authorization Reference</label>
                    <input
                      type="text"
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                      className="w-full border border-zinc-300 rounded-lg p-2 font-mono"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="p-3 rounded-xl bg-blue-50 text-blue-800 border border-blue-200 flex items-start gap-2">
                <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Check-out automatically flags Room {checkOutTarget.roomNumber} as <strong>Cleaning</strong>{' '}
                  and dispatches an urgent turnaround task to Housekeeping.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCheckOutTarget(null)}
                  className="px-4 py-2 font-semibold text-zinc-600 hover:text-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-xs disabled:opacity-50"
                >
                  {actionLoading ? 'Finalizing...' : 'Settle & Check Out'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
