import React, { useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { Activity, Shield, Users, ArrowRight } from 'lucide-react';

export default function PortalSelection() {
  const { user } = useContext(AppContext);
  const navigate = useNavigate();

  // Redirect if already logged in or query param role is customer
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('role') === 'customer') {
      navigate('/customer-login', { replace: true });
      return;
    }

    if (user) {
      if (user.role === 'owner') {
        navigate('/owner-dashboard');
      } else if (user.role === 'customer') {
        navigate('/customer-dashboard');
      }
    }
  }, [user, navigate]);

  return (
    <div className="onboarding-container items-center justify-center p-4">
      {/* Background elements */}
      <div className="absolute top-16 right-20 w-32 h-32 rounded-2xl opacity-10 animate-float"
           style={{ background: '#2E7D32', transform: 'rotate(12deg)' }} />
      <div className="absolute bottom-32 left-16 w-40 h-28 rounded-2xl opacity-10 animate-float"
           style={{ background: '#1B5E20', transform: 'rotate(6deg)', animationDelay: '1s' }} />

      <div className="w-full max-w-4xl z-10 flex flex-col items-center">
        {/* Header */}
        <div className="text-center mb-10 animate-scale-in">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg"
               style={{ background: 'linear-gradient(135deg, #2E7D32, #1B5E20)' }}>
            <Activity className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-2">
            Induja Medical Store
          </h1>
          <p className="text-dark-muted text-sm sm:text-base max-w-md mx-auto">
            Pharmacy Management & Digital Customer Experience Suite
          </p>
        </div>

        {/* Portal selection cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl animate-scale-in">
          {/* Card 1: Owner Portal */}
          <div className="onboarding-card hover:border-primary-500/40 hover:shadow-glow-green hover:scale-[1.02] transition-all duration-300 flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-green-950/40 border border-green-800/30 text-primary-400">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-dark-text group-hover:text-primary-300 transition-colors">
                  Owner Portal
                </h2>
                <p className="text-xs text-dark-muted mt-1">
                  For store administrators, managers, and authorized personnel.
                </p>
              </div>
              <ul className="space-y-2 text-xs text-dark-muted pt-2 border-t border-dark-border">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                  Real-time Inventory & Stock alerts
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                  Billing POS & Order management
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                  Vendor supply chain logs
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-50" />
                  Double-factor OTP verification
                </li>
              </ul>
            </div>
            <button
              onClick={() => navigate('/owner-login')}
              className="mt-8 w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer text-white shadow-md bg-gradient-to-r from-green-700 to-emerald-600 hover:from-green-600 hover:to-emerald-500"
            >
              Access Owner Administration <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Card 2: Customer Portal */}
          <div className="onboarding-card hover:border-blue-500/40 hover:shadow-glow-blue hover:scale-[1.02] transition-all duration-300 flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-950/40 border border-blue-800/30 text-blue-400">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-dark-text group-hover:text-blue-300 transition-colors">
                  Customer Portal
                </h2>
                <p className="text-xs text-dark-muted mt-1">
                  For store visitors, medical patients, and wellness buyers.
                </p>
              </div>
              <ul className="space-y-2 text-xs text-dark-muted pt-2 border-t border-dark-border">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  Browse medicines & check availability
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  Track purchase receipts & invoices
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  Instant consultation with AI Assistant
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-50" />
                  Fast Email/Password authentication
                </li>
              </ul>
            </div>
            <button
              onClick={() => navigate('/customer-login')}
              className="mt-8 w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer text-white shadow-md bg-gradient-to-r from-blue-700 to-sky-600 hover:from-blue-600 hover:to-sky-500"
            >
              Access Customer Suite <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-[10px] text-dark-muted mt-12 tracking-wide uppercase">
          Protected by Supabase Auth System &copy; {new Date().getFullYear()} Induja Inc.
        </p>
      </div>
    </div>
  );
}
