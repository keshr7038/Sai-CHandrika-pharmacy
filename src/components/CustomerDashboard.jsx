import React, { useContext, useState, useMemo } from 'react';
import { AppContext, getSheetDisplay } from '../context/AppContext';
import FirstAidKitsSection from './FirstAidKitsSection';
import {
  Search, ShoppingBag, Heart, Shield, Stethoscope, FlaskConical,
  ArrowRight, Pill, Star, TrendingUp, Clock, ShoppingCart,
  Sparkles, ChevronRight, BadgePercent, Truck, Package, Plus, Minus
} from 'lucide-react';

const healthCategories = [
  { name: 'Diabetes Care', icon: '🩸', color: 'bg-red-50 text-red-600', borderColor: 'border-red-100' },
  { name: 'Cardiac Care', icon: '❤️', color: 'bg-pink-50 text-pink-600', borderColor: 'border-pink-100' },
  { name: 'Stomach Care', icon: '🫁', color: 'bg-amber-50 text-amber-600', borderColor: 'border-amber-100' },
  { name: 'Pain Relief', icon: '💊', color: 'bg-blue-50 text-blue-600', borderColor: 'border-blue-100' },
  { name: 'Cold & Immunity', icon: '🛡️', color: 'bg-teal-50 text-teal-600', borderColor: 'border-teal-100' },
  { name: 'Vitamins', icon: '🍊', color: 'bg-orange-50 text-orange-600', borderColor: 'border-orange-100' },
  { name: 'Respiratory', icon: '🌬️', color: 'bg-sky-50 text-sky-600', borderColor: 'border-sky-100' },
  { name: 'Antibiotics', icon: '🧬', color: 'bg-purple-50 text-purple-600', borderColor: 'border-purple-100' },
];


export default function CustomerDashboard({ setCurrentTab, searchQuery, setSearchQuery, setActiveCategory }) {
  const { medicines, sales, user, addToCart, cart, removeFromCart, updateCartQuantity } = useContext(AppContext);
  const [searchTerm, setSearchTerm] = useState(searchQuery || '');

  const availableMeds = useMemo(() =>
    medicines.filter(m => m.stock > 0).slice(0, 8),
    [medicines]
  );

  const filteredMeds = useMemo(() => {
    if (!searchTerm) return availableMeds;
    const lower = searchTerm.toLowerCase();
    return medicines.filter(m =>
      m.stock > 0 && (m.name.toLowerCase().includes(lower) || m.category.toLowerCase().includes(lower) || m.genericName?.toLowerCase().includes(lower))
    ).slice(0, 12);
  }, [medicines, searchTerm, availableMeds]);

  const myOrders = sales.filter(s => s.customerName === user?.name || s.customerPhone === user?.phone);

  const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);

  const getCartQty = (medId) => {
    const item = cart.find(c => c.medicineId === medId);
    return item ? item.quantity : 0;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ===== HERO BANNER ===== */}
      <div className="hero-banner p-6 sm:p-8 text-white">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-white/70 mb-1">Welcome back, {user?.name?.split(' ')[0]} 👋</p>
          <h1 className="text-2xl sm:text-3xl font-bold mb-4">Buy Medicines & Essentials</h1>
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (searchTerm.trim()) {
                setSearchQuery(searchTerm);
                setCurrentTab('shop');
              }
            }} 
            className="relative max-w-lg flex gap-2"
          >
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search medicines, health products..."
                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white text-gray-800 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 shadow-lg"
              />
            </div>
            <button
              type="submit"
              className="px-6 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm transition-colors shadow-lg cursor-pointer"
            >
              Search
            </button>
          </form>
        </div>
        {/* Decorative Elements */}
        <div className="absolute top-4 right-8 hidden sm:block opacity-10">
          <Pill className="w-24 h-24 text-white" />
        </div>
      </div>


      {/* ===== BROWSE BY HEALTH CONDITIONS ===== */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800">Browse by Health Conditions</h2>
          <button onClick={() => setCurrentTab('shop')} className="text-sm font-semibold text-primary-600 hover:underline flex items-center gap-1">
            View All <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {healthCategories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => {
                setActiveCategory(cat.name);
                setCurrentTab('shop');
              }}
              className="health-category-card"
            >
              <div className={`health-category-icon ${cat.color}`}>
                <span className="text-xl">{cat.icon}</span>
              </div>
              <p className="text-xs font-semibold text-gray-700 text-center leading-tight">{cat.name}</p>
            </button>
          ))}
        </div>
      </section>

      {/* ===== FIRST AID KITS ===== */}
      <FirstAidKitsSection setCurrentTab={setCurrentTab} />

      {/* ===== POPULAR MEDICINES ===== */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800">
            {searchTerm ? `Results for "${searchTerm}"` : 'Popular Medicines'}
          </h2>
          <button onClick={() => setCurrentTab('shop')} className="text-sm font-semibold text-primary-600 hover:underline flex items-center gap-1">
            Shop All <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {filteredMeds.map((med) => {
            const inCartQty = getCartQty(med.id);
            return (
              <div key={med.id} className="card p-4 flex flex-col group">
                {/* Category Badge */}
                <span className="self-start badge badge-info mb-2">{med.category}</span>
                {/* Medicine Info */}
                <h4 className="text-sm font-bold text-gray-800 leading-tight mb-0.5">{med.name}</h4>
                <p className="text-xs text-gray-400 mb-2">{med.genericName}</p>
                {/* Dosage + Stock */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="badge badge-neutral">{med.dosageForm}</span>
                  {med.tabletsPerSheet > 1 && (
                    <span className="text-[10px] text-primary-500 font-semibold">{med.packaging || 'Strip'} of {med.tabletsPerSheet}</span>
                  )}
                  {med.stock <= med.minStock ? (
                    <span className="badge badge-warning">Low Stock</span>
                  ) : (
                    <span className="text-[10px] text-gray-400">{getSheetDisplay(med.stock, med.tabletsPerSheet, med.packaging).display}</span>
                  )}
                </div>
                {/* Price + Add to Cart */}
                <div className="mt-auto flex items-center justify-between gap-3">
                  <div>
                    <p className="text-base font-bold text-primary-700">{formatCurrency(med.sellingPrice)}</p>
                    <p className="text-[10px] text-gray-400 line-through">{formatCurrency(med.sellingPrice * 1.2)}</p>
                  </div>
                  <div className="w-24 shrink-0">
                    {inCartQty > 0 ? (
                      <div className="flex items-center justify-between bg-primary-50 rounded-xl border border-primary-200 overflow-hidden h-9">
                        <button
                          type="button"
                          onClick={() => {
                            if (inCartQty === 1) {
                              removeFromCart(med.id);
                            } else {
                              updateCartQuantity(med.id, inCartQty - 1);
                            }
                          }}
                          className="w-8 h-full flex items-center justify-center text-primary-700 hover:bg-primary-100 transition-colors font-bold text-sm cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="flex-1 text-center text-xs font-extrabold text-primary-700 font-mono">
                          {inCartQty}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            if (inCartQty < med.stock) {
                              updateCartQuantity(med.id, inCartQty + 1);
                            }
                          }}
                          className="w-8 h-full flex items-center justify-center text-primary-700 hover:bg-primary-100 transition-colors font-bold text-sm cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(med)}
                        disabled={med.stock <= 0}
                        className="w-full btn-primary btn-sm flex items-center justify-center gap-1 relative py-2 px-3 rounded-xl"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {filteredMeds.length === 0 && (
            <div className="col-span-full py-16 text-center">
              <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-gray-500">No medicines found</p>
              <p className="text-xs text-gray-400">Try a different search term</p>
            </div>
          )}
        </div>
      </section>

      {/* ===== MY RECENT ORDERS (if any) ===== */}
      {myOrders.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">My Recent Orders</h2>
            <button onClick={() => setCurrentTab('orders')} className="text-sm font-semibold text-primary-600 hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            {myOrders.slice(0, 3).map((order) => (
              <div key={order.id} className="card p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                    <Package className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{order.id}</p>
                    <p className="text-xs text-gray-400">{order.items.length} item(s) • {new Date(order.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-primary-700">{formatCurrency(order.total)}</p>
                  <span className={`badge ${order.paymentStatus === 'Success' ? 'badge-success' : 'badge-warning'}`}>
                    {order.paymentStatus}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ===== QUICK STATS FOR CUSTOMER ===== */}
      <section className="grid grid-cols-3 gap-4">
        <div className="card p-4 text-center">
          <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center mx-auto mb-2">
            <ShoppingBag className="w-5 h-5 text-primary-600" />
          </div>
          <p className="text-xl font-bold text-gray-800">{myOrders.length}</p>
          <p className="text-xs text-gray-400 font-medium">Orders Placed</p>
        </div>
        <div className="card p-4 text-center">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center mx-auto mb-2">
            <Sparkles className="w-5 h-5 text-amber-600" />
          </div>
          <p className="text-xl font-bold text-gray-800">{formatCurrency(myOrders.reduce((s, o) => s + o.total, 0))}</p>
          <p className="text-xs text-gray-400 font-medium">Total Spent</p>
        </div>
        <div className="card p-4 text-center">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mx-auto mb-2">
            <Star className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-xl font-bold text-gray-800">{medicines.length}</p>
          <p className="text-xs text-gray-400 font-medium">Medicines Available</p>
        </div>
      </section>
    </div>
  );
}
