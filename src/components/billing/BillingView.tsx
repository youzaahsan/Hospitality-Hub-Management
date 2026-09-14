import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Search,
  DollarSign,
  Printer,
  CreditCard,
  Plus,
  RefreshCw,
  X,
  CheckCircle,
  FileText,
  Calendar,
  Crown,
} from 'lucide-react';
import { Invoice, Payment } from '../../types';
import { api } from '../../services/api';
import { StatusBadge } from '../common/Badge';

interface BillingViewProps {
  initialInvoiceId?: string | null;
}

export const BillingView: React.FC<BillingViewProps> = ({ initialInvoiceId }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Printable Folio Modal
  const [activeInvoice, setActiveInvoice] = useState<Invoice | null>(null);

  // Record Payment Modal
  const [paymentTarget, setPaymentTarget] = useState<Invoice | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<'card' | 'cash' | 'bank_transfer'>('card');
  const [payRef, setPayRef] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [isSubmittingPay, setIsSubmittingPay] = useState(false);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ success: boolean; data: Invoice[] }>('/invoices');
      if (res.success) {
        setInvoices(res.data);
        if (initialInvoiceId) {
          const matched = res.data.find(
            (i) => i._id === initialInvoiceId || i.reservationId === initialInvoiceId
          );
          if (matched) setActiveInvoice(matched);
        }
      }
    } catch (err) {
      console.error('Failed to load invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [initialInvoiceId]);

  const handleOpenPayment = (inv: Invoice) => {
    setPaymentTarget(inv);
    setPayAmount(inv.balance);
    setPayMethod('card');
    setPayRef(`TXN-${Date.now().toString().slice(-6)}`);
    setPayNotes('');
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentTarget) return;

    setIsSubmittingPay(true);
    try {
      const res = await api.post<{ success: boolean; data: any }>('/payments', {
        invoiceId: paymentTarget._id,
        amount: Number(payAmount),
        paymentMethod: payMethod,
        referenceNumber: payRef,
        notes: payNotes,
      });

      if (res.success) {
        setPaymentTarget(null);
        await fetchInvoices();
        // If the printable modal is open, update it
        if (activeInvoice && activeInvoice._id === paymentTarget._id) {
          const updated = await api.get<{ success: boolean; data: Invoice }>(`/invoices/${paymentTarget._id}`);
          if (updated.success) setActiveInvoice(updated.data);
        }
      }
    } catch (err: any) {
      alert(err.message || 'Payment recording failed.');
    } finally {
      setIsSubmittingPay(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const filtered = invoices.filter((inv) => {
    const matchSearch =
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.roomNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-serif font-bold text-zinc-900">Guest Folios & Invoicing</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Itemized accommodation charges, dining, resort taxes, and integrated payment processing.
          </p>
        </div>

        <button
          onClick={fetchInvoices}
          className="p-2 text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 rounded-xl transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search invoice #, guest, or room..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 border border-zinc-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {['all', 'paid', 'issued', 'draft', 'cancelled'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg capitalize font-medium transition-colors ${
                statusFilter === st ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-600">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 uppercase tracking-wider font-semibold text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Invoice #</th>
                <th className="py-3.5 px-4">Guest</th>
                <th className="py-3.5 px-4">Room</th>
                <th className="py-3.5 px-4">Stay Dates</th>
                <th className="py-3.5 px-4">Total</th>
                <th className="py-3.5 px-4">Balance</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-zinc-400">
                    Loading folios...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-zinc-400">
                    No invoices matching query.
                  </td>
                </tr>
              ) : (
                filtered.map((inv) => (
                  <tr key={inv._id} className="hover:bg-zinc-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-medium text-zinc-900">
                      {inv.invoiceNumber}
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-zinc-900">{inv.guestName}</td>

                    <td className="py-3.5 px-4 font-mono">Room {inv.roomNumber}</td>

                    <td className="py-3.5 px-4 text-zinc-500">
                      {inv.checkInDate} → {inv.checkOutDate}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-zinc-900">${inv.total.toFixed(2)}</td>

                    <td className="py-3.5 px-4">
                      {inv.balance > 0 ? (
                        <span className="font-bold text-amber-700">${inv.balance.toFixed(2)}</span>
                      ) : (
                        <span className="font-semibold text-emerald-700">Settled ($0.00)</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge status={inv.status} type="payment" />
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {inv.balance > 0 && inv.status !== 'cancelled' && (
                          <button
                            onClick={() => handleOpenPayment(inv)}
                            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] rounded-md transition-colors flex items-center gap-1"
                            title="Record Folio Payment"
                          >
                            <CreditCard className="w-3 h-3" />
                            <span>Pay</span>
                          </button>
                        )}

                        <button
                          onClick={() => setActiveInvoice(inv)}
                          className="px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold text-[11px] rounded-md transition-colors flex items-center gap-1"
                          title="View & Print Official Folio"
                        >
                          <FileText className="w-3 h-3 text-zinc-500" />
                          <span>Folio</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Luxury Printable Folio Modal */}
      {activeInvoice && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl border border-zinc-200 my-8 animate-in fade-in zoom-in-95">
            {/* Modal Controls Bar */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-200 mb-6 print:hidden">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Official Hotel Guest Folio
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-semibold transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Folio</span>
                </button>
                <button
                  onClick={() => setActiveInvoice(null)}
                  className="p-1.5 text-zinc-400 hover:text-zinc-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Folio Document */}
            <div className="space-y-6">
              {/* Hotel Letterhead */}
              <div className="flex justify-between items-start border-b-2 border-zinc-950 pb-4">
                <div>
                  <div className="flex items-center space-x-2 text-zinc-950">
                    <Crown className="w-6 h-6 text-amber-600" />
                    <h2 className="text-xl font-serif font-bold tracking-wide">
                      THE GRAND IMPERIAL & SPA
                    </h2>
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1">
                    7 Boulevard de la Croisette, 06400 Cannes, French Riviera
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    Tel: +33 (0)4 92 98 77 00 • concierge@luxurystay.com
                  </p>
                </div>

                <div className="text-right">
                  <div className="text-lg font-serif font-bold text-zinc-900">GUEST FOLIO</div>
                  <div className="font-mono text-xs font-bold text-amber-800 mt-0.5">
                    {activeInvoice.invoiceNumber}
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-1">
                    Date: {new Date(activeInvoice.issuedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Guest & Stay Details Grid */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-zinc-50 p-4 rounded-xl border border-zinc-200">
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Guest Name</span>
                  <span className="font-bold text-zinc-900 text-sm">{activeInvoice.guestName}</span>
                  <span className="text-zinc-500 block">{activeInvoice.guestEmail}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Room Allocation</span>
                  <span className="font-bold text-zinc-900 text-sm">Suite #{activeInvoice.roomNumber}</span>
                  <span className="text-zinc-500 block">
                    {activeInvoice.checkInDate} to {activeInvoice.checkOutDate}
                  </span>
                </div>
              </div>

              {/* Itemized Folio Table */}
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-300 text-zinc-500 uppercase text-[10px]">
                    <th className="py-2">Description</th>
                    <th className="py-2">Category</th>
                    <th className="py-2 text-center">Qty</th>
                    <th className="py-2 text-right">Unit Rate</th>
                    <th className="py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {activeInvoice.items.map((item, idx) => (
                    <tr key={idx} className="text-zinc-700">
                      <td className="py-2.5 font-medium text-zinc-900">{item.description}</td>
                      <td className="py-2.5 capitalize text-zinc-500">{item.category}</td>
                      <td className="py-2.5 text-center">{item.quantity}</td>
                      <td className="py-2.5 text-right font-mono">${item.unitPrice.toFixed(2)}</td>
                      <td className="py-2.5 text-right font-mono font-semibold">${item.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Financial Calculation Summary */}
              <div className="border-t-2 border-zinc-900 pt-3 space-y-1.5 text-xs">
                <div className="flex justify-between text-zinc-600">
                  <span>Subtotal:</span>
                  <span className="font-mono">${activeInvoice.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <span>Hospitality & Resort Tax (12%):</span>
                  <span className="font-mono">${activeInvoice.taxAmount.toFixed(2)}</span>
                </div>
                {activeInvoice.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Courtesy VIP Discount:</span>
                    <span className="font-mono">-${activeInvoice.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-zinc-200 pt-2 font-bold text-sm text-zinc-900">
                  <span>Total Charges:</span>
                  <span className="font-mono">${activeInvoice.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <span>Payments Received:</span>
                  <span className="font-mono text-emerald-700 font-semibold">
                    ${activeInvoice.amountPaid.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between border-t-2 border-zinc-900 pt-2 font-black text-base text-zinc-950">
                  <span>Balance Due:</span>
                  <span className="font-mono text-amber-900">${activeInvoice.balance.toFixed(2)}</span>
                </div>
              </div>

              {/* Footer Stamp */}
              <div className="text-[10px] text-zinc-400 text-center pt-4 border-t border-zinc-200">
                Thank you for choosing The Grand Imperial. All charges are authorized under guest registration card.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {paymentTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-zinc-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <h3 className="text-base font-bold text-zinc-900">
                Record Payment: {paymentTarget.invoiceNumber}
              </h3>
              <button
                onClick={() => setPaymentTarget(null)}
                className="p-1 text-zinc-400 hover:text-zinc-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="mt-4 space-y-4 text-xs">
              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 flex justify-between">
                <span className="text-zinc-500">Current Outstanding Balance:</span>
                <span className="font-bold text-amber-900">${paymentTarget.balance.toFixed(2)}</span>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Amount to Collect ($)</label>
                <input
                  type="number"
                  step="0.01"
                  max={paymentTarget.balance}
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="w-full border border-zinc-300 rounded-lg p-2 font-bold text-zinc-900"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Payment Method</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as any)}
                  className="w-full border border-zinc-300 rounded-lg p-2"
                >
                  <option value="card">Credit / Debit Card</option>
                  <option value="cash">Cash Tender</option>
                  <option value="bank_transfer">Wire / Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Transaction / Reference #</label>
                <input
                  type="text"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  className="w-full border border-zinc-300 rounded-lg p-2 font-mono"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPaymentTarget(null)}
                  className="px-4 py-2 font-semibold text-zinc-600 hover:text-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPay}
                  className="px-5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-lg shadow-xs disabled:opacity-50"
                >
                  {isSubmittingPay ? 'Recording...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
