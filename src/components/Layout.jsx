import React, { useContext, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import {
  Activity, LayoutDashboard, Pill, ShoppingCart, Package, Truck,
  FileText, Bot, UserCircle, Bell, Sun, Moon, Menu, X, LogOut,
  ChevronDown, Check, AlertTriangle, Info, CheckCircle,
  Home, ShoppingBag, ClipboardList, Sparkles, Users
} from 'lucide-react';

export default function Layout({ children, currentTab, setCurrentTab }) {
  const navigate = useNavigate();
  const { user, logout, darkMode, toggleDarkMode, medicines, notifications, markNotificationRead, clearNotifications } = useContext(AppContext);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  const isOwner = user?.role === 'owner';
  const lowStockCount = medicines.filter(m => m.stock <= m.minStock).length;
  const unreadCount = notifications.filter(n => !n.read).length;

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setIsNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setIsProfileOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Owner navigation tabs
  const ownerTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'medicines', label: 'Medicines', icon: Pill, badge: lowStockCount > 0 ? `${lowStockCount} low` : null, badgeColor: 'bg-amber-500' },
    { id: 'sales', label: 'Billing', icon: ShoppingCart },
    { id: 'purchases', label: 'Purchases', icon: Package },
    { id: 'vendors', label: 'Vendors', icon: Truck },
    { id: 'transactions', label: 'Orders', icon: FileText },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'ai-assistant', label: 'AI Assistant', icon: Bot, badge: 'New', badgeColor: 'bg-accent-600' },
    { id: 'profile', label: 'Profile', icon: UserCircle },
  ];

  // Customer navigation tabs
  const customerTabs = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'shop', label: 'Shop Medicines', icon: ShoppingBag },
    { id: 'orders', label: 'My Orders', icon: ClipboardList },
    { id: 'ai-assistant', label: 'AI Assistant', icon: Bot, badge: 'New', badgeColor: 'bg-accent-600' },
    { id: 'profile', label: 'My Profile', icon: UserCircle },
  ];

  const tabs = isOwner ? ownerTabs : customerTabs;
  const userInitials = user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U';

  const handleTabClick = (tabId) => {
    setCurrentTab(tabId);
    setIsMobileMenuOpen(false);
  };

  const getNotifIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const formatTimeAgo = (timestamp) => {
    const diff = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* ============ TOP HEADER BAR (Dark Green) ============ */}
      <header className="apollo-header h-14 px-4 sm:px-6 flex items-center justify-between shrink-0 z-30 relative">
        {/* Left: Logo + Store Name */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-1.5 rounded-lg text-white/70 hover:bg-white/10"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/15 backdrop-blur-sm flex items-center justify-center p-1">
              <svg viewBox="0 0 400 400" className="w-6 h-6 text-white" fill="none">
                <g>
                  <g transform="translate(200, 140) rotate(0)">
                    <rect x="-45" y="-75" width="90" height="130" rx="45" ry="45" fill="none" stroke="currentColor" strokeWidth="16" strokeLinejoin="round"/>
                    <rect x="-33" y="-63" width="66" height="106" rx="33" ry="33" fill="none" stroke="currentColor" strokeWidth="6" strokeLinejoin="round" strokeOpacity="0.7"/>
                  </g>
                  <g transform="translate(260, 200) rotate(90)">
                    <rect x="-45" y="-75" width="90" height="130" rx="45" ry="45" fill="none" stroke="currentColor" strokeWidth="16" strokeLinejoin="round"/>
                    <rect x="-33" y="-63" width="66" height="106" rx="33" ry="33" fill="none" stroke="currentColor" strokeWidth="6" strokeLinejoin="round" strokeOpacity="0.7"/>
                  </g>
                  <g transform="translate(200, 260) rotate(180)">
                    <rect x="-45" y="-75" width="90" height="130" rx="45" ry="45" fill="none" stroke="currentColor" strokeWidth="16" strokeLinejoin="round"/>
                    <rect x="-33" y="-63" width="66" height="106" rx="33" ry="33" fill="none" stroke="currentColor" strokeWidth="6" strokeLinejoin="round" strokeOpacity="0.7"/>
                  </g>
                  <g transform="translate(140, 200) rotate(270)">
                    <rect x="-45" y="-75" width="90" height="130" rx="45" ry="45" fill="none" stroke="currentColor" strokeWidth="16" strokeLinejoin="round"/>
                    <rect x="-33" y="-63" width="66" height="106" rx="33" ry="33" fill="none" stroke="currentColor" strokeWidth="6" strokeLinejoin="round" strokeOpacity="0.7"/>
                  </g>
                  <path d="M 220 120 A 45 45 0 0 1 245 155" fill="none" stroke="currentColor" strokeWidth="16" strokeLinecap="round"/>
                  <path d="M 220 120 A 45 45 0 0 1 245 155" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeOpacity="0.7"/>
                  <path d="M 245 245 A 45 45 0 0 1 200 280" fill="none" stroke="currentColor" strokeWidth="16" strokeLinecap="round"/>
                  <path d="M 245 245 A 45 45 0 0 1 200 280" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeOpacity="0.7"/>
                  <path d="M 180 280 A 45 45 0 0 1 155 245" fill="none" stroke="currentColor" strokeWidth="16" strokeLinecap="round"/>
                  <path d="M 180 280 A 45 45 0 0 1 155 245" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeOpacity="0.7"/>
                  <path d="M 155 155 A 45 45 0 0 1 200 120" fill="none" stroke="currentColor" strokeWidth="16" strokeLinecap="round"/>
                  <path d="M 155 155 A 45 45 0 0 1 200 120" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeOpacity="0.7"/>
                </g>
              </svg>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-sm font-bold text-white leading-tight">Sai Chandrika Pharmacy</h1>
              <p className="text-[10px] text-white/60 font-medium leading-tight">
                {isOwner ? 'Owner Portal' : 'Customer Portal'}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Notification Bell */}
          <div ref={notifRef} className="relative">
            <button
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="relative p-2 rounded-lg text-white/70 hover:bg-white/10 transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-accent-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {isNotifOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-slide-down z-50">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                  <h4 className="text-sm font-bold text-gray-800">Notifications</h4>
                  <div className="flex items-center gap-2">
                    {notifications.length > 0 && (
                      <button onClick={clearNotifications} className="text-[10px] font-semibold text-red-500 hover:underline">
                        Clear All
                      </button>
                    )}
                  </div>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.slice(0, 8).map((n) => (
                      <div
                        key={n.id}
                        onClick={() => markNotificationRead(n.id)}
                        className={`px-4 py-3 border-b border-gray-50 flex items-start gap-3 cursor-pointer hover:bg-gray-50 transition-colors ${!n.read ? 'bg-primary-50/30' : ''}`}
                      >
                        <div className="mt-0.5 shrink-0">{getNotifIcon(n.type)}</div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-gray-700 leading-relaxed">{n.message}</p>
                          <p className="text-[10px] text-gray-400 mt-1">{formatTimeAgo(n.timestamp)}</p>
                        </div>
                        {!n.read && <div className="w-2 h-2 rounded-full bg-primary-500 mt-1.5 shrink-0" />}
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-gray-400">
                      <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-xs font-medium">No notifications yet</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg text-white/70 hover:bg-white/10 transition-colors"
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* Profile Avatar Dropdown */}
          <div ref={profileRef} className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-xl hover:bg-white/10 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold">
                {userInitials}
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-white/60 hidden sm:block" />
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-slide-down z-50">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-bold text-gray-800">{user?.name}</p>
                  <p className="text-xs text-gray-400">{user?.email}</p>
                  <span className={`inline-flex mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${isOwner ? 'bg-primary-50 text-primary-700' : 'bg-blue-50 text-blue-700'}`}>
                    {user?.role}
                  </span>
                </div>
                <div className="p-2">
                  <button
                    onClick={() => { handleTabClick('profile'); setIsProfileOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    <UserCircle className="w-4 h-4" />
                    <span>My Profile</span>
                  </button>
                  <button
                    onClick={() => { logout(); setIsProfileOpen(false); navigate('/'); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ============ SECONDARY NAV BAR (Horizontal Tabs — Desktop) ============ */}
      <nav className="hidden lg:block bg-white border-b border-gray-200 shrink-0 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-1 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className={`
                    relative flex items-center gap-2 px-4 py-3.5 text-sm font-medium whitespace-nowrap transition-colors
                    ${isActive
                      ? 'text-primary-700'
                      : 'text-gray-500 hover:text-gray-800'}
                  `}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-primary-600' : 'text-gray-400'}`} />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className={`${tab.badgeColor} text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full`}>
                      {tab.badge}
                    </span>
                  )}
                  {isActive && (
                    <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary-600 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* ============ MOBILE MENU OVERLAY ============ */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-2xl flex flex-col animate-slide-in-right">
            {/* Mobile Menu Header */}
            <div className="h-14 px-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center p-1">
                  <svg viewBox="0 0 400 400" className="w-6 h-6 text-white" fill="none">
                    <g>
                      <g transform="translate(200, 140) rotate(0)">
                        <rect x="-45" y="-75" width="90" height="130" rx="45" ry="45" fill="none" stroke="currentColor" strokeWidth="16" strokeLinejoin="round"/>
                        <rect x="-33" y="-63" width="66" height="106" rx="33" ry="33" fill="none" stroke="currentColor" strokeWidth="6" strokeLinejoin="round" strokeOpacity="0.7"/>
                      </g>
                      <g transform="translate(260, 200) rotate(90)">
                        <rect x="-45" y="-75" width="90" height="130" rx="45" ry="45" fill="none" stroke="currentColor" strokeWidth="16" strokeLinejoin="round"/>
                        <rect x="-33" y="-63" width="66" height="106" rx="33" ry="33" fill="none" stroke="currentColor" strokeWidth="6" strokeLinejoin="round" strokeOpacity="0.7"/>
                      </g>
                      <g transform="translate(200, 260) rotate(180)">
                        <rect x="-45" y="-75" width="90" height="130" rx="45" ry="45" fill="none" stroke="currentColor" strokeWidth="16" strokeLinejoin="round"/>
                        <rect x="-33" y="-63" width="66" height="106" rx="33" ry="33" fill="none" stroke="currentColor" strokeWidth="6" strokeLinejoin="round" strokeOpacity="0.7"/>
                      </g>
                      <g transform="translate(140, 200) rotate(270)">
                        <rect x="-45" y="-75" width="90" height="130" rx="45" ry="45" fill="none" stroke="currentColor" strokeWidth="16" strokeLinejoin="round"/>
                        <rect x="-33" y="-63" width="66" height="106" rx="33" ry="33" fill="none" stroke="currentColor" strokeWidth="6" strokeLinejoin="round" strokeOpacity="0.7"/>
                      </g>
                      <path d="M 220 120 A 45 45 0 0 1 245 155" fill="none" stroke="currentColor" strokeWidth="16" strokeLinecap="round"/>
                      <path d="M 220 120 A 45 45 0 0 1 245 155" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeOpacity="0.7"/>
                      <path d="M 245 245 A 45 45 0 0 1 200 280" fill="none" stroke="currentColor" strokeWidth="16" strokeLinecap="round"/>
                      <path d="M 245 245 A 45 45 0 0 1 200 280" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeOpacity="0.7"/>
                      <path d="M 180 280 A 45 45 0 0 1 155 245" fill="none" stroke="currentColor" strokeWidth="16" strokeLinecap="round"/>
                      <path d="M 180 280 A 45 45 0 0 1 155 245" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeOpacity="0.7"/>
                      <path d="M 155 155 A 45 45 0 0 1 200 120" fill="none" stroke="currentColor" strokeWidth="16" strokeLinecap="round"/>
                      <path d="M 155 155 A 45 45 0 0 1 200 120" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeOpacity="0.7"/>
                    </g>
                  </svg>
                </div>
                <span className="text-sm font-bold text-gray-800">Sai Chandrika Pharmacy</span>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-1 rounded-lg text-gray-400 hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Menu User Card */}
            <div className="px-4 py-4 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold text-sm">
                  {userInitials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{user?.name}</p>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${isOwner ? 'bg-primary-50 text-primary-700' : 'bg-blue-50 text-blue-700'}`}>
                    {isOwner ? 'Owner' : 'Customer'}
                  </span>
                </div>
              </div>
            </div>

            {/* Mobile Menu Tabs */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = currentTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab.id)}
                    className={`sidebar-link ${isActive ? 'sidebar-link-active' : 'sidebar-link-inactive'}`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-primary-600' : 'text-gray-400'}`} />
                    <span>{tab.label}</span>
                    {tab.badge && (
                      <span className={`ml-auto ${tab.badgeColor} text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full`}>
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Mobile Menu Footer */}
            <div className="p-3 border-t border-gray-100">
              <button
                onClick={() => { logout(); navigate('/'); }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============ MAIN CONTENT AREA ============ */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          {children}
        </div>
      </main>
    </div>
  );
}
