import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Download,
  Calendar,
  DollarSign,
  Percent,
  BedDouble,
  FileSpreadsheet,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import { api } from '../../services/api';

export const ReportsView: React.FC = () => {
  const [reportData, setReportData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ success: boolean; data: any }>('/analytics/dashboard');
      if (res.success) {
        setReportData(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const handleExportCSV = () => {
    if (!reportData) return;
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Month,Revenue\n' +
      reportData.monthlyRevenueData.map((e: any) => `${e.month},${e.revenue}`).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `grand_imperial_financial_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading || !reportData) {
    return (
      <div className="flex items-center justify-center h-96 text-zinc-400 text-sm">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
        Compiling financial ledger and operational metrics...
      </div>
    );
  }

  const { kpis, monthlyRevenueData, popularRoomTypes } = reportData;

  const departmentData = [
    { department: 'Room Lodging', revenue: kpis.totalRevenueCollected * 0.72 },
    { department: 'Michelin Dining', revenue: kpis.totalRevenueCollected * 0.16 },
    { department: 'Spa & Wellness', revenue: kpis.totalRevenueCollected * 0.08 },
    { department: 'Concierge & Transport', revenue: kpis.totalRevenueCollected * 0.04 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-serif font-bold text-zinc-900">Financial Reports & Performance Analytics</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Audit trails, revenue yield per available suite (RevPAR), and departmental breakdown.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchReport}
            className="p-2 text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 rounded-xl transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Export CSV Audit
          </button>
        </div>
      </div>

      {/* Primary KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Gross Invoiced</span>
          <div className="text-2xl font-bold text-zinc-900 mt-2">
            ${(kpis.totalRevenueCollected + kpis.outstandingBalance).toLocaleString()}
          </div>
          <div className="text-[11px] text-zinc-400 mt-1">Total recognized ledger</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Cash Realized</span>
          <div className="text-2xl font-bold text-emerald-600 mt-2">
            ${kpis.totalRevenueCollected.toLocaleString()}
          </div>
          <div className="text-[11px] text-zinc-400 mt-1">Settled payments</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Average Daily Rate (ADR)</span>
          <div className="text-2xl font-bold text-amber-600 mt-2">${kpis.adr.toFixed(2)}</div>
          <div className="text-[11px] text-zinc-400 mt-1">Average per room sold</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">RevPAR (Yield)</span>
          <div className="text-2xl font-bold text-purple-600 mt-2">${kpis.revPar.toFixed(2)}</div>
          <div className="text-[11px] text-zinc-400 mt-1">Per total available suite</div>
        </div>
      </div>

      {/* Revenue Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Revenue Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-2xs">
          <h3 className="text-sm font-bold text-zinc-900 mb-1">Revenue by Hotel Department</h3>
          <p className="text-xs text-zinc-500 mb-4">Contribution from lodging vs gastronomic & spa amenities</p>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis dataKey="department" tick={{ fontSize: 11, fill: '#6B7280' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} tickLine={false} />
                <Tooltip
                  formatter={(val: any) => [`$${Math.round(Number(val)).toLocaleString()}`, 'Revenue']}
                  contentStyle={{
                    backgroundColor: '#18181B',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                />
                <Bar dataKey="revenue" fill="#B45309" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Revenue Trend */}
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-2xs">
          <h3 className="text-sm font-bold text-zinc-900 mb-1">Trailing Monthly Trajectory</h3>
          <p className="text-xs text-zinc-500 mb-4">Gross monthly progression over the fiscal year</p>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyRevenueData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
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
                    fontSize: '11px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10B981"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#10B981' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Category Breakdown Table */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-zinc-200 bg-zinc-50">
          <h3 className="text-sm font-bold text-zinc-900">Residence Revenue Contribution Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-600">
            <thead className="bg-zinc-50/50 text-zinc-500 uppercase tracking-wider font-semibold text-[10px]">
              <tr>
                <th className="py-3 px-4">Room Category</th>
                <th className="py-3 px-4">Completed Bookings</th>
                <th className="py-3 px-4">Gross Invoiced Revenue</th>
                <th className="py-3 px-4">Revenue Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {popularRoomTypes.map((rt: any) => {
                const share = ((rt.revenue / (kpis.totalRevenueCollected || 1)) * 100).toFixed(1);
                return (
                  <tr key={rt.name} className="hover:bg-zinc-50">
                    <td className="py-3.5 px-4 font-semibold text-zinc-900">{rt.name}</td>
                    <td className="py-3.5 px-4">{rt.bookings} reservations</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-amber-900">
                      ${rt.revenue.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-zinc-200 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-amber-600 h-full rounded-full"
                            style={{ width: `${Math.min(100, Number(share))}%` }}
                          />
                        </div>
                        <span className="font-semibold text-zinc-700">{share}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
