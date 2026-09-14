import React, { useState, useEffect } from 'react';
import {
  ConciergeBell,
  Utensils,
  Sparkles,
  Car,
  Wine,
  Shirt,
  Plus,
  RefreshCw,
  CheckCircle,
  Clock,
  X,
  Search,
} from 'lucide-react';
import { HotelService, ServiceRequest, Reservation } from '../../types';
import { api } from '../../services/api';
import { StatusBadge } from '../common/Badge';

interface ServicesViewProps {
  initialReservation?: Reservation | null;
}

export const ServicesView: React.FC<ServicesViewProps> = ({ initialReservation }) => {
  const [services, setServices] = useState<HotelService[]>([]);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  // Order Service Modal
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedResId, setSelectedResId] = useState<string>(initialReservation?._id || '');
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [orderQty, setOrderQty] = useState(1);
  const [orderNotes, setOrderNotes] = useState('');
  const [isOrdering, setIsOrdering] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [srvRes, reqRes, resRes] = await Promise.all([
        api.get<{ success: boolean; data: HotelService[] }>('/services'),
        api.get<{ success: boolean; data: ServiceRequest[] }>('/service-requests'),
        api.get<{ success: boolean; data: Reservation[] }>('/reservations'),
      ]);
      if (srvRes.success) {
        setServices(srvRes.data);
        if (srvRes.data.length > 0) setSelectedServiceId(srvRes.data[0]._id);
      }
      if (reqRes.success) setRequests(reqRes.data);
      if (resRes.success) {
        // filter to checked_in or confirmed
        const activeStays = resRes.data.filter((r) => r.status === 'checked_in' || r.status === 'confirmed');
        setReservations(activeStays);
        if (!selectedResId && activeStays.length > 0) {
          setSelectedResId(activeStays[0]._id);
        }
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

  useEffect(() => {
    if (initialReservation) {
      setSelectedResId(initialReservation._id);
      setShowOrderModal(true);
    }
  }, [initialReservation]);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await api.put(`/service-requests/${id}/status`, { status });
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update request');
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResId || !selectedServiceId) return;

    setIsOrdering(true);
    try {
      const res = await api.post<{ success: boolean; message: string }>('/service-requests', {
        reservationId: selectedResId,
        serviceId: selectedServiceId,
        quantity: Number(orderQty),
        notes: orderNotes,
      });

      if (res.success) {
        setShowOrderModal(false);
        setOrderNotes('');
        await loadData();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to place service order');
    } finally {
      setIsOrdering(false);
    }
  };

  const filteredServices = services.filter((s) => {
    if (activeCategory === 'all') return true;
    return s.category === activeCategory;
  });

  const selectedServiceObj = services.find((s) => s._id === selectedServiceId);
  const totalOrderPrice = selectedServiceObj ? selectedServiceObj.price * orderQty : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-serif font-bold text-zinc-900">Hotel Services & In-Room Orders</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Michelin culinary orders, wellness treatments, and private concierge billing dispatch.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="p-2 text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 rounded-xl transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowOrderModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Order for Room
          </button>
        </div>
      </div>

      {/* Services Catalog & Category Filter */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {['all', 'dining', 'spa', 'concierge', 'transport', 'laundry'].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-lg capitalize font-semibold transition-colors ${
                activeCategory === cat ? 'bg-amber-600 text-white shadow-2xs' : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredServices.map((srv) => (
            <div
              key={srv._id}
              className="bg-white p-4 rounded-xl border border-zinc-200 shadow-2xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded uppercase">
                    {srv.category}
                  </span>
                  <span className="font-bold text-sm text-zinc-900">${srv.price}</span>
                </div>
                <h4 className="font-semibold text-zinc-900 text-xs mt-2">{srv.name}</h4>
                <p className="text-[11px] text-zinc-500 mt-1 line-clamp-2 leading-relaxed">
                  {srv.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between">
                <span className="text-[10px] text-zinc-400">{srv.unit}</span>
                <button
                  onClick={() => {
                    setSelectedServiceId(srv._id);
                    setShowOrderModal(true);
                  }}
                  className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-white rounded text-[11px] font-semibold transition-colors"
                >
                  Order
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Service Requests Queue */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-zinc-200 bg-zinc-50/50 flex items-center justify-between">
          <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600" />
            Live In-Suite Requests Queue ({requests.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-600">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 uppercase tracking-wider font-semibold text-[10px]">
              <tr>
                <th className="py-3 px-4">Request #</th>
                <th className="py-3 px-4">Room & Guest</th>
                <th className="py-3 px-4">Service Item</th>
                <th className="py-3 px-4">Qty</th>
                <th className="py-3 px-4">Total Billed</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Fulfillment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-400">
                    No active service requests in queue.
                  </td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr key={req._id} className="hover:bg-zinc-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-zinc-900">
                      {req.requestNumber}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-zinc-900">Room {req.roomNumber}</div>
                      <div className="text-[11px] text-zinc-400">{req.guestName}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-zinc-800">{req.serviceName}</div>
                      {req.notes && (
                        <div className="text-[10px] text-zinc-400 italic">"{req.notes}"</div>
                      )}
                    </td>

                    <td className="py-3 px-4 font-medium">{req.quantity}</td>

                    <td className="py-3 px-4 font-bold text-amber-900">
                      ${req.totalPrice.toFixed(2)}
                    </td>

                    <td className="py-3 px-4">
                      <StatusBadge status={req.status} type="room" />
                    </td>

                    <td className="py-3 px-4 text-right">
                      {req.status === 'pending' && (
                        <button
                          onClick={() => handleUpdateStatus(req._id, 'in_progress')}
                          className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-semibold rounded transition-colors"
                        >
                          Dispatch
                        </button>
                      )}
                      {req.status === 'in_progress' && (
                        <button
                          onClick={() => handleUpdateStatus(req._id, 'completed')}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold rounded transition-colors"
                        >
                          Mark Delivered
                        </button>
                      )}
                      {req.status === 'completed' && (
                        <span className="text-[11px] text-emerald-700 font-medium flex items-center justify-end gap-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Delivered
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Service Modal */}
      {showOrderModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-zinc-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                <ConciergeBell className="w-5 h-5 text-amber-600" />
                In-Room Service Order
              </h3>
              <button
                onClick={() => setShowOrderModal(false)}
                className="p-1 text-zinc-400 hover:text-zinc-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Target Room & Guest</label>
                <select
                  value={selectedResId}
                  onChange={(e) => setSelectedResId(e.target.value)}
                  className="w-full border border-zinc-300 rounded-lg p-2 font-semibold text-zinc-900"
                  required
                >
                  {reservations.map((r) => (
                    <option key={r._id} value={r._id}>
                      Room #{r.roomNumber} — {r.guestName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Service Item</label>
                <select
                  value={selectedServiceId}
                  onChange={(e) => setSelectedServiceId(e.target.value)}
                  className="w-full border border-zinc-300 rounded-lg p-2"
                >
                  {services.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name} (${s.price} {s.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Quantity</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={orderQty}
                  onChange={(e) => setOrderQty(Math.max(1, Number(e.target.value)))}
                  className="w-full border border-zinc-300 rounded-lg p-2 font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Special Preparations / Timing</label>
                <textarea
                  rows={2}
                  placeholder="Deliver at 8:00 PM sharp, ice bucket with vintage champagne flutes..."
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  className="w-full border border-zinc-300 rounded-lg p-2"
                />
              </div>

              {/* Automatic Folio Charge Calculation */}
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-zinc-800 flex items-center justify-between font-medium">
                <span>Charge to Folio:</span>
                <span className="font-bold text-sm text-amber-900">${totalOrderPrice.toFixed(2)}</span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOrderModal(false)}
                  className="px-4 py-2 font-semibold text-zinc-600 hover:text-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isOrdering}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow-xs disabled:opacity-50"
                >
                  {isOrdering ? 'Dispatching...' : 'Confirm & Bill Folio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
