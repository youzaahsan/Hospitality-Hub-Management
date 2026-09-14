import React, { useState, useEffect } from 'react';
import {
  Wrench,
  AlertTriangle,
  CheckCircle,
  Plus,
  RefreshCw,
  X,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import { MaintenanceRequest, Room } from '../../types';
import { api } from '../../services/api';
import { StatusBadge } from '../common/Badge';

export const MaintenanceView: React.FC = () => {
  const [tickets, setTickets] = useState<MaintenanceRequest[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  // Create Ticket Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [facilityArea, setFacilityArea] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<any>('medium');
  const [estimatedCost, setEstimatedCost] = useState(0);
  const [assignedStaff, setAssignedStaff] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Resolution Modal
  const [resolveTarget, setResolveTarget] = useState<MaintenanceRequest | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [mRes, rRes] = await Promise.all([
        api.get<{ success: boolean; data: MaintenanceRequest[] }>('/maintenance'),
        api.get<{ success: boolean; data: Room[] }>('/rooms'),
      ]);
      if (mRes.success) setTickets(mRes.data);
      if (rRes.success) {
        setRooms(rRes.data);
        if (rRes.data.length > 0) setSelectedRoomId(rRes.data[0]._id);
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

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    setIsSubmitting(true);
    try {
      await api.post('/maintenance', {
        roomId: selectedRoomId || undefined,
        facilityArea: facilityArea || undefined,
        title,
        description,
        priority,
        estimatedCost: Number(estimatedCost),
        assignedStaffName: assignedStaff,
      });

      setShowCreateModal(false);
      setTitle('');
      setDescription('');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create ticket');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string, notes?: string) => {
    try {
      await api.put(`/maintenance/${id}/status`, {
        status,
        resolutionNotes: notes,
      });
      setResolveTarget(null);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update ticket status');
    }
  };

  const filtered = tickets.filter((t) => {
    if (statusFilter === 'all') return true;
    return t.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-serif font-bold text-zinc-900">Engineering & Facilities Maintenance</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Asset maintenance, automated room out-of-service isolation, and repair lifecycle.
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
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Report Issue
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto bg-white p-2 rounded-xl border border-zinc-200 shadow-2xs text-xs">
        {['all', 'open', 'assigned', 'in_progress', 'resolved', 'closed'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-lg capitalize font-semibold transition-colors ${
              statusFilter === st ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100'
            }`}
          >
            {st.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Tickets List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-16 text-center text-zinc-400 text-xs">Loading maintenance tickets...</div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-16 text-center text-zinc-400 text-xs">No maintenance tickets found.</div>
        ) : (
          filtered.map((t) => (
            <div
              key={t._id}
              className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-2xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-amber-900">{t.ticketNumber}</span>
                  <div className="flex items-center gap-1.5">
                    <StatusBadge status={t.priority} type="priority" />
                    <StatusBadge status={t.status} type="room" />
                  </div>
                </div>

                <h4 className="font-bold text-sm text-zinc-900 mt-2">{t.title}</h4>
                <div className="text-[11px] text-zinc-500 font-medium">
                  {t.roomNumber ? `Room #${t.roomNumber}` : t.facilityArea || 'General Grounds'}
                </div>

                <p className="mt-2 text-xs text-zinc-600 leading-relaxed bg-zinc-50 p-2.5 rounded-lg border border-zinc-100">
                  {t.description}
                </p>

                {t.resolutionNotes && (
                  <div className="mt-2 text-[11px] text-emerald-800 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                    <strong>Resolution:</strong> {t.resolutionNotes}
                  </div>
                )}

                <div className="mt-3 text-[11px] text-zinc-400 flex items-center justify-between">
                  <span>Assigned: {t.assignedStaffName || 'Lead Engineer'}</span>
                  {t.estimatedCost ? <span>Est: ${t.estimatedCost}</span> : null}
                </div>
              </div>

              {/* Status Actions */}
              <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-end gap-2 text-xs">
                {t.status === 'open' && (
                  <button
                    onClick={() => handleUpdateStatus(t._id, 'in_progress')}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition-colors"
                  >
                    Start Repair
                  </button>
                )}
                {t.status === 'in_progress' && (
                  <button
                    onClick={() => {
                      setResolveTarget(t);
                      setResolutionNotes('');
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors"
                  >
                    Mark Resolved
                  </button>
                )}
                {(t.status === 'resolved' || t.status === 'closed') && (
                  <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Resolved & Room Restored
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Report Ticket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-zinc-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-amber-600" />
                Report Facility / Room Issue
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-zinc-400 hover:text-zinc-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Issue Title</label>
                <input
                  type="text"
                  placeholder="e.g. Master bath jacuzzi jet pressure low"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border border-zinc-300 rounded-lg p-2 font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Room (If in suite)</label>
                  <select
                    value={selectedRoomId}
                    onChange={(e) => {
                      setSelectedRoomId(e.target.value);
                      if (e.target.value) setFacilityArea('');
                    }}
                    className="w-full border border-zinc-300 rounded-lg p-2"
                  >
                    <option value="">None / Common Area</option>
                    {rooms.map((r) => (
                      <option key={r._id} value={r._id}>
                        Room #{r.roomNumber}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Facility Area</label>
                  <input
                    type="text"
                    placeholder="Spa Pool, Wine Cellar..."
                    value={facilityArea}
                    onChange={(e) => {
                      setFacilityArea(e.target.value);
                      if (e.target.value) setSelectedRoomId('');
                    }}
                    className="w-full border border-zinc-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full border border-zinc-300 rounded-lg p-2 font-bold"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical (Blocks Room)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Est. Repair Cost ($)</label>
                  <input
                    type="number"
                    min={0}
                    value={estimatedCost}
                    onChange={(e) => setEstimatedCost(Number(e.target.value))}
                    className="w-full border border-zinc-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Detailed Technical Description</label>
                <textarea
                  rows={2}
                  placeholder="Detail symptoms, affected fixtures, and recommended replacement parts..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border border-zinc-300 rounded-lg p-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 font-semibold text-zinc-600 hover:text-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-lg shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? 'Logging...' : 'Submit Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resolve Ticket Modal */}
      {resolveTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-zinc-200 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-zinc-900">
              Resolve Ticket: {resolveTarget.ticketNumber}
            </h3>
            <p className="text-xs text-zinc-500 mt-1">{resolveTarget.title}</p>

            <div className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Resolution Work Done</label>
                <textarea
                  rows={3}
                  placeholder="Replaced pressure valve, tested jacuzzi for 15 mins at full power, sanitized area."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  className="w-full border border-zinc-300 rounded-lg p-2"
                  required
                />
              </div>

              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200">
                Marking resolved will restore the room to <strong>Cleaning</strong> so housekeeping can conduct the final sanitization before guest arrival.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setResolveTarget(null)}
                  className="px-4 py-2 font-semibold text-zinc-600 hover:text-zinc-800"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleUpdateStatus(resolveTarget._id, 'resolved', resolutionNotes)}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-xs"
                >
                  Confirm Resolution
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
