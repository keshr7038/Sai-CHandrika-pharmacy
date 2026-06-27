import React, { useContext, useState, useMemo, useRef } from 'react';
import { AppContext } from '../context/AppContext';
import {
  Search,
  Filter,
  Download,
  Calendar,
  FileText,
  Eye,
  Printer,
  X,
  Receipt,
  CreditCard,
  Wallet,
  Smartphone,
  CheckCircle,
  Clock,
  AlertCircle,
  BarChart3,
} from 'lucide-react';

const formatCurrency = (val) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);
};

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const formatDateTime = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

// Payment method badge styling
const getPaymentMethodBadge = (method) => {
  switch (method) {
    case 'UPI':
      return 'bg-purple-50 text-purple-700 border border-purple-200';
    case 'Card':
      return 'bg-blue-50 text-blue-700 border border-blue-200';
    case 'Cash':
      return 'bg-green-50 text-green-700 border border-green-200';
    default:
      return 'bg-gray-100 text-gray-600 border border-gray-200';
  }
};

const getPaymentMethodIcon = (method) => {
  switch (method) {
    case 'UPI':
      return <Smartphone className="w-3 h-3" />;
    case 'Card':
      return <CreditCard className="w-3 h-3" />;
    case 'Cash':
      return <Wallet className="w-3 h-3" />;
    default:
      return null;
  }
};

export default function Transactions() {
  const { sales, payments, user, addNotification, customers } = useContext(AppContext);
  const printRef = useRef(null);

  const [activeSubTab, setActiveSubTab] = useState('orders'); // 'orders' | 'payments'

  // Filter state
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    customerName: '',
    medicineName: '',
    paymentMethod: 'All',
    paymentStatus: 'All',
  });

  // Applied filters (only update on "Apply")
  const [appliedFilters, setAppliedFilters] = useState({ ...filters });

  // Modal state
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Apply filters
  const handleApplyFilters = () => {
    setAppliedFilters({ ...filters });
  };

  // Reset filters
  const handleResetFilters = () => {
    const reset = {
      dateFrom: '',
      dateTo: '',
      customerName: '',
      medicineName: '',
      paymentMethod: 'All',
      paymentStatus: 'All',
    };
    setFilters(reset);
    setAppliedFilters(reset);
  };

  // Filtered sales
  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      // Date range
      if (appliedFilters.dateFrom) {
        const saleDate = new Date(sale.date).setHours(0, 0, 0, 0);
        const fromDate = new Date(appliedFilters.dateFrom).setHours(0, 0, 0, 0);
        if (saleDate < fromDate) return false;
      }
      if (appliedFilters.dateTo) {
        const saleDate = new Date(sale.date).setHours(23, 59, 59, 999);
        const toDate = new Date(appliedFilters.dateTo).setHours(23, 59, 59, 999);
        if (saleDate > toDate) return false;
      }

      // Customer name
      if (appliedFilters.customerName) {
        if (
          !sale.customerName
            .toLowerCase()
            .includes(appliedFilters.customerName.toLowerCase())
        )
          return false;
      }

      // Medicine name
      if (appliedFilters.medicineName) {
        const hasMatch = sale.items.some((item) =>
          item.name.toLowerCase().includes(appliedFilters.medicineName.toLowerCase())
        );
        if (!hasMatch) return false;
      }

      // Payment method
      if (
        appliedFilters.paymentMethod !== 'All' &&
        sale.paymentMethod !== appliedFilters.paymentMethod
      )
        return false;

      // Payment status
      if (
        appliedFilters.paymentStatus !== 'All' &&
        sale.paymentStatus !== appliedFilters.paymentStatus
      )
        return false;

      return true;
    });
  }, [sales, appliedFilters]);

  // Summary stats
  const totalTransactions = filteredSales.length;
  const totalRevenue = filteredSales.reduce((sum, s) => sum + s.total, 0);
  const avgOrderValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

  // Export PDF handler
  const handleExportPdf = () => {
    addNotification('📄 PDF export initiated — opening print dialog...', 'info');

    // Build printable content
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) {
      addNotification('⚠️ Pop-up blocked. Please allow pop-ups and try again.', 'warning');
      return;
    }

    const rows = filteredSales
      .map(
        (s) =>
          `<tr>
            <td style="border:1px solid #ddd;padding:6px;font-size:12px;">${s.id}</td>
            <td style="border:1px solid #ddd;padding:6px;font-size:12px;">${formatDate(s.date)}</td>
            <td style="border:1px solid #ddd;padding:6px;font-size:12px;">${s.customerName}</td>
            <td style="border:1px solid #ddd;padding:6px;font-size:12px;">${s.items.map((i) => `${i.name} ×${i.quantity}`).join(', ')}</td>
            <td style="border:1px solid #ddd;padding:6px;font-size:12px;">${s.paymentMethod}</td>
            <td style="border:1px solid #ddd;padding:6px;font-size:12px;">${s.paymentStatus}</td>
            <td style="border:1px solid #ddd;padding:6px;font-size:12px;text-align:right;">${formatCurrency(s.total)}</td>
          </tr>`
      )
      .join('');

    printWindow.document.write(`
      <html>
        <head><title>Transaction Report — Induja Medical Store</title></head>
        <body style="font-family:Arial,sans-serif;padding:20px;">
          <h2 style="color:#1B5E20;margin-bottom:4px;">Induja Medical Store</h2>
          <p style="color:#666;font-size:13px;margin-top:0;">Transaction Report — Generated ${new Date().toLocaleString('en-IN')}</p>
          <hr style="border:none;border-top:2px solid #1B5E20;margin:12px 0;"/>
          <p style="font-size:13px;"><strong>Total Transactions:</strong> ${totalTransactions} | <strong>Revenue:</strong> ${formatCurrency(totalRevenue)} | <strong>Avg Order:</strong> ${formatCurrency(avgOrderValue)}</p>
          <table style="width:100%;border-collapse:collapse;margin-top:12px;">
            <thead>
              <tr style="background:#1B5E20;color:white;">
                <th style="border:1px solid #ddd;padding:8px;font-size:11px;text-align:left;">Invoice</th>
                <th style="border:1px solid #ddd;padding:8px;font-size:11px;text-align:left;">Date</th>
                <th style="border:1px solid #ddd;padding:8px;font-size:11px;text-align:left;">Customer</th>
                <th style="border:1px solid #ddd;padding:8px;font-size:11px;text-align:left;">Items</th>
                <th style="border:1px solid #ddd;padding:8px;font-size:11px;text-align:left;">Payment</th>
                <th style="border:1px solid #ddd;padding:8px;font-size:11px;text-align:left;">Status</th>
                <th style="border:1px solid #ddd;padding:8px;font-size:11px;text-align:right;">Amount</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <p style="font-size:11px;color:#999;margin-top:16px;">This is a computer-generated report.</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 500);
  };

  return (
    <div className="space-y-6">
      {/* ========== FILTER SECTION ========== */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-primary-600" />
          <h3 className="text-sm font-bold text-gray-800">Filters & Search</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {/* Date From */}
          <div>
            <label className="input-label">From Date</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Calendar className="w-4 h-4" />
              </div>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                className="input !pl-9"
              />
            </div>
          </div>

          {/* Date To */}
          <div>
            <label className="input-label">To Date</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Calendar className="w-4 h-4" />
              </div>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                className="input !pl-9"
              />
            </div>
          </div>

          {/* Customer Name */}
          <div>
            <label className="input-label">Customer Name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Search customer..."
                value={filters.customerName}
                onChange={(e) => setFilters({ ...filters, customerName: e.target.value })}
                className="input !pl-9"
              />
            </div>
          </div>

          {/* Medicine Name */}
          <div>
            <label className="input-label">Medicine Name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Search medicine..."
                value={filters.medicineName}
                onChange={(e) => setFilters({ ...filters, medicineName: e.target.value })}
                className="input !pl-9"
              />
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="input-label">Payment Method</label>
            <select
              value={filters.paymentMethod}
              onChange={(e) => setFilters({ ...filters, paymentMethod: e.target.value })}
              className="select-field"
            >
              <option value="All">All Methods</option>
              <option value="Cash">Cash</option>
              <option value="Card">Card</option>
              <option value="UPI">UPI</option>
            </select>
          </div>

          {/* Payment Status */}
          <div>
            <label className="input-label">Payment Status</label>
            <select
              value={filters.paymentStatus}
              onChange={(e) =>
                setFilters({ ...filters, paymentStatus: e.target.value })
              }
              className="select-field"
            >
              <option value="All">All Status</option>
              <option value="Success">Success</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 mt-5 pt-4 border-t border-gray-100">
          <button onClick={handleApplyFilters} className="btn-primary btn-sm">
            <Filter className="w-3.5 h-3.5" />
            Apply Filters
          </button>
          <button onClick={handleResetFilters} className="btn-outline btn-sm">
            Reset
          </button>
          <button onClick={handleExportPdf} className="btn-accent btn-sm ml-auto">
            <Download className="w-3.5 h-3.5" />
            Export PDF
          </button>
        </div>
      </div>

      {/* ========== SUMMARY STATS ROW ========== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Transactions */}
        <div className="card-kpi">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                Total Transactions
              </p>
              <p className="text-2xl font-extrabold text-gray-800">{totalTransactions}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="card-kpi">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                Total Revenue
              </p>
              <p className="text-2xl font-extrabold text-primary-600">
                {formatCurrency(totalRevenue)}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>

        {/* Average Order Value */}
        <div className="card-kpi">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                Avg Order Value
              </p>
              <p className="text-2xl font-extrabold text-accent-600">
                {formatCurrency(avgOrderValue)}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <FileText className="w-5 h-5 text-amber-600" />
            </div>
          </div>
        </div>
      {/* Tab Selectors */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveSubTab('orders')}
          className={`px-6 py-3 text-sm font-semibold border-b-2 transition-all duration-200 cursor-pointer ${
            activeSubTab === 'orders'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Order Invoices ({filteredSales.length})
        </button>
        <button
          onClick={() => setActiveSubTab('payments')}
          className={`px-6 py-3 text-sm font-semibold border-b-2 transition-all duration-200 cursor-pointer ${
            activeSubTab === 'payments'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Online Payments Gateway ({(payments || []).length})
        </button>
      </div>

      {activeSubTab === 'orders' ? (
        /* ========== TRANSACTIONS TABLE ========== */
        <div className="card p-0 overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center">
                <Receipt className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-800">Transaction History</h2>
                <p className="text-[11px] text-gray-400 font-medium">
                  All sales invoices and payment records
                </p>
              </div>
            </div>
            <span className="badge-info">{filteredSales.length} Results</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="table-header">
                  <th>Invoice ID</th>
                  <th>Date & Time</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th className="text-right">Amount</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.length > 0 ? (
                  filteredSales.map((sale) => (
                    <tr key={sale.id} className="table-row">
                      <td className="font-mono font-bold text-gray-800 text-xs">{sale.id}</td>
                      <td>
                        <div className="text-xs text-gray-700">{formatDate(sale.date)}</div>
                        <div className="text-[11px] text-gray-400">
                          {new Date(sale.date).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true,
                          })}
                        </div>
                      </td>
                      <td>
                        <div className="font-semibold text-gray-800">{sale.customerName}</div>
                        {sale.customerPhone && (
                          <div className="text-[11px] text-gray-400">{sale.customerPhone}</div>
                        )}
                      </td>
                      <td>
                        <div className="space-y-0.5 max-w-[200px]">
                          {sale.items.slice(0, 2).map((item, idx) => (
                            <div key={idx} className="text-xs text-gray-500 truncate">
                              {item.name} <span className="font-semibold">×{item.quantity}</span>
                            </div>
                          ))}
                          {sale.items.length > 2 && (
                            <div className="text-[10px] text-gray-400 font-semibold">
                              +{sale.items.length - 2} more
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${getPaymentMethodBadge(
                            sale.paymentMethod
                          )}`}
                        >
                          {getPaymentMethodIcon(sale.paymentMethod)}
                          {sale.paymentMethod}
                        </span>
                      </td>
                      <td>
                        <span
                          className={
                            sale.paymentStatus === 'Success'
                              ? 'badge-success'
                              : 'badge-warning'
                          }
                        >
                          {sale.paymentStatus === 'Success' ? (
                            <CheckCircle className="w-3 h-3 mr-1" />
                          ) : (
                            <Clock className="w-3 h-3 mr-1" />
                          )}
                          {sale.paymentStatus}
                        </span>
                      </td>
                      <td className="text-right font-mono font-bold text-gray-800">
                        {formatCurrency(sale.total)}
                      </td>
                      <td className="text-right">
                        <button
                          onClick={() => setSelectedInvoice(sale)}
                          className="btn-ghost btn-sm text-primary-600 hover:text-primary-700"
                          title="View Invoice"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3 text-gray-400">
                        <Search className="w-10 h-10 text-gray-300" />
                        <div>
                          <p className="text-sm font-semibold text-gray-500">
                            No transactions found
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            Try adjusting your filters or date range
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="bg-gray-50 border-t border-gray-100 px-6 py-3 flex items-center justify-between text-xs text-gray-500 font-medium">
            <span>
              {filteredSales.length} of {sales.length} transaction(s) shown
            </span>
            <span>
              Revenue:{' '}
              <span className="font-bold text-primary-600">{formatCurrency(totalRevenue)}</span>
            </span>
          </div>
        </div>
      ) : (
        /* ========== PAYMENTS TABLE ========== */
        <div className="card p-0 overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-800">Online Payments Gateway Logs</h2>
                <p className="text-[11px] text-gray-400 font-medium">
                  Verified Razorpay transactions and status
                </p>
              </div>
            </div>
            <span className="badge-info">{(payments || []).length} Logs</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="table-header">
                  <th>Payment ID</th>
                  <th>Order ID</th>
                  <th>Date & Time</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(payments && payments.length > 0) ? (
                  payments.map((pay) => {
                    const customer = customers ? customers.find(c => c.id === pay.user_id) : null;
                    const customerDisplay = user?.role === 'customer' 
                      ? user.name 
                      : (customer ? `${customer.name} (${customer.phone || 'No phone'})` : 'Walk-in Customer / Guest');
                    
                    return (
                      <tr key={pay.id} className="table-row">
                        <td className="font-mono font-bold text-xs text-primary-700">{pay.payment_id}</td>
                        <td className="font-mono text-gray-400 text-xs">{pay.order_id}</td>
                        <td>
                          <div className="text-xs text-gray-700">{formatDate(pay.created_at)}</div>
                          <div className="text-[11px] text-gray-400">
                            {new Date(pay.created_at).toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true,
                            })}
                          </div>
                        </td>
                        <td className="text-xs font-semibold text-gray-800">{customerDisplay}</td>
                        <td className="font-mono font-bold text-gray-800 text-xs">
                          {formatCurrency(pay.amount / 100)}
                        </td>
                        <td>
                          <span className={pay.status === 'success' ? 'badge-success' : 'badge-danger'}>
                            {pay.status === 'success' ? (
                              <CheckCircle className="w-3 h-3 mr-1" />
                            ) : (
                              <X className="w-3 h-3 mr-1" />
                            )}
                            {pay.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3 text-gray-400">
                        <Smartphone className="w-10 h-10 text-gray-300" />
                        <div>
                          <p className="text-sm font-semibold text-gray-500">No payment logs found</p>
                          <p className="text-xs text-gray-400 mt-0.5">There are no gateway logs logged in Supabase yet.</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="bg-gray-50 border-t border-gray-100 px-6 py-3 text-xs text-gray-500 font-medium">
            Total logs: {(payments || []).length}
          </div>
        </div>
      )}
      </div>

      {/* ========== INVOICE DETAIL MODAL ========== */}
      {selectedInvoice && (
        <div className="modal-overlay" onClick={() => setSelectedInvoice(null)}>
          <div
            className="modal-container w-full max-w-2xl max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="modal-header">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary-600" />
                <h3 className="text-sm font-bold text-gray-800">
                  Invoice {selectedInvoice.id}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    // Print invoice
                    const invoicePrint = window.open('', '_blank', 'width=600,height=800');
                    if (!invoicePrint) return;
                    const itemRows = selectedInvoice.items
                      .map(
                        (item, idx) =>
                          `<tr>
                            <td style="border:1px solid #eee;padding:6px;font-size:12px;">${idx + 1}</td>
                            <td style="border:1px solid #eee;padding:6px;font-size:12px;">${item.name}</td>
                            <td style="border:1px solid #eee;padding:6px;font-size:12px;text-align:center;">${item.quantity}</td>
                            <td style="border:1px solid #eee;padding:6px;font-size:12px;text-align:right;">${formatCurrency(item.price)}</td>
                            <td style="border:1px solid #eee;padding:6px;font-size:12px;text-align:right;">${formatCurrency(item.subtotal)}</td>
                          </tr>`
                      )
                      .join('');

                    invoicePrint.document.write(`
                      <html>
                        <head><title>Invoice ${selectedInvoice.id}</title></head>
                        <body style="font-family:Arial,sans-serif;padding:30px;max-width:600px;margin:auto;">
                          <div style="text-align:center;margin-bottom:20px;">
                            <h2 style="color:#1B5E20;margin-bottom:2px;">🏥 Induja Medical Store</h2>
                            <p style="color:#666;font-size:11px;margin:0;">Your Trusted Health Partner | DL-2026-RX-44821</p>
                            <p style="color:#999;font-size:10px;margin:4px 0 0 0;">123 Health Avenue, Medical District</p>
                          </div>
                          <hr style="border:none;border-top:2px solid #1B5E20;margin:12px 0;"/>
                          <div style="display:flex;justify-content:space-between;font-size:12px;color:#555;margin-bottom:12px;">
                            <div><strong>Invoice:</strong> ${selectedInvoice.id}<br/><strong>Date:</strong> ${formatDateTime(selectedInvoice.date)}</div>
                            <div style="text-align:right;"><strong>Customer:</strong> ${selectedInvoice.customerName}<br/><strong>Phone:</strong> ${selectedInvoice.customerPhone || 'N/A'}</div>
                          </div>
                          <table style="width:100%;border-collapse:collapse;">
                            <thead>
                              <tr style="background:#f5f5f5;">
                                <th style="border:1px solid #eee;padding:8px;font-size:11px;text-align:left;">#</th>
                                <th style="border:1px solid #eee;padding:8px;font-size:11px;text-align:left;">Medicine</th>
                                <th style="border:1px solid #eee;padding:8px;font-size:11px;text-align:center;">Qty</th>
                                <th style="border:1px solid #eee;padding:8px;font-size:11px;text-align:right;">Price</th>
                                <th style="border:1px solid #eee;padding:8px;font-size:11px;text-align:right;">Total</th>
                              </tr>
                            </thead>
                            <tbody>${itemRows}</tbody>
                          </table>
                          <div style="text-align:right;margin-top:12px;font-size:12px;color:#555;">
                            <p>Tax: <strong>${formatCurrency(selectedInvoice.tax)}</strong></p>
                            <p>Discount: <strong>-${formatCurrency(selectedInvoice.discount)}</strong></p>
                            <p style="font-size:16px;color:#1B5E20;font-weight:bold;margin-top:4px;">Total: ${formatCurrency(selectedInvoice.total)}</p>
                          </div>
                          <div style="margin-top:16px;padding:10px;background:#f9f9f9;border-radius:8px;font-size:11px;color:#666;">
                            <strong>Payment:</strong> ${selectedInvoice.paymentMethod} — ${selectedInvoice.paymentStatus} | <strong>Cashier:</strong> ${selectedInvoice.cashier}
                          </div>
                          <p style="text-align:center;font-size:10px;color:#aaa;margin-top:20px;">Thank you for choosing Induja Medical Store! 💚</p>
                        </body>
                      </html>
                    `);
                    invoicePrint.document.close();
                    invoicePrint.focus();
                    setTimeout(() => invoicePrint.print(), 500);
                  }}
                  className="btn-ghost btn-sm"
                  title="Print Invoice"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="btn-ghost btn-sm"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Store & Invoice Info */}
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div>
                  <h4 className="text-base font-bold text-primary-700">🏥 Induja Medical Store</h4>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Your Trusted Health Partner
                  </p>
                  <p className="text-[11px] text-gray-400">DL-2026-RX-44821</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">
                    <span className="font-bold text-gray-700">Invoice:</span>{' '}
                    {selectedInvoice.id}
                  </p>
                  <p className="text-xs text-gray-500">
                    <span className="font-bold text-gray-700">Date:</span>{' '}
                    {formatDateTime(selectedInvoice.date)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    <span className="font-bold text-gray-700">Cashier:</span>{' '}
                    {selectedInvoice.cashier}
                  </p>
                </div>
              </div>

              {/* Customer Info */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                  Customer
                </p>
                <p className="text-sm font-semibold text-gray-800">
                  {selectedInvoice.customerName}
                </p>
                {selectedInvoice.customerPhone && (
                  <p className="text-xs text-gray-500">{selectedInvoice.customerPhone}</p>
                )}
              </div>

              {/* Itemized Table */}
              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="w-full text-left">
                  <thead>
                    <tr className="table-header">
                      <th>#</th>
                      <th>Medicine</th>
                      <th className="text-center">Qty</th>
                      <th className="text-right">Price</th>
                      <th className="text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInvoice.items.map((item, idx) => (
                      <tr key={idx} className="table-row">
                        <td className="text-gray-400 font-mono text-xs">{idx + 1}</td>
                        <td className="font-semibold text-gray-800">{item.name}</td>
                        <td className="text-center font-mono">{item.quantity}</td>
                        <td className="text-right font-mono">{formatCurrency(item.price)}</td>
                        <td className="text-right font-mono font-bold">
                          {formatCurrency(item.subtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Subtotal</span>
                    <span className="font-mono">
                      {formatCurrency(
                        selectedInvoice.items.reduce((s, i) => s + i.subtotal, 0)
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Tax</span>
                    <span className="font-mono">
                      +{formatCurrency(selectedInvoice.tax)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Discount</span>
                    <span className="font-mono text-green-600">
                      -{formatCurrency(selectedInvoice.discount)}
                    </span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 flex justify-between">
                    <span className="text-sm font-bold text-gray-800">Grand Total</span>
                    <span className="text-lg font-extrabold text-primary-600">
                      {formatCurrency(selectedInvoice.total)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Info */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                    Payment
                  </p>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${getPaymentMethodBadge(
                        selectedInvoice.paymentMethod
                      )}`}
                    >
                      {getPaymentMethodIcon(selectedInvoice.paymentMethod)}
                      {selectedInvoice.paymentMethod}
                    </span>
                    <span
                      className={
                        selectedInvoice.paymentStatus === 'Success'
                          ? 'badge-success'
                          : 'badge-warning'
                      }
                    >
                      {selectedInvoice.paymentStatus}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setSelectedInvoice(null)} className="btn-outline btn-sm">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
