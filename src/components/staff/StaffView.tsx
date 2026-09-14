import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  Briefcase,
  Mail,
  Clock,
  RefreshCw,
  X,
  CheckCircle,
} from 'lucide-react';
import { User, UserRole } from '../../types';
import { api } from '../../services/api';
import { StatusBadge } from '../common/Badge';

export const StaffView: React.FC = () => {
  const [staffList, setStaffList] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Add staff form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('receptionist');
  const [department, setDepartment] = useState('Front Desk');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadStaff = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ success: boolean; data: User[] }>('/users');
      if (res.success) {
        setStaffList(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    setIsSubmitting(true);
    try {
      await api.post('/users', {
        name,
        email,
        role,
        department,
        phone,
      });
      setShowAddModal(false);
      setName('');
      setEmail('');
      setPhone('');
      await loadStaff();
    } catch (err: any) {
      alert(err.message || 'Failed to add staff member');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-serif font-bold text-zinc-900">Hotel Staff & Operational Directory</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Role assignments, departments, contact info, and shift rosters.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadStaff}
            className="p-2 text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 rounded-xl transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Add Staff Member
          </button>
        </div>
      </div>

      {/* Staff Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-16 text-center text-zinc-400 text-xs">Loading staff records...</div>
        ) : staffList.length === 0 ? (
          <div className="col-span-full py-16 text-center text-zinc-400 text-xs">No staff members registered.</div>
        ) : (
          staffList.map((st) => (
            <div
              key={st._id}
              className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-2xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase px-2 py-0.5 rounded bg-zinc-100 text-zinc-700">
                    {st.department || 'Operations'}
                  </span>
                  <StatusBadge status={st.role} type="role" />
                </div>

                <div className="mt-4 flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-900 font-serif font-bold text-sm flex items-center justify-center shrink-0">
                    {st.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-zinc-900">{st.name}</h4>
                    <span className="text-[11px] text-zinc-400 font-mono capitalize">{st.role}</span>
                  </div>
                </div>

                <div className="mt-4 space-y-1.5 text-xs text-zinc-600 pt-3 border-t border-zinc-100">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{st.email}</span>
                  </div>
                  {st.phone && (
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-3.5 h-3.5 text-zinc-400" />
                      <span>{st.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-400">
                <span className="flex items-center gap-1 text-emerald-600 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  On Duty
                </span>
                <span>Active Status</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-zinc-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <h3 className="text-base font-bold text-zinc-900">Add New Staff Member</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-zinc-400 hover:text-zinc-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Jean-Luc Dubois"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-zinc-300 rounded-lg p-2 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="jeanluc@luxurystay.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-zinc-300 rounded-lg p-2 font-mono"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">System Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full border border-zinc-300 rounded-lg p-2 capitalize"
                  >
                    <option value="admin">Admin</option>
                    <option value="manager">Hotel Manager</option>
                    <option value="receptionist">Receptionist</option>
                    <option value="housekeeping">Housekeeping</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="staff">Staff</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Department</label>
                  <input
                    type="text"
                    placeholder="Concierge / Spa"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full border border-zinc-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Direct Phone / Extension</label>
                <input
                  type="text"
                  placeholder="+33 4 92 98 77 12"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full border border-zinc-300 rounded-lg p-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 font-semibold text-zinc-600 hover:text-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-lg shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? 'Registering...' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
