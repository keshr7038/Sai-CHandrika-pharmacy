import React, { useContext, useState, useMemo } from 'react';
import { AppContext, getSheetDisplay } from '../context/AppContext';
import FirstAidKitsSection from './FirstAidKitsSection';
import {
  Search, ShoppingBag, Heart, Shield, Stethoscope, FlaskConical,
  ArrowRight, Pill, Star, TrendingUp, Clock, ShoppingCart,
  Sparkles, ChevronRight, BadgePercent, Truck, Package, Plus, Minus,
  Activity, Phone, MessageSquare
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

      {/* ===== RECENT ORDERS & EMERGENCY SERVICES GRID ===== */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Recent Orders (Takes 2 columns) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800">My Recent Orders</h2>
            {myOrders.length > 0 && (
              <button 
                onClick={() => setCurrentTab('orders')} 
                className="text-sm font-semibold text-primary-600 hover:underline flex items-center gap-1 cursor-pointer"
              >
                View All <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
          {myOrders.length > 0 ? (
            <div className="grid grid-cols-1 gap-3">
              {myOrders.slice(0, 3).map((order) => (
                <div key={order.id} className="card p-4 flex items-center justify-between bg-white/90 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                      <Package className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-800">#{order.id.slice(-8).toUpperCase()}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          order.paymentStatus === 'Success' || order.paymentStatus === 'paid' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {order.paymentStatus}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {order.items?.length || 0} item(s) • {new Date(order.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-4">
                    <div>
                      <p className="text-sm font-bold text-primary-700">{formatCurrency(order.total)}</p>
                    </div>
                    <button 
                      onClick={() => setCurrentTab('orders')} 
                      className="btn-outline btn-xs rounded-lg px-2.5 py-1 text-[11px] border-primary-200 text-primary-700 hover:bg-primary-600 hover:text-white transition-all cursor-pointer font-bold"
                    >
                      Track
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card p-6 bg-white/80 backdrop-blur-sm text-center border border-dashed border-gray-200 h-[264px] flex flex-col items-center justify-center">
              <ShoppingBag className="w-12 h-12 text-primary-500/40 mb-3" />
              <h3 className="text-sm font-bold text-gray-700">Ready to order your medicines?</h3>
              <p className="text-xs text-gray-400 mt-1 max-w-sm">Browse our wide range of medicines and daily essentials and get them delivered to your doorstep.</p>
              <button 
                onClick={() => setCurrentTab('shop')} 
                className="btn-primary btn-sm mt-4 rounded-xl px-5 py-2 flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                Start Shopping <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Right: Emergency Services (Takes 1 column) */}
        <div className="lg:col-span-1 bg-white/95 backdrop-blur-sm rounded-3xl border border-gray-100 shadow-md overflow-hidden flex flex-col">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-3.5 flex items-center gap-3.5 relative overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0 shadow-inner">
              <Activity className="w-5.5 h-5.5 text-white animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight leading-tight">Emergency Services</h3>
              <p className="text-[10px] text-white/80 font-medium mt-0.5">Quick Help When You Need It</p>
            </div>
            <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 w-12 h-12 rounded-full bg-white/5" />
          </div>

          {/* Sub-widgets body */}
          <div className="p-3.5 space-y-3.5 flex-1">
            
            {/* Ambulance Services */}
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-5.5 h-5.5 rounded-lg bg-green-50 flex items-center justify-center">
                  <span className="text-xs font-bold">🚑</span>
                </div>
                <h4 className="text-[10px] font-bold text-gray-800 uppercase tracking-wider">Ambulance Services</h4>
              </div>
              <a 
                href="tel:108"
                className="w-full bg-gradient-to-r from-green-600 to-green-750 hover:from-green-700 hover:to-green-800 text-white rounded-xl py-2 px-3.5 flex items-center justify-between group shadow-sm transition-all duration-200 cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-white animate-bounce" />
                  <div className="text-left">
                    <p className="text-xs font-black tracking-wide">Call Ambulance</p>
                    <p className="text-[9px] text-white/80">Call Now: 108</p>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-white/80 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>

            {/* Nearby Hospitals */}
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-5.5 h-5.5 rounded-lg bg-green-50 flex items-center justify-center">
                  <span className="text-xs font-bold">👥</span>
                </div>
                <h4 className="text-[10px] font-bold text-gray-800 uppercase tracking-wider">Nearby Hospitals</h4>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs bg-gray-50/50 p-2 rounded-xl border border-gray-100/60">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                    <span className="font-semibold text-gray-700 truncate text-[11px]">City Hospital - Bhongir</span>
                  </div>
                  <a 
                    href="https://www.google.com/maps/search/?api=1&query=City+Hospital+Bhongir"
                    target="_blank"
                    rel="noreferrer"
                    className="bg-green-600 hover:bg-green-700 text-white text-[10px] py-1 px-3 rounded-lg shadow-sm font-bold transition-all shrink-0 cursor-pointer text-center"
                  >
                    View on Map
                  </a>
                </div>
                <div className="flex items-center justify-between text-xs bg-gray-50/50 p-2 rounded-xl border border-gray-100/60">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                    <span className="font-semibold text-gray-700 truncate text-[11px]">Apollo Clinic - Hyderabad</span>
                  </div>
                  <a 
                    href="https://www.google.com/maps/search/?api=1&query=Apollo+Clinic+Hyderabad"
                    target="_blank"
                    rel="noreferrer"
                    className="bg-green-600 hover:bg-green-700 text-white text-[10px] py-1 px-3 rounded-lg shadow-sm font-bold transition-all shrink-0 cursor-pointer text-center"
                  >
                    View on Map
                  </a>
                </div>
              </div>
            </div>

            {/* Pharmacy Emergency Contact */}
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-5.5 h-5.5 rounded-lg bg-green-50 flex items-center justify-center">
                  <span className="text-xs font-bold">📍</span>
                </div>
                <h4 className="text-[10px] font-bold text-gray-800 uppercase tracking-wider">Pharmacy Emergency Contact</h4>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <a 
                  href="tel:+919876543210"
                  className="bg-green-600 hover:bg-green-700 text-white rounded-xl py-2 px-2 flex items-center justify-center gap-1 shadow-sm text-[10px] font-bold transition-all cursor-pointer text-center"
                >
                  <Phone className="w-3 h-3" />
                  Call Medical Shop
                </a>
                <a 
                  href="https://wa.me/919876543210?text=I%2520need%252520emergency%2520medical%2520assistance"
                  target="_blank"
                  rel="noreferrer"
                  className="bg-green-600 hover:bg-green-700 text-white rounded-xl py-2 px-2 flex items-center justify-center gap-1 shadow-sm text-[10px] font-bold transition-all cursor-pointer text-center"
                >
                  <MessageSquare className="w-3 h-3" />
                  Chat on WhatsApp
                </a>
              </div>
            </div>

            {/* Emergency Tips */}
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-5.5 h-5.5 rounded-lg bg-green-50 flex items-center justify-center">
                  <span className="text-xs font-bold">➕</span>
                </div>
                <h4 className="text-[10px] font-bold text-gray-800 uppercase tracking-wider">Emergency Tips</h4>
              </div>
              <ul className="space-y-1 bg-gray-50/50 p-2.5 rounded-xl border border-gray-100/60">
                <li className="flex items-start gap-1.5 text-[11px] text-gray-600">
                  <span className="text-green-500 font-bold mt-0.5">✔</span>
                  <span>Keep first-aid kit ready</span>
                </li>
                <li className="flex items-start gap-1.5 text-[11px] text-gray-600">
                  <span className="text-green-500 font-bold mt-0.5">✔</span>
                  <span>Save emergency numbers</span>
                </li>
                <li className="flex items-start gap-1.5 text-[11px] text-gray-600">
                  <span className="text-green-500 font-bold mt-0.5">✔</span>
                  <span>Know nearest hospital routes</span>
                </li>
              </ul>
            </div>

          </div>
        </div>
      </section>

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
