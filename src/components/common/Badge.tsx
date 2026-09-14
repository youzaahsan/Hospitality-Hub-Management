import React from 'react';
import { RoomStatus, ReservationStatus, PaymentStatus } from '../../types';

interface BadgeProps {
  status: string;
  type?: 'room' | 'reservation' | 'payment' | 'priority' | 'role';
  className?: string;
}

export const StatusBadge: React.FC<BadgeProps> = ({ status, type = 'reservation', className = '' }) => {
  const getColors = () => {
    switch (status.toLowerCase()) {
      // Room / Task Statuses
      case 'available':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'occupied':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'reserved':
      case 'confirmed':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'cleaning':
      case 'in_progress':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'maintenance':
      case 'critical':
      case 'urgent':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'out_of_service':
      case 'cancelled':
        return 'bg-zinc-100 text-zinc-600 border-zinc-300';
      case 'checked_in':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold';
      case 'checked_out':
        return 'bg-zinc-100 text-zinc-700 border-zinc-200';
      // Payments
      case 'paid':
      case 'completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'partially_paid':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'unpaid':
      case 'pending':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      // Priorities
      case 'high':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'medium':
      case 'normal':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'low':
        return 'bg-zinc-50 text-zinc-600 border-zinc-200';
      // Roles
      case 'admin':
        return 'bg-purple-50 text-purple-700 border-purple-200 font-medium';
      case 'manager':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200 font-medium';
      case 'receptionist':
        return 'bg-teal-50 text-teal-700 border-teal-200 font-medium';
      case 'housekeeping':
        return 'bg-amber-50 text-amber-700 border-amber-200 font-medium';
      case 'guest':
        return 'bg-zinc-100 text-zinc-700 border-zinc-200 font-medium';
      default:
        return 'bg-zinc-50 text-zinc-600 border-zinc-200';
    }
  };

  const formatText = (txt: string) => {
    return txt.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border tracking-wide uppercase ${getColors()} ${className}`}
    >
      {formatText(status)}
    </span>
  );
};
