import React from 'react';
import {
  LayoutDashboard,
  CalendarCheck,
  KeyRound,
  BedDouble,
  Receipt,
  Sparkles,
  Wrench,
  ConciergeBell,
  Users,
  Star,
  FileBarChart,
  ShieldCheck,
  Settings,
  X,
  Compass,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab, isOpen, onClose }) => {
  const { user } = useAuth();
  const role = user?.role || 'guest';

  interface NavItem {
    id: string;
    label: string;
    icon: React.ElementType;
    roles: string[];
    badge?: string;
  }

  const navItems: NavItem[] = [
    // Executive / Staff items
    { id: 'dashboard', label: 'Dashboard & KPIs', icon: LayoutDashboard, roles: ['admin', 'manager'] },
    { id: 'checkinout', label: 'Front Desk & Arrival', icon: KeyRound, roles: ['admin', 'manager', 'receptionist'] },
    { id: 'reservations', label: 'Reservations', icon: CalendarCheck, roles: ['admin', 'manager', 'receptionist'] },
    { id: 'rooms', label: 'Room Matrix & Grid', icon: BedDouble, roles: ['admin', 'manager', 'receptionist', 'housekeeping'] },
    { id: 'billing', label: 'Invoices & Billing', icon: Receipt, roles: ['admin', 'manager', 'receptionist'] },
    { id: 'housekeeping', label: 'Housekeeping', icon: Sparkles, roles: ['admin', 'manager', 'receptionist', 'housekeeping'] },
    { id: 'services', label: 'In-Room Services', icon: ConciergeBell, roles: ['admin', 'manager', 'receptionist', 'guest'] },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench, roles: ['admin', 'manager', 'receptionist', 'housekeeping'] },
    { id: 'guests', label: 'Guest Directory', icon: Users, roles: ['admin', 'manager', 'receptionist'] },
    { id: 'feedback', label: 'Reviews & Feedback', icon: Star, roles: ['admin', 'manager'] },
    { id: 'reports', label: 'Reports & Audits', icon: FileBarChart, roles: ['admin', 'manager'] },
    { id: 'staff', label: 'Staff & Hotel Settings', icon: Settings, roles: ['admin'] },

    // Guest Dedicated Items
    { id: 'guest-stay', label: 'My Suite & Key', icon: KeyRound, roles: ['guest'] },
    { id: 'guest-dining', label: 'Dining & Spa Orders', icon: ConciergeBell, roles: ['guest'] },
    { id: 'guest-folio', label: 'My Folio & Bill', icon: Receipt, roles: ['guest'] },
    { id: 'guest-feedback', label: 'Rate My Experience', icon: Star, roles: ['guest'] },
  ];

  const allowedItems = navItems.filter((item) => item.roles.includes(role));

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-zinc-900 text-zinc-300 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0 flex flex-col border-r border-zinc-800 ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Mobile Header in Drawer */}
        <div className="p-4 flex items-center justify-between border-b border-zinc-800 lg:hidden">
          <span className="font-serif font-bold text-white tracking-wider">THE GRAND IMPERIAL</span>
          <button onClick={onClose} className="text-zinc-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Role Card */}
        <div className="p-4 border-b border-zinc-800/80 bg-zinc-950/40">
          <div className="text-[10px] uppercase tracking-wider font-semibold text-amber-500 mb-1">
            Authorized Workspace
          </div>
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs border border-amber-500/30 uppercase">
              {role.slice(0, 2)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-white truncate">{user?.name || 'Guest Portal'}</p>
              <p className="text-[11px] text-zinc-400 capitalize">{role} Station</p>
            </div>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {allowedItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  if (onClose) onClose();
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-amber-500 text-zinc-950 font-semibold shadow-sm'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-zinc-950' : 'text-zinc-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      isActive ? 'bg-zinc-950 text-amber-400' : 'bg-zinc-800 text-zinc-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="p-3 border-t border-zinc-800 text-[11px] text-zinc-500 flex items-center justify-between">
          <span>v2.4 Enterprise</span>
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Connected
          </span>
        </div>
      </aside>
    </>
  );
};
