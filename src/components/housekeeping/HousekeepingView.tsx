import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  CheckCircle,
  Play,
  Clock,
  AlertTriangle,
  Plus,
  RefreshCw,
  X,
  UserCheck,
  ShieldCheck,
} from 'lucide-react';
import { HousekeepingTask, Room } from '../../types';
import { api } from '../../services/api';
import { StatusBadge } from '../common/Badge';
import { useAuth } from '../../context/AuthContext';

export const HousekeepingView: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<HousekeepingTask[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Create Task Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [taskType, setTaskType] = useState<any>('daily_refresh');
  const [priority, setPriority] = useState<any>('normal');
  const [taskNotes, setTaskNotes] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [tasksRes, roomsRes] = await Promise.all([
        api.get<{ success: boolean; data: HousekeepingTask[] }>('/housekeeping'),
        api.get<{ success: boolean; data: Room[] }>('/rooms'),
      ]);
      if (tasksRes.success) setTasks(tasksRes.data);
      if (roomsRes.success) {
        setRooms(roomsRes.data);
        if (roomsRes.data.length > 0) setSelectedRoomId(roomsRes.data[0]._id);
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

  const handleUpdateStatus = async (taskId: string, newStatus: string) => {
    try {
      await api.put(`/housekeeping/${taskId}/status`, { status: newStatus });
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update task');
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoomId) return;

    try {
      await api.post('/housekeeping', {
        roomId: selectedRoomId,
        taskType,
        priority,
        notes: taskNotes,
      });
      setShowCreateModal(false);
      setTaskNotes('');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create task');
    }
  };

  const filtered = tasks.filter((t) => {
    if (statusFilter === 'all') return true;
    return t.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-serif font-bold text-zinc-900">Housekeeping Operations</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Turnover queue, sanitation workflows, and real-time room availability restoration.
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
            Dispatch Task
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto bg-white p-2 rounded-xl border border-zinc-200 shadow-2xs">
        {['all', 'pending', 'assigned', 'in_progress', 'completed', 'inspected'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-colors ${
              statusFilter === st ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100'
            }`}
          >
            {st.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Task Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-16 text-center text-zinc-400 text-xs">
            Loading housekeeping operations...
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-16 text-center text-zinc-400 text-xs">
            No housekeeping tasks under this status.
          </div>
        ) : (
          filtered.map((task) => {
            const formatType = (t: string) => t.replace(/_/g, ' ').toUpperCase();

            return (
              <div
                key={task._id}
                className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-2xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-mono font-bold text-zinc-900">
                      Room #{task.roomNumber}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <StatusBadge status={task.priority} type="priority" />
                      <StatusBadge status={task.status} type="room" />
                    </div>
                  </div>

                  <div className="mt-2 text-xs font-semibold text-zinc-800">
                    {formatType(task.taskType)}
                  </div>
                  <div className="text-[11px] text-zinc-500 font-mono mt-0.5">{task.taskNumber}</div>

                  {task.notes && (
                    <p className="mt-3 text-xs text-zinc-600 bg-zinc-50 p-2.5 rounded-lg border border-zinc-100 italic">
                      "{task.notes}"
                    </p>
                  )}

                  <div className="mt-3 text-[11px] text-zinc-400">
                    Assigned:{' '}
                    <span className="text-zinc-700 font-medium">
                      {task.assignedToName || 'Available Pool'}
                    </span>
                  </div>
                </div>

                {/* Status Advancement Buttons */}
                <div className="mt-5 pt-3 border-t border-zinc-100 flex items-center justify-end gap-2 text-xs">
                  {(task.status === 'pending' || task.status === 'assigned') && (
                    <button
                      onClick={() => handleUpdateStatus(task._id, 'in_progress')}
                      className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg shadow-2xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Start Cleaning</span>
                    </button>
                  )}

                  {task.status === 'in_progress' && (
                    <button
                      onClick={() => handleUpdateStatus(task._id, 'completed')}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-2xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Complete & Restore Room</span>
                    </button>
                  )}

                  {task.status === 'completed' && (
                    <button
                      onClick={() => handleUpdateStatus(task._id, 'inspected')}
                      className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-lg shadow-2xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Sign Off / Inspected</span>
                    </button>
                  )}

                  {task.status === 'inspected' && (
                    <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Inspected by {task.inspectedBy || 'Supervisor'}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-zinc-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <h3 className="text-base font-bold text-zinc-900">Dispatch Housekeeping Task</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-zinc-400 hover:text-zinc-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Target Room / Suite</label>
                <select
                  value={selectedRoomId}
                  onChange={(e) => setSelectedRoomId(e.target.value)}
                  className="w-full border border-zinc-300 rounded-lg p-2 font-semibold"
                >
                  {rooms.map((r) => (
                    <option key={r._id} value={r._id}>
                      Room #{r.roomNumber} ({r.status})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Cleaning Type</label>
                  <select
                    value={taskType}
                    onChange={(e) => setTaskType(e.target.value)}
                    className="w-full border border-zinc-300 rounded-lg p-2"
                  >
                    <option value="daily_refresh">Daily Refresh</option>
                    <option value="checkout_cleaning">Checkout Turnover</option>
                    <option value="deep_clean">Deep Clean</option>
                    <option value="turndown">Evening Turndown</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full border border-zinc-300 rounded-lg p-2"
                  >
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Instructions / Linen Specifications</label>
                <textarea
                  rows={2}
                  placeholder="Extra hypoallergenic pillows, organic lavender mist, refill Hermes bath items..."
                  value={taskNotes}
                  onChange={(e) => setTaskNotes(e.target.value)}
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
                  className="px-5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-lg shadow-xs"
                >
                  Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
