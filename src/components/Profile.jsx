import React, { useContext, useMemo, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { getTwilioConfig, saveTwilioConfig, clearTwilioConfig } from '../services/twilioService';
import {
  User,
  Mail,
  Phone,
  Briefcase,
  Building2,
  ShieldCheck,
  Calendar,
  Edit3,
  TrendingUp,
  IndianRupee,
  Pill,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  Send,
  Sparkles,
  Award,
  Settings,
  Key,
  Smartphone,
  ToggleLeft,
  ToggleRight,
  CheckCircle,
  XCircle,
  Zap,
} from 'lucide-react';

export default function Profile() {
  const { user, sales, medicines, smsLogs, addNotification, sendSms, twilioConfig, updateTwilioConfig } = useContext(AppContext);
  const isOwner = user?.role === 'owner';

  // Twilio config state
  const [twilioForm, setTwilioForm] = useState(() => getTwilioConfig());
  const [twilioSaved, setTwilioSaved] = useState(false);
  const [twilioTestStatus, setTwilioTestStatus] = useState('');


  // ---- Activity Calculations ----
  const totalSalesMade = sales.length;
  const totalRevenueGenerated = useMemo(
    () => sales.reduce((sum, s) => sum + s.total, 0),
    [sales]
  );
  const medicinesManaged = medicines.length;

  const formatCurrency = (val) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(val);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const getInitials = (name) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleEditProfile = () => {
    addNotification('Profile edit feature is coming soon! Stay tuned.', 'info');
  };

  // ---- Profile Info Fields ----
  const profileFields = [
    { label: 'Email', value: user?.email, icon: Mail, color: 'text-blue-500' },
    { label: 'Phone', value: user?.phone || 'Not set', icon: Phone, color: 'text-green-500' },
    { label: 'Role', value: user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'N/A', icon: Briefcase, color: 'text-purple-500' },
    { label: 'Shop Name', value: user?.shopName, icon: Building2, color: 'text-teal-500' },
    { label: 'License ID', value: user?.license, icon: ShieldCheck, color: 'text-orange-500' },
    { label: 'Member Since', value: formatDate(user?.createdAt), icon: Calendar, color: 'text-indigo-500' },
  ];

  // ---- Activity Summary Cards ----
  const activityCards = [
    {
      label: 'Total Sales Made',
      value: totalSalesMade,
      icon: TrendingUp,
      iconBg: 'bg-emerald-100 dark:bg-emerald-950/40',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      desc: 'Completed transactions',
    },
    {
      label: 'Revenue Generated',
      value: formatCurrency(totalRevenueGenerated),
      icon: IndianRupee,
      iconBg: 'bg-green-100 dark:bg-green-950/40',
      iconColor: 'text-green-600 dark:text-green-400',
      desc: 'Total earnings',
    },
    {
      label: 'Medicines Managed',
      value: medicinesManaged,
      icon: Pill,
      iconBg: 'bg-teal-100 dark:bg-teal-950/40',
      iconColor: 'text-teal-600 dark:text-teal-400',
      desc: 'Active inventory items',
    },
  ];

  const recentSmsLogs = smsLogs.slice(0, 8);

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      {/* =============================================
          PROFILE HEADER CARD
          ============================================= */}
      <div className="card overflow-hidden">
        {/* Green gradient banner */}
        <div className="hero-banner h-32 md:h-36 relative">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-4 right-16 w-24 h-24 rounded-full bg-white/5 animate-pulse" />
            <div className="absolute bottom-2 right-40 w-10 h-10 rounded-full bg-white/5 animate-pulse delay-500" />
            <div className="absolute top-6 left-1/3 w-14 h-14 rounded-full bg-white/5 animate-pulse delay-300" />
          </div>
          {/* Badge */}
          <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full">
            <Award className="w-3.5 h-3.5 text-yellow-300" />
            <span className="text-[10px] font-bold text-white uppercase tracking-wider">
              {user?.role === 'owner' ? 'Shop Owner' : 'Staff Member'}
            </span>
          </div>
        </div>

        {/* Avatar + Name */}
        <div className="px-6 md:px-8 pb-6 relative">
          {/* Avatar circle overlapping banner */}
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12 sm:-mt-14">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-4 border-white dark:border-dark-card shadow-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 50%, #388E3C 100%)',
              }}
            >
              <span className="text-3xl sm:text-4xl font-extrabold text-white">
                {getInitials(user?.name)}
              </span>
            </div>

            <div className="flex-1 min-w-0 pb-1">
              <h1 className="text-xl sm:text-2xl font-extrabold text-gray-800 dark:text-white">
                {user?.name || 'User'}
              </h1>
              <p className="text-sm text-gray-400 mt-0.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                {user?.shopName || 'Sai Chandrika Pharmacy'}
              </p>
            </div>

            <button
              onClick={handleEditProfile}
              className="btn-primary self-start sm:self-end flex-shrink-0"
            >
              <Edit3 className="w-4 h-4" />
              Edit Profile
            </button>
          </div>

          {/* Profile Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
            {profileFields.map((field) => {
              const FieldIcon = field.icon;
              return (
                <div
                  key={field.label}
                  className="flex items-center gap-3 p-3.5 rounded-xl bg-gray-50/70 dark:bg-dark-surface/50 border border-gray-100 dark:border-dark-border"
                >
                  <div className="w-9 h-9 rounded-lg bg-white dark:bg-dark-card flex items-center justify-center shadow-sm flex-shrink-0">
                    <FieldIcon className={`w-4 h-4 ${field.color}`} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block">
                      {field.label}
                    </span>
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 truncate block">
                      {field.value || 'N/A'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* =============================================
          ACTIVITY SUMMARY CARDS
          ============================================= */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          <h2 className="text-lg font-bold text-gray-800 dark:text-white">
            Activity Summary
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {activityCards.map((card) => {
            const CardIcon = card.icon;
            return (
              <div
                key={card.label}
                className="card-kpi hover:scale-[1.02] transition-all duration-300"
              >
                <div className={`w-11 h-11 rounded-xl ${card.iconBg} flex items-center justify-center mb-3`}>
                  <CardIcon className={`w-5 h-5 ${card.iconColor}`} />
                </div>
                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                  {card.label}
                </span>
                <h3 className="text-2xl font-extrabold text-gray-800 dark:text-white mt-1 tracking-tight">
                  {card.value}
                </h3>
                <p className="text-[11px] text-gray-400 mt-1">
                  {card.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* =============================================
          SMS LOG SECTION
          ============================================= */}
      <div className="card p-0 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-dark-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-800 dark:text-white">
                SMS Log
              </h3>
              <p className="text-[10px] text-gray-400">
                Recent sent messages & notifications
              </p>
            </div>
          </div>
          {smsLogs.length > 0 && (
            <span className="badge-info">
              {smsLogs.length} sent
            </span>
          )}
        </div>

        <div className="divide-y divide-gray-50 dark:divide-dark-border overflow-y-auto max-h-[400px]">
          {recentSmsLogs.length > 0 ? (
            recentSmsLogs.map((sms) => (
              <div
                key={sms.id}
                className="flex items-start gap-3 px-6 py-4 hover:bg-gray-50/50 dark:hover:bg-dark-surface/30 transition-colors"
              >
                {/* Status Icon */}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  sms.type === 'success'
                    ? 'bg-green-100 dark:bg-green-950/30'
                    : sms.type === 'warning'
                    ? 'bg-amber-100 dark:bg-amber-950/30'
                    : 'bg-blue-100 dark:bg-blue-950/30'
                }`}>
                  {sms.status === 'delivered' ? (
                    <CheckCircle2 className={`w-4 h-4 ${
                      sms.type === 'success'
                        ? 'text-green-500'
                        : sms.type === 'warning'
                        ? 'text-amber-500'
                        : 'text-blue-500'
                    }`} />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  )}
                </div>

                {/* Message Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="flex items-center gap-1 text-[10px] font-bold text-gray-400 dark:text-gray-500">
                      <Send className="w-3 h-3" />
                      To: {sms.to}
                    </span>
                    <span className={`${
                      sms.type === 'success'
                        ? 'badge-success'
                        : sms.type === 'warning'
                        ? 'badge-warning'
                        : 'badge-info'
                    }`}>
                      {sms.type}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-2">
                    {sms.message}
                  </p>
                  <span className="flex items-center gap-1 text-[10px] text-gray-400 mt-1.5">
                    <Clock className="w-3 h-3" />
                    {new Date(sms.timestamp).toLocaleString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-14 text-gray-400">
              <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-dark-surface flex items-center justify-center mb-3">
                <MessageSquare className="w-6 h-6 text-gray-300 dark:text-gray-600" />
              </div>
              <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                No Messages Yet
              </p>
              <p className="text-xs text-gray-400 mt-1 max-w-xs text-center">
                SMS notifications will appear here when you complete sales, send reminders, or trigger stock alerts.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ===== TWILIO SMS SETTINGS (Owner Only) ===== */}
      {isOwner && (
        <div className="card overflow-hidden animate-slide-up">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary-600" />
              SMS Notifications (Twilio Setup)
            </h3>
            <div className="flex items-center gap-2">
              {twilioForm.enabled ? (
                <span className="badge badge-success flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Active</span>
              ) : (
                <span className="badge badge-neutral">Disabled</span>
              )}
            </div>
          </div>
          <div className="p-6 space-y-5">
            {/* Info Banner */}
            <div className="alert-info">
              <Zap className="w-5 h-5 text-blue-600 shrink-0" />
              <div>
                <p className="text-sm font-semibold">Twilio SMS Integration</p>
                <p className="text-xs mt-0.5">
                  Connect your Twilio account to send real SMS alerts for low stock (to owner) and payment confirmations (to customers).
                  Get your credentials at <a href="https://console.twilio.com" target="_blank" rel="noopener noreferrer" className="underline font-semibold">console.twilio.com</a>
                </p>
              </div>
            </div>

            {/* Enable Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="text-sm font-semibold text-gray-700">Enable SMS Notifications</p>
                <p className="text-xs text-gray-400">When disabled, SMS notifications will be simulated locally</p>
              </div>
              <button
                onClick={() => setTwilioForm(prev => ({ ...prev, enabled: !prev.enabled }))}
                className="text-3xl transition-colors"
              >
                {twilioForm.enabled
                  ? <ToggleRight className="w-10 h-10 text-primary-600" />
                  : <ToggleLeft className="w-10 h-10 text-gray-300" />
                }
              </button>
            </div>

            {/* Credentials Form */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="input-label flex items-center gap-1"><Key className="w-3 h-3" /> Account SID</label>
                <input
                  type="text"
                  className="input font-mono text-xs"
                  placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  value={twilioForm.accountSid}
                  onChange={e => setTwilioForm(prev => ({ ...prev, accountSid: e.target.value }))}
                />
              </div>
              <div>
                <label className="input-label flex items-center gap-1"><Key className="w-3 h-3" /> Auth Token</label>
                <input
                  type="password"
                  className="input font-mono text-xs"
                  placeholder="••••••••••••••••••••••••••••••••"
                  value={twilioForm.authToken}
                  onChange={e => setTwilioForm(prev => ({ ...prev, authToken: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className="input-label flex items-center gap-1"><Smartphone className="w-3 h-3" /> Twilio Phone Number (From)</label>
              <input
                type="text"
                className="input font-mono text-xs"
                placeholder="+1XXXXXXXXXX"
                value={twilioForm.fromNumber}
                onChange={e => setTwilioForm(prev => ({ ...prev, fromNumber: e.target.value }))}
              />
              <p className="text-[10px] text-gray-400 mt-1">Your Twilio phone number in E.164 format (e.g., +14155552671)</p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => {
                  saveTwilioConfig(twilioForm);
                  updateTwilioConfig(twilioForm);
                  setTwilioSaved(true);
                  addNotification('✅ Twilio SMS settings saved successfully!', 'success');
                  setTimeout(() => setTwilioSaved(false), 3000);
                }}
                className="btn-primary"
              >
                <CheckCircle className="w-4 h-4" />
                {twilioSaved ? 'Saved ✓' : 'Save Settings'}
              </button>
              <button
                onClick={async () => {
                  setTwilioTestStatus('sending');
                  const result = await sendSms(
                    user?.phone || '+91 98765 43210',
                    '🧪 Test SMS from Sai Chandrika Pharmacy. Your Twilio integration is working correctly!',
                    'info'
                  );
                  setTwilioTestStatus(result.method === 'twilio' ? 'success' : 'simulated');
                  setTimeout(() => setTwilioTestStatus(''), 5000);
                }}
                disabled={twilioTestStatus === 'sending'}
                className="btn-accent"
              >
                <Send className="w-4 h-4" />
                {twilioTestStatus === 'sending' ? 'Sending...' :
                 twilioTestStatus === 'success' ? 'Sent via Twilio! ✓' :
                 twilioTestStatus === 'simulated' ? 'Simulated (check logs)' :
                 'Send Test SMS'}
              </button>
              <button
                onClick={() => {
                  clearTwilioConfig();
                  setTwilioForm({ accountSid: '', authToken: '', fromNumber: '', enabled: false });
                  updateTwilioConfig({ accountSid: '', authToken: '', fromNumber: '', enabled: false });
                  addNotification('🗑️ Twilio settings cleared.', 'info');
                }}
                className="btn-outline text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
              >
                <XCircle className="w-4 h-4" />
                Clear Settings
              </button>
            </div>

            {/* SMS Triggers Info */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">SMS will be sent for:</p>
              <ul className="space-y-1.5 text-xs text-gray-600">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  <strong>Low Stock Alert</strong> → SMS to owner when medicine stock falls below minimum
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                  <strong>Payment Success</strong> → SMS to customer after successful payment with invoice details
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                  <strong>Vendor Reminder</strong> → SMS to vendor for outstanding due payments
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
