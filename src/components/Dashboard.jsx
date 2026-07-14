import React, { useContext, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import {
  Pill, TrendingUp, AlertTriangle, Truck, ShoppingBag,
  Sparkles, ArrowRight, ArrowUpRight, ArrowDownRight,
  IndianRupee, Package, Clock, CheckCircle, XCircle, BarChart3
} from 'lucide-react';

const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);
const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
const formatTime = (d) => new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

export default function Dashboard({ setCurrentTab }) {
  const { medicines, vendors, sales, purchases } = useContext(AppContext);

  const stats = useMemo(() => {
    const today = new Date().toDateString();
    const todaySales = sales.filter(s => new Date(s.date).toDateString() === today);
    const totalRevenue = sales.reduce((s, t) => s + t.total, 0);
    const todayRevenue = todaySales.reduce((s, t) => s + t.total, 0);
    const totalPurchaseCost = purchases.reduce((s, p) => s + p.total, 0);
    const lowStock = medicines.filter(m => m.stock <= m.minStock);
    const expiringSoon = medicines.filter(m => {
      const exp = new Date(m.expiryDate);
      const daysLeft = (exp - new Date()) / (1000 * 60 * 60 * 24);
      return daysLeft <= 30 && daysLeft > 0;
    });

    return {
      totalMedicines: medicines.length,
      todayRevenue,
      totalRevenue,
      totalPurchaseCost,
      lowStockCount: lowStock.length,
      lowStockItems: lowStock,
      expiringSoon,
      vendorCount: vendors.length,
      totalPurchases: totalPurchaseCost,
      profit: totalRevenue - totalPurchaseCost,
      totalSalesCount: sales.length,
      todaySalesCount: todaySales.length,
    };
  }, [medicines, vendors, sales, purchases]);

  const kpis = [
    {
      label: 'Total Medicines',
      value: stats.totalMedicines,
      icon: Pill,
      iconBg: 'bg-teal-50',
      iconColor: 'text-teal-600',
      tab: 'medicines',
      trend: null,
    },
    {
      label: "Today's Revenue",
      value: formatCurrency(stats.todayRevenue),
      icon: IndianRupee,
      iconBg: 'bg-green-50',
      iconColor: 'text-green-600',
      tab: 'transactions',
      trend: stats.todaySalesCount > 0 ? `${stats.todaySalesCount} orders today` : 'No orders yet',
      trendPositive: stats.todaySalesCount > 0,
    },
    {
      label: 'Total Sales',
      value: formatCurrency(stats.totalRevenue),
      icon: TrendingUp,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      tab: 'transactions',
      trend: `${stats.totalSalesCount} transactions`,
      trendPositive: true,
    },
    {
      label: 'Low Stock Items',
      value: stats.lowStockCount,
      icon: AlertTriangle,
      iconBg: stats.lowStockCount > 0 ? 'bg-red-50' : 'bg-green-50',
      iconColor: stats.lowStockCount > 0 ? 'text-red-600' : 'text-green-600',
      tab: 'medicines',
      trend: stats.lowStockCount > 0 ? 'Needs attention' : 'All healthy',
      trendPositive: stats.lowStockCount === 0,
    },
    {
      label: 'Total Vendors',
      value: stats.vendorCount,
      icon: Truck,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      tab: 'vendors',
      trend: null,
    },
    {
      label: 'Total Purchases',
      value: formatCurrency(stats.totalPurchases),
      icon: ShoppingBag,
      iconBg: 'bg-purple-50',
      iconColor: 'text-purple-600',
      tab: 'purchases',
      trend: `${purchases.length} orders`,
      trendPositive: true,
    },
    {
      label: 'Profit',
      value: formatCurrency(stats.profit),
      icon: Sparkles,
      iconBg: 'bg-gradient-to-br from-primary-50 to-accent-50',
      iconColor: 'text-primary-600',
      tab: 'transactions',
      trend: stats.profit >= 0 ? 'Profitable' : 'Loss',
      trendPositive: stats.profit >= 0,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ===== WELCOME HEADER ===== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Owner Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setCurrentTab('sales')} className="btn-primary">
            <ShoppingBag className="w-4 h-4" />
            New Bill
          </button>
          <button onClick={() => setCurrentTab('medicines')} className="btn-outline">
            <Pill className="w-4 h-4" />
            Add Medicine
          </button>
        </div>
      </div>

      {/* ===== LOW STOCK / EXPIRY ALERTS ===== */}
      {(stats.lowStockCount > 0 || stats.expiringSoon.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {stats.lowStockCount > 0 && (
            <div className="alert-warning cursor-pointer" onClick={() => setCurrentTab('medicines')}>
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm">Low Stock Alert</p>
                <p className="text-xs mt-0.5">{stats.lowStockCount} medicine(s) below minimum level — <span className="font-semibold underline">View & Restock</span></p>
              </div>
            </div>
          )}
          {stats.expiringSoon.length > 0 && (
            <div className="alert-danger cursor-pointer" onClick={() => setCurrentTab('medicines')}>
              <Clock className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm">Expiry Warning</p>
                <p className="text-xs mt-0.5">{stats.expiringSoon.length} medicine(s) expiring within 30 days — <span className="font-semibold underline">Review</span></p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== CUSTOMER PORTAL QR CODE ===== */}
      <div className="card p-6 bg-white border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-lg">
          <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-primary-50 text-primary-700 uppercase tracking-wider">Customer Access QR</span>
          <h3 className="text-lg font-bold text-gray-800">Customer Shop Portal Login</h3>
          <p className="text-sm text-gray-500 leading-relaxed">
            Scan this QR code with a mobile device to access the shop portal. 
            Customers will be prompted to enter their Name, Email, and Phone number to log in instantly. No OTP code is required for customers.
          </p>
          <div className="pt-2 text-xs text-gray-400">
            <strong>Store link:</strong> <span className="font-mono bg-gray-50 px-2 py-1 rounded select-all">{`${window.location.origin}/customer-login`}</span>
          </div>
        </div>
        <div className="flex flex-col items-center gap-2 bg-gray-50 p-4 rounded-2xl border border-gray-100 shrink-0">
          <img 
            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(window.location.origin + '/customer-login')}`}
            alt="Customer Portal QR Code"
            className="w-36 h-36 border border-gray-200 rounded-xl bg-white p-2 shadow-sm"
          />
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1 font-semibold">Scan to Login</span>
        </div>
      </div>

      {/* ===== KPI CARDS GRID ===== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              onClick={() => setCurrentTab(kpi.tab)}
              className="card-kpi hover:scale-[1.02] transition-transform cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-11 h-11 rounded-xl ${kpi.iconBg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${kpi.iconColor}`} />
                </div>
                <ArrowUpRight className="w-4 h-4 text-gray-300" />
              </div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{kpi.label}</p>
              <p className="text-xl font-bold text-gray-800">{kpi.value}</p>
              {kpi.trend && (
                <p className={`text-[11px] mt-1.5 font-medium flex items-center gap-1 ${kpi.trendPositive ? 'text-green-600' : 'text-red-500'}`}>
                  {kpi.trendPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {kpi.trend}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* ===== QUICK ACTIONS + RECENT ORDERS (Two-column) ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Recent Transactions */}
        <div className="lg:col-span-3 card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-800">Recent Orders</h3>
            <button onClick={() => setCurrentTab('transactions')} className="text-xs font-semibold text-primary-600 hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="table-header text-left">
                  <th>Invoice</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th className="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {sales.slice(0, 5).map((sale) => (
                  <tr key={sale.id} className="table-row">
                    <td className="font-mono text-xs font-semibold text-primary-600">{sale.id}</td>
                    <td className="text-sm text-gray-700">{sale.customerName}</td>
                    <td>
                      <p className="text-xs text-gray-600">{formatDate(sale.date)}</p>
                      <p className="text-[10px] text-gray-400">{formatTime(sale.date)}</p>
                    </td>
                    <td>
                      <span className={`badge ${
                        sale.paymentMethod === 'UPI' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                        sale.paymentMethod === 'Card' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        'bg-green-50 text-green-700 border-green-200'
                      }`}>
                        {sale.paymentMethod}
                      </span>
                    </td>
                    <td>
                      {sale.paymentStatus === 'Success' ? (
                        <span className="badge badge-success flex items-center gap-1 w-fit">
                          <CheckCircle className="w-3 h-3" /> Paid
                        </span>
                      ) : (
                        <span className="badge badge-warning flex items-center gap-1 w-fit">
                          <Clock className="w-3 h-3" /> Pending
                        </span>
                      )}
                    </td>
                    <td className="text-right font-semibold text-sm text-gray-800">{formatCurrency(sale.total)}</td>
                  </tr>
                ))}
                {sales.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-sm text-gray-400">No transactions yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Panel */}
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Low Stock Items
            </h3>
            <span className="badge badge-warning">{stats.lowStockCount}</span>
          </div>
          <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
            {stats.lowStockItems.length > 0 ? (
              stats.lowStockItems.map((med) => (
                <div key={med.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{med.name}</p>
                    <p className="text-xs text-gray-400">{med.category}</p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className={`text-sm font-bold ${med.stock === 0 ? 'text-red-600' : 'text-amber-600'}`}>
                      {med.stock} left
                    </p>
                    <p className="text-[10px] text-gray-400">min: {med.minStock}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-10 text-center">
                <CheckCircle className="w-10 h-10 text-green-300 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-500">All medicines well-stocked</p>
              </div>
            )}
          </div>
          {stats.lowStockItems.length > 0 && (
            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50">
              <button onClick={() => setCurrentTab('purchases')} className="btn-primary btn-sm w-full">
                <Package className="w-3.5 h-3.5" />
                Restock Now
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ===== EXPIRING MEDICINES (if any) ===== */}
      {stats.expiringSoon.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <Clock className="w-4 h-4 text-red-500" />
              Medicines Expiring Soon
            </h3>
            <span className="badge badge-danger">{stats.expiringSoon.length}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 p-5">
            {stats.expiringSoon.map((med) => {
              const daysLeft = Math.ceil((new Date(med.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
              return (
                <div key={med.id} className="flex items-center gap-3 p-3 rounded-xl bg-red-50/50 border border-red-100">
                  <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4 text-red-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{med.name}</p>
                    <p className="text-xs text-red-600 font-medium">{daysLeft} days left • Exp: {formatDate(med.expiryDate)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
