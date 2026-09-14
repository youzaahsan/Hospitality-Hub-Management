import React, { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, X, AlertTriangle, Info, CheckCircle2, AlertCircle } from 'lucide-react';
import { NotificationItem } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { refreshNotifications } = useAuth();

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ success: boolean; data: NotificationItem[] }>('/notifications');
      if (res.success) {
        setNotifications(res.data);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
      refreshNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.put('/notifications/mark-all-read');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      refreshNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
            <div className="flex items-center space-x-2">
              <Bell className="w-5 h-5 text-amber-600" />
              <h2 className="text-base font-semibold text-zinc-900">Hotel Notifications</h2>
            </div>
            <div className="flex items-center space-x-2">
              {notifications.some((n) => !n.isRead) && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-amber-700 hover:text-amber-800 font-medium flex items-center gap-1 px-2 py-1 rounded bg-amber-50 hover:bg-amber-100 transition-colors"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark all read
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1 rounded-md text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading ? (
              <div className="text-center py-12 text-zinc-400 text-sm">Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-16">
                <Bell className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                <p className="text-sm font-medium text-zinc-600">No notifications yet</p>
                <p className="text-xs text-zinc-400 mt-1">You will receive real-time operational alerts here.</p>
              </div>
            ) : (
              notifications.map((notif) => {
                const getIcon = () => {
                  switch (notif.type) {
                    case 'alert':
                      return <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />;
                    case 'warning':
                      return <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />;
                    case 'success':
                      return <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />;
                    default:
                      return <Info className="w-4 h-4 text-blue-600 shrink-0" />;
                  }
                };

                return (
                  <div
                    key={notif._id}
                    className={`p-3 rounded-lg border transition-all ${
                      notif.isRead
                        ? 'bg-white border-zinc-200 text-zinc-600'
                        : 'bg-amber-50/50 border-amber-200/80 text-zinc-900 shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        <div className="mt-0.5">{getIcon()}</div>
                        <div>
                          <p className={`text-sm ${notif.isRead ? 'font-medium' : 'font-semibold'}`}>{notif.title}</p>
                          <p className="text-xs text-zinc-600 mt-0.5 leading-relaxed">{notif.message}</p>
                          <span className="text-[10px] text-zinc-400 mt-1 block">
                            {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
                            {new Date(notif.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      </div>
                      {!notif.isRead && (
                        <button
                          onClick={() => handleMarkAsRead(notif._id)}
                          title="Mark as read"
                          className="p-1 text-zinc-400 hover:text-emerald-600 hover:bg-white rounded transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
