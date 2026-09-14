import React, { useState, useEffect } from 'react';
import {
  BedDouble,
  Sparkles,
  Wrench,
  KeyRound,
  CheckCircle2,
  Plus,
  Filter,
  RefreshCw,
  X,
  Edit2,
  SlidersHorizontal,
} from 'lucide-react';
import { Room, RoomType, RoomStatus } from '../../types';
import { api } from '../../services/api';
import { StatusBadge } from '../common/Badge';
import { useAuth } from '../../context/AuthContext';

export const RoomMatrixView: React.FC = () => {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [floorFilter, setFloorFilter] = useState<string>('all');

  // Room Status Change Modal
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [newStatus, setNewStatus] = useState<RoomStatus>('available');
  const [statusNotes, setStatusNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Add Room Modal
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [newRoomNumber, setNewRoomNumber] = useState('');
  const [newRoomTypeId, setNewRoomTypeId] = useState('');
  const [newRoomFloor, setNewRoomFloor] = useState(1);
  const [newRoomPrice, setNewRoomPrice] = useState(450);

  const loadData = async () => {
    setLoading(true);
    try {
      const [roomsRes, typesRes] = await Promise.all([
        api.get<{ success: boolean; data: Room[] }>('/rooms'),
        api.get<{ success: boolean; data: RoomType[] }>('/room-types'),
      ]);
      if (roomsRes.success) setRooms(roomsRes.data);
      if (typesRes.success) {
        setRoomTypes(typesRes.data);
        if (typesRes.data.length > 0) setNewRoomTypeId(typesRes.data[0]._id);
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

  const handleOpenStatusModal = (room: Room) => {
    setSelectedRoom(room);
    setNewStatus(room.status);
    setStatusNotes('');
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom) return;

    setIsUpdating(true);
    try {
      await api.put(`/rooms/${selectedRoom._id}`, {
        status: newStatus,
        notes: statusNotes,
      });
      setSelectedRoom(null);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update room status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomNumber || !newRoomTypeId) return;

    try {
      await api.post('/rooms', {
        roomNumber: newRoomNumber,
        roomTypeId: newRoomTypeId,
        floor: Number(newRoomFloor),
        pricePerNight: Number(newRoomPrice),
      });
      setShowAddRoomModal(false);
      setNewRoomNumber('');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to add room');
    }
  };

  // Filtered rooms
  const filtered = rooms.filter((r) => {
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchFloor = floorFilter === 'all' || String(r.floor) === floorFilter;
    return matchStatus && matchFloor;
  });

  // Summary counts
  const availableCount = rooms.filter((r) => r.status === 'available').length;
  const occupiedCount = rooms.filter((r) => r.status === 'occupied').length;
  const cleaningCount = rooms.filter((r) => r.status === 'cleaning').length;
  const reservedCount = rooms.filter((r) => r.status === 'reserved').length;
  const maintenanceCount = rooms.filter((r) => r.status === 'maintenance' || r.status === 'out_of_service').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-serif font-bold text-zinc-900">Room Status & Floor Matrix</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Real-time physical room statuses, housekeeping turnover, and occupancy allocation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="p-2 text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 rounded-xl transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {(user?.role === 'admin' || user?.role === 'manager') && (
            <button
              onClick={() => setShowAddRoomModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Room
            </button>
          )}
        </div>
      </div>

      {/* Status Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div
          onClick={() => setStatusFilter('all')}
          className={`cursor-pointer p-3 rounded-xl border text-center transition-all ${
            statusFilter === 'all' ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs' : 'bg-white border-zinc-200 hover:bg-zinc-50'
          }`}
        >
          <div className="text-lg font-bold">{rooms.length}</div>
          <div className="text-[11px] font-medium opacity-80 uppercase tracking-wider">Total Rooms</div>
        </div>

        <div
          onClick={() => setStatusFilter('available')}
          className={`cursor-pointer p-3 rounded-xl border text-center transition-all ${
            statusFilter === 'available'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
              : 'bg-emerald-50/60 border-emerald-200 text-emerald-800 hover:bg-emerald-100/60'
          }`}
        >
          <div className="text-lg font-bold">{availableCount}</div>
          <div className="text-[11px] font-medium uppercase tracking-wider">Available</div>
        </div>

        <div
          onClick={() => setStatusFilter('occupied')}
          className={`cursor-pointer p-3 rounded-xl border text-center transition-all ${
            statusFilter === 'occupied'
              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
              : 'bg-blue-50/60 border-blue-200 text-blue-800 hover:bg-blue-100/60'
          }`}
        >
          <div className="text-lg font-bold">{occupiedCount}</div>
          <div className="text-[11px] font-medium uppercase tracking-wider">Occupied</div>
        </div>

        <div
          onClick={() => setStatusFilter('cleaning')}
          className={`cursor-pointer p-3 rounded-xl border text-center transition-all ${
            statusFilter === 'cleaning'
              ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
              : 'bg-purple-50/60 border-purple-200 text-purple-800 hover:bg-purple-100/60'
          }`}
        >
          <div className="text-lg font-bold">{cleaningCount}</div>
          <div className="text-[11px] font-medium uppercase tracking-wider">Cleaning</div>
        </div>

        <div
          onClick={() => setStatusFilter('maintenance')}
          className={`cursor-pointer p-3 rounded-xl border text-center transition-all ${
            statusFilter === 'maintenance'
              ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
              : 'bg-rose-50/60 border-rose-200 text-rose-800 hover:bg-rose-100/60'
          }`}
        >
          <div className="text-lg font-bold">{maintenanceCount}</div>
          <div className="text-[11px] font-medium uppercase tracking-wider">Maintenance</div>
        </div>
      </div>

      {/* Floor Filter Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-zinc-200 shadow-2xs flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-zinc-600 font-semibold">
          <Filter className="w-4 h-4" />
          <span>Floor Filter:</span>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {['all', '1', '2', '3', '4', '5'].map((fl) => (
            <button
              key={fl}
              onClick={() => setFloorFilter(fl)}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                floorFilter === fl ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              {fl === 'all' ? 'All Floors' : `Floor ${fl}`}
            </button>
          ))}
        </div>
      </div>

      {/* Room Matrix Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.map((room) => {
          const type = roomTypes.find((t) => t._id === room.roomTypeId);

          const getStatusBorder = () => {
            switch (room.status) {
              case 'available':
                return 'border-emerald-300 hover:border-emerald-500 bg-emerald-50/20';
              case 'occupied':
                return 'border-blue-300 hover:border-blue-500 bg-blue-50/20';
              case 'cleaning':
                return 'border-purple-300 hover:border-purple-500 bg-purple-50/20';
              case 'reserved':
                return 'border-amber-300 hover:border-amber-500 bg-amber-50/20';
              case 'maintenance':
                return 'border-rose-300 hover:border-rose-500 bg-rose-50/20';
              default:
                return 'border-zinc-300 hover:border-zinc-400 bg-zinc-50';
            }
          };

          return (
            <div
              key={room._id}
              className={`p-4 rounded-2xl border-2 transition-all shadow-2xs flex flex-col justify-between ${getStatusBorder()}`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-mono font-black text-zinc-900">
                    #{room.roomNumber}
                  </span>
                  <StatusBadge status={room.status} type="room" />
                </div>

                <div className="mt-2 text-xs font-semibold text-zinc-800">
                  {type?.name || 'Standard Suite'}
                </div>
                <div className="text-[11px] text-zinc-500 mt-0.5">
                  Floor {room.floor} • ${room.pricePerNight}/night
                </div>

                {room.lastCleaned && (
                  <div className="text-[10px] text-zinc-400 mt-2 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Cleaned: {new Date(room.lastCleaned).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-200/80 flex items-center justify-between text-xs">
                <button
                  onClick={() => handleOpenStatusModal(room)}
                  className="w-full py-1.5 px-3 bg-white hover:bg-zinc-50 text-zinc-700 font-semibold rounded-lg border border-zinc-200 transition-colors flex items-center justify-center gap-1.5"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Update Status</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Room Status Change Modal */}
      {selectedRoom && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-zinc-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <h3 className="text-base font-bold text-zinc-900">
                Update Status: Room {selectedRoom.roomNumber}
              </h3>
              <button
                onClick={() => setSelectedRoom(null)}
                className="p-1 text-zinc-400 hover:text-zinc-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateStatus} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-zinc-700 mb-1.5">New Room Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as RoomStatus)}
                  className="w-full border border-zinc-300 rounded-lg p-2.5 font-semibold text-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                >
                  <option value="available">Available (Inspected & Ready)</option>
                  <option value="occupied">Occupied (Guest In-House)</option>
                  <option value="reserved">Reserved (Guaranteed Arrival)</option>
                  <option value="cleaning">Cleaning (Housekeeping In Progress)</option>
                  <option value="maintenance">Maintenance (Out of Service)</option>
                  <option value="out_of_service">Out of Service (Renovation)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Status Change Log / Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Deep clean completed by Carlos, ready for VIP check-in."
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  className="w-full border border-zinc-300 rounded-lg p-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedRoom(null)}
                  className="px-4 py-2 font-semibold text-zinc-600 hover:text-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-lg shadow-xs disabled:opacity-50"
                >
                  {isUpdating ? 'Saving...' : 'Apply Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Room Modal */}
      {showAddRoomModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-zinc-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <h3 className="text-base font-bold text-zinc-900">Add New Hotel Room / Suite</h3>
              <button
                onClick={() => setShowAddRoomModal(false)}
                className="p-1 text-zinc-400 hover:text-zinc-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRoom} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Room Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 305"
                    value={newRoomNumber}
                    onChange={(e) => setNewRoomNumber(e.target.value)}
                    className="w-full border border-zinc-300 rounded-lg p-2 font-mono font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Floor Level</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={newRoomFloor}
                    onChange={(e) => setNewRoomFloor(Number(e.target.value))}
                    className="w-full border border-zinc-300 rounded-lg p-2"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Room Category</label>
                <select
                  value={newRoomTypeId}
                  onChange={(e) => setNewRoomTypeId(e.target.value)}
                  className="w-full border border-zinc-300 rounded-lg p-2"
                >
                  {roomTypes.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name} (Base: ${t.basePrice})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Default Nightly Rate ($)</label>
                <input
                  type="number"
                  min={50}
                  value={newRoomPrice}
                  onChange={(e) => setNewRoomPrice(Number(e.target.value))}
                  className="w-full border border-zinc-300 rounded-lg p-2 font-bold"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddRoomModal(false)}
                  className="px-4 py-2 font-semibold text-zinc-600 hover:text-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-lg shadow-xs"
                >
                  Create Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
