import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  BedDouble,
  TrendingUp,
  Percent,
  Sparkles,
  Wrench,
  Users,
  Calendar,
  ArrowUpRight,
  RefreshCw,
  Plus,
  KeyRound,
  Receipt,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { api } from '../../services/api';

interface AnalyticsOverviewProps {
  onQuickAction: (action: string) => void;
}

export const AnalyticsOverview: React.FC<AnalyticsOverviewProps> = ({ onQuickAction }) => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ success: boolean; data: any }>('/analytics/dashboard');
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-96 text-zinc-400 text-sm">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
        Loading real-time hotel intelligence...
      </div>
    );
  }

  const { kpis, roomDistribution, popularRoomTypes, monthlyRevenueData } = data;

  const roomStatusData = [
    { name: 'Occupied', value: roomDistribution.occupied, color: '#2563EB' },
    { name: 'Available', value: roomDistribution.available, color: '#10B981' },
    { name: 'Reserved', value: roomDistribution.reserved, color: '#F59E0B' },
    { name: 'Cleaning', value: roomDistribution.cleaning, color: '#8B5CF6' },
    { name: 'Maintenance', value: roomDistribution.maintenance, color: '#EF4444' },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-zinc-200 shadow-2xs">
        <div>
          <h2 className="text-xl font-serif font-bold text-zinc-900">Hotel Operations Overview</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Real-time synchronization across Front Desk, Folios, Housekeeping, and Guest Services.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onQuickAction('new-reservation')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            New Reservation
          </button>
          <button
            onClick={() => onQuickAction('checkinout')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-zinc-950 rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            <KeyRound className="w-3.5 h-3.5" />
            Arrivals & Departures
          </button>
          <button
            onClick={fetchAnalytics}
            title="Refresh Intelligence"
            className="p-2 text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 rounded-xl transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Occupancy Rate */}
        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Occupancy Rate</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-zinc-900">{kpis.occupancyRate}%</div>
            <p className="text-[11px] text-zinc-500 mt-1">
              {roomDistribution.occupied} occupied of {roomDistribution.total} suites
            </p>
          </div>
        </div>

        {/* Total Collected Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Collected Revenue</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-zinc-900">${kpis.totalRevenueCollected.toLocaleString()}</div>
            <p className="text-[11px] text-emerald-600 mt-1 font-medium">
              Outstanding: ${kpis.outstandingBalance.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Average Daily Rate (ADR) */}
        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">ADR (Daily Rate)</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-zinc-900">${kpis.adr.toFixed(2)}</div>
            <p className="text-[11px] text-zinc-500 mt-1">
              RevPAR: ${kpis.revPar.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Active Housekeeping & Maintenance */}
        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Tasks & Tickets</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-zinc-900">{kpis.pendingHousekeeping}</span>
              <span className="text-xs text-zinc-500">cleaning</span>
              <span className="text-zinc-300">•</span>
              <span className="text-2xl font-bold text-zinc-900">{kpis.openMaintenance}</span>
              <span className="text-xs text-zinc-500">tickets</span>
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">Real-time room operational load</p>
          </div>
        </div>
      </div>

      {/* Visual Analytics Grid (Recharts) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Revenue Trend (2 cols) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-zinc-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-zinc-900">Revenue Performance Trend</h3>
              <p className="text-xs text-zinc-500">Gross revenue trajectories over recent months</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyRevenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D97706" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#D97706" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6B7280' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} tickLine={false} />
                <Tooltip
                  formatter={(val: any) => [`$${Number(val).toLocaleString()}`, 'Revenue']}
                  contentStyle={{
                    backgroundColor: '#18181B',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#D97706"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#revenueColor)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Room Status Matrix Donut (1 col) */}
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">Current Room Distribution</h3>
            <p className="text-xs text-zinc-500 mb-2">Live breakdown by status</p>
          </div>

          <div className="h-44 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={roomStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={46}
                  outerRadius={65}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {roomStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181B',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-zinc-100">
            {roomStatusData.map((item) => (
              <div key={item.name} className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-zinc-600 truncate">{item.name}:</span>
                <span className="font-semibold text-zinc-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Popular Room Types & Direct Booking Performance */}
      <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-2xs">
        <h3 className="text-sm font-semibold text-zinc-900 mb-1">Residence Category Performance</h3>
        <p className="text-xs text-zinc-500 mb-4">Bookings volume and cumulative revenue generated</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {popularRoomTypes.map((rt: any) => (
            <div key={rt.name} className="p-4 rounded-xl bg-zinc-50 border border-zinc-200">
              <h4 className="text-xs font-bold text-zinc-900 truncate">{rt.name}</h4>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-lg font-bold text-amber-800">${rt.revenue.toLocaleString()}</span>
                <span className="text-xs text-zinc-500 font-medium">{rt.bookings} bookings</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
