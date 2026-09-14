import React, { useState, useEffect } from 'react';
import {
  Bell,
  LogOut,
  User as UserIcon,
  Crown,
  Globe,
  SlidersHorizontal,
  ChevronDown,
  Menu,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { NotificationsDrawer } from '../notifications/NotificationsDrawer';

interface HeaderProps {
  onToggleSidebar?: () => void;
  onNavigatePublic?: () => void;
  currentView?: string;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, onNavigatePublic }) => {
  const { user, logout, quickDemoLogin, unreadNotifsCount } = useAuth();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const roles: { role: UserRole; label: string; desc: string }[] = [
    { role: 'admin', label: 'Admin (Alexandra)', desc: 'Full System & Financial Access' },
    { role: 'manager', label: 'Manager (Marcus)', desc: 'Operations & Staff Oversight' },
    { role: 'receptionist', label: 'Receptionist (Elena)', desc: 'Front Desk, Check-In & Folios' },
    { role: 'housekeeping', label: 'Housekeeping (Carlos)', desc: 'Cleaning Tasks & Room State' },
    { role: 'guest', label: 'Guest (Julian Montgomery)', desc: 'Guest Portal & Room Orders' },
  ];

  const handleRoleSwitch = async (role: UserRole) => {
    setShowRoleMenu(false);
    await quickDemoLogin(role);
  };

  return (
    <>
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-30 shadow-xs">
        <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Left: Mobile Menu + Brand Title */}
          <div className="flex items-center space-x-3">
            {onToggleSidebar && (
              <button
                onClick={onToggleSidebar}
                className="lg:hidden p-2 rounded-lg text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-lg bg-zinc-950 flex items-center justify-center text-amber-400 shadow-xs">
                <Crown className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-sm font-serif font-bold text-zinc-900 tracking-wide flex items-center gap-1.5">
                  THE GRAND IMPERIAL
                  <span className="text-[10px] uppercase font-sans font-semibold tracking-wider text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                    PMS
                  </span>
                </h1>
                <p className="text-[11px] text-zinc-500 font-sans">Luxury Hotel Management Suite</p>
              </div>
            </div>
          </div>

          {/* Center: Live Time and Status */}
          <div className="hidden md:flex items-center space-x-4 text-xs text-zinc-500">
            <div className="flex items-center space-x-1.5 bg-zinc-50 px-3 py-1.5 rounded-full border border-zinc-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-medium text-zinc-700">Live PMS</span>
              <span className="text-zinc-400">•</span>
              <span>
                {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}{' '}
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
          </div>

          {/* Right: Quick Demo Switcher + Public Site Link + Notifications + Profile */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Public Hotel Website Button */}
            {onNavigatePublic && (
              <button
                onClick={onNavigatePublic}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors"
                title="View Guest Facing Luxury Website"
              >
                <Globe className="w-3.5 h-3.5 text-zinc-500" />
                Public Website
              </button>
            )}

            {/* Quick Demo Role Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-amber-700" />
                <span className="hidden sm:inline">Role:</span>
                <span className="capitalize font-bold text-amber-800">{user?.role || 'Guest'}</span>
                <ChevronDown className="w-3 h-3 text-amber-600 ml-0.5" />
              </button>

              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-zinc-200 rounded-xl shadow-xl py-1.5 z-50">
                  <div className="px-3 py-2 border-b border-zinc-100 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                    Instant Demo Role Switcher
                  </div>
                  {roles.map((r) => (
                    <button
                      key={r.role}
                      onClick={() => handleRoleSwitch(r.role)}
                      className={`w-full text-left px-3 py-2 text-xs hover:bg-zinc-50 flex flex-col transition-colors ${
                        user?.role === r.role ? 'bg-amber-50/70 text-amber-900 font-semibold' : 'text-zinc-700'
                      }`}
                    >
                      <span className="flex items-center justify-between">
                        <span className="font-medium capitalize">{r.label}</span>
                        {user?.role === r.role && (
                          <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 rounded-full">Active</span>
                        )}
                      </span>
                      <span className="text-[10px] text-zinc-400 mt-0.5">{r.desc}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notifications Bell */}
            <button
              onClick={() => setShowNotifications(true)}
              className="relative p-2 rounded-lg text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
              aria-label="View notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadNotifsCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-rose-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                  {unreadNotifsCount}
                </span>
              )}
            </button>

            {/* User Profile Pill & Logout */}
            <div className="flex items-center pl-1 border-l border-zinc-200 space-x-2">
              <div className="flex items-center space-x-2">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover border border-zinc-300"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-zinc-200 flex items-center justify-center text-zinc-600">
                    <UserIcon className="w-4 h-4" />
                  </div>
                )}
                <div className="hidden lg:block text-left">
                  <p className="text-xs font-semibold text-zinc-900 leading-tight">{user?.name || 'Guest User'}</p>
                  <p className="text-[10px] font-medium text-zinc-400 capitalize">{user?.role || 'Visitor'}</p>
                </div>
              </div>

              <button
                onClick={logout}
                title="Log Out"
                className="p-2 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Notifications Drawer */}
      <NotificationsDrawer isOpen={showNotifications} onClose={() => setShowNotifications(false)} />
    </>
  );
};
