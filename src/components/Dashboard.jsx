import React, { useContext, useMemo, useState } from 'react';
import { AppContext } from '../context/AppContext';
import {
  Pill, TrendingUp, AlertTriangle, Truck, ShoppingBag,
  Sparkles, ArrowRight, ArrowUpRight, ArrowDownRight,
  IndianRupee, Package, Clock, CheckCircle, XCircle, BarChart3,
  Calendar, FileText, UserPlus, ShieldCheck, MapPin, Settings, Check, UserCheck
} from 'lucide-react';
import { supabase } from '../lib/supabase';

const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);
const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

export default function Dashboard({ setCurrentTab }) {
  const { 
    medicines, vendors, sales, purchases,
    doctors, setDoctors, appointments, updateAppointmentStatus,
    deliveryStaff, setDeliveryStaff, deliveryOrders, assignDeliveryExecutive, updateDeliveryStatus,
    deliverySettings, updateDeliverySettings
  } = useContext(AppContext);

  const [adminSubTab, setAdminSubTab] = useState('overview'); // 'overview' | 'appointments' | 'deliveries' | 'staff' | 'doctors' | 'settings'

  // Search & Filters inside Admin Appointments
  const [aptSearch, setAptSearch] = useState('');
  const [aptDoctorFilter, setAptDoctorFilter] = useState('');
  const [aptDateFilter, setAptDateFilter] = useState('');

  // Search & Filters inside Admin Deliveries
  const [delStatusFilter, setDelStatusFilter] = useState('');

  // Doctor CRUD states
  const [showDocForm, setShowDocForm] = useState(false);
  const [docName, setDocName] = useState('');
  const [docEmail, setDocEmail] = useState('');
  const [docQual, setDocQual] = useState('');
  const [docSpec, setDocSpec] = useState('');
  const [docExp, setDocExp] = useState(1);
  const [docFee, setDocFee] = useState(250);
  const [docDays, setDocDays] = useState('Monday,Wednesday,Friday');
  const [docSlots, setDocSlots] = useState('10:00 AM,11:00 AM,12:00 PM,02:00 PM,03:00 PM,04:00 PM');
  const [docAbout, setDocAbout] = useState('');

  // Staff CRUD states
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPhone, setStaffPhone] = useState('');
  const [staffVehicle, setStaffVehicle] = useState('');

  // Delivery Settings Form states
  const [radiusKm, setRadiusKm] = useState(deliverySettings?.radius_km || 10);
  const [deliveryChargeVal, setDeliveryChargeVal] = useState(deliverySettings?.charge || 40);
  const [minOrderVal, setMinOrderVal] = useState(deliverySettings?.min_order_amount || 150);
  const [freeDelVal, setFreeDelVal] = useState(deliverySettings?.free_delivery_above || 500);
  const [pincodesVal, setPincodesVal] = useState(deliverySettings?.serviceable_pincodes || '508116,500001,500002');

  const stats = useMemo(() => {
    const today = new Date().toDateString();
    const todaySales = sales.filter(s => new Date(s.date).toDateString() === today);
    const totalRevenue = sales.reduce((s, t) => s + t.total, 0);
    const todayRevenue = todaySales.reduce((s, t) => s + t.total, 0);
    const totalPurchaseCost = purchases.reduce((s, p) => s + p.total, 0);
    const lowStock = medicines.filter(m => m.stock <= m.minStock);

    const activeDelivs = deliveryOrders.filter(d => !['Delivered', 'Cancelled'].includes(d.status)).length;
    const pendingAppts = appointments.filter(a => a.status === 'Pending').length;

    return {
      totalMedicines: medicines.length,
      todayRevenue,
      totalRevenue,
      totalPurchaseCost,
      lowStockCount: lowStock.length,
      activeDeliveries: activeDelivs,
      pendingAppointments: pendingAppts,
      vendorCount: vendors.length,
      totalPurchases: totalPurchaseCost,
      totalSalesCount: sales.length,
      todaySalesCount: todaySales.length,
    };
  }, [medicines, vendors, sales, purchases, appointments, deliveryOrders]);

  // Handle Add Doctor
  const handleAddDoctor = async (e) => {
    e.preventDefault();
    if (!docName || !docEmail || !docSpec || !docQual) {
      alert("Please fill required fields.");
      return;
    }
    const newDoc = {
      name: docName,
      email: docEmail,
      qualification: docQual,
      specialization: docSpec,
      experience: parseInt(docExp),
      consultation_fee: parseFloat(docFee),
      available_days: docDays,
      available_slots: docSlots,
      about: docAbout,
      profile_picture: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=256&auto=format&fit=crop'
    };

    const { data, error } = await supabase.from('doctors').insert(newDoc).select().single();
    if (error) {
      alert(`Error: ${error.message}`);
    } else {
      setDoctors(prev => [...prev, data]);
      setShowDocForm(false);
      setDocName('');
      setDocEmail('');
      setDocQual('');
      setDocSpec('');
      setDocAbout('');
      alert("🎉 Doctor registered successfully!");
    }
  };

  // Handle Add Delivery Staff
  const handleAddStaff = async (e) => {
    e.preventDefault();
    if (!staffName || !staffEmail || !staffPhone || !staffVehicle) {
      alert("Please fill all fields.");
      return;
    }
    const newStaff = {
      name: staffName,
      email: staffEmail,
      phone: staffPhone,
      vehicle: staffVehicle,
      status: 'Active',
      photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=256&auto=format&fit=crop'
    };

    const { data, error } = await supabase.from('delivery_staff').insert(newStaff).select().single();
    if (error) {
      alert(`Error: ${error.message}`);
    } else {
      setDeliveryStaff(prev => [...prev, data]);
      setShowStaffForm(false);
      setStaffName('');
      setStaffEmail('');
      setStaffPhone('');
      setStaffVehicle('');
      alert("🎉 Delivery Executive added!");
    }
  };

  // Handle Update Delivery Settings
  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    const res = await updateDeliverySettings({
      radius_km: parseFloat(radiusKm),
      charge: parseFloat(deliveryChargeVal),
      min_order_amount: parseFloat(minOrderVal),
      free_delivery_above: parseFloat(freeDelVal),
      serviceable_pincodes: pincodesVal
    });
    if (res.success) {
      alert("✅ Delivery settings updated successfully!");
    }
  };

  // Filtered Appointments list
  const filteredAppointments = useMemo(() => {
    return appointments.filter(apt => {
      const matchSearch = apt.patient_name.toLowerCase().includes(aptSearch.toLowerCase()) || apt.id.toLowerCase().includes(aptSearch.toLowerCase());
      const matchDoctor = aptDoctorFilter ? apt.doctor_id === aptDoctorFilter : true;
      const matchDate = aptDateFilter ? apt.appointment_date === aptDateFilter : true;
      return matchSearch && matchDoctor && matchDate;
    });
  }, [appointments, aptSearch, aptDoctorFilter, aptDateFilter]);

  // Filtered Deliveries list
  const filteredDeliveries = useMemo(() => {
    return deliveryOrders.filter(del => {
      return delStatusFilter ? del.status === delStatusFilter : true;
    });
  }, [deliveryOrders, delStatusFilter]);

  return (
    <div className="space-y-6">
      {/* Top Header tab switcher */}
      <div className="flex overflow-x-auto gap-2 border-b border-gray-100 pb-3 scrollbar-none">
        {[
          { id: 'overview', label: 'Dashboard Overview', icon: BarChart3 },
          { id: 'appointments', label: 'Clinic Appointments', icon: Calendar, badge: stats.pendingAppointments },
          { id: 'deliveries', label: 'Medicine Deliveries', icon: Truck, badge: stats.activeDeliveries },
          { id: 'staff', label: 'Delivery Staff', icon: UserCheck },
          { id: 'doctors', label: 'Specialist Doctors', icon: Stethoscope },
          { id: 'settings', label: 'Delivery Settings', icon: Settings }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setAdminSubTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
              adminSubTab === tab.id ? 'bg-primary-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
            {tab.badge && tab.badge > 0 ? (
              <span className="w-4.5 h-4.5 rounded-full bg-accent-600 text-white text-[9px] font-bold flex items-center justify-center">
                {tab.badge}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {/* ==================== SUB-TAB: OVERVIEW ==================== */}
      {adminSubTab === 'overview' && (
        <>
          {/* KPI Widget Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Today Revenue', value: formatCurrency(stats.todayRevenue), icon: IndianRupee, color: 'text-green-600', bg: 'bg-green-50' },
              { label: 'Total Revenue', value: formatCurrency(stats.totalRevenue), icon: TrendingUp, color: 'text-teal-600', bg: 'bg-teal-50' },
              { label: 'Pending Bookings', value: stats.pendingAppointments, icon: Calendar, color: 'text-amber-600', bg: 'bg-amber-50' },
              { label: 'Active Deliveries', value: stats.activeDeliveries, icon: Truck, color: 'text-blue-600', bg: 'bg-blue-50' }
            ].map((kpi, idx) => (
              <div key={idx} className="card p-5 border border-gray-100 flex items-center gap-4 hover:shadow-sm transition-all">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${kpi.bg} ${kpi.color}`}>
                  <kpi.icon className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs text-gray-400 font-bold block uppercase tracking-wider">{kpi.label}</span>
                  <span className="text-lg font-black text-gray-800 mt-1 block">{kpi.value}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Analytics & Stats info */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="card p-5 border border-gray-100 lg:col-span-2">
              <h4 className="text-sm font-extrabold text-gray-800 uppercase tracking-wider mb-4">Stock Alerts & Statistics</h4>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                  <Pill className="w-6 h-6 mx-auto mb-2 text-teal-600" />
                  <p className="text-2xl font-black text-gray-800">{stats.totalMedicines}</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">Total Medicines</p>
                </div>
                <div className="bg-red-50/20 p-4 rounded-2xl border border-red-100/50">
                  <AlertTriangle className="w-6 h-6 mx-auto mb-2 text-red-600" />
                  <p className="text-2xl font-black text-red-600">{stats.lowStockCount}</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">Low Stock Items</p>
                </div>
                <div className="bg-blue-50/20 p-4 rounded-2xl border border-blue-100/50">
                  <ShoppingBag className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                  <p className="text-2xl font-black text-gray-800">{stats.totalSalesCount}</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">Total Sales Count</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ==================== SUB-TAB: CLINIC APPOINTMENTS ==================== */}
      {adminSubTab === 'appointments' && (
        <div className="card p-5 border border-gray-100 space-y-4">
          <div className="flex flex-col md:flex-row justify-between gap-3 pb-3 border-b border-gray-100">
            <h3 className="text-sm font-extrabold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-4.5 h-4.5 text-primary-600" /> Manage Appointments
            </h3>
            
            {/* Search & Filters */}
            <div className="flex flex-wrap gap-2 text-xs">
              <input
                type="text"
                placeholder="Search patient / APT ID..."
                value={aptSearch}
                onChange={(e) => setAptSearch(e.target.value)}
                className="input py-1 px-3 w-40 rounded-xl"
              />
              
              <select
                value={aptDoctorFilter}
                onChange={(e) => setAptDoctorFilter(e.target.value)}
                className="input py-1 px-3 rounded-xl bg-white"
              >
                <option value="">All Doctors</option>
                {doctors.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>

              <input
                type="date"
                value={aptDateFilter}
                onChange={(e) => setAptDateFilter(e.target.value)}
                className="input py-1 px-3 rounded-xl"
              />
            </div>
          </div>

          {/* Appointments Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAppointments.map(apt => {
              const doc = doctors.find(d => d.id === apt.doctor_id);
              return (
                <div key={apt.id} className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-mono font-bold text-primary-600">{apt.id}</span>
                      <span className={`badge ${
                        apt.status === 'Pending' ? 'badge-warning' :
                        apt.status === 'Approved' ? 'badge-info' :
                        apt.status === 'Completed' ? 'badge-success' : 'badge-danger'
                      }`}>
                        {apt.status}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-gray-800">{apt.patient_name}</h4>
                    <p className="text-xs text-gray-500">{apt.patient_age} Yrs • {apt.patient_gender} • {apt.patient_phone}</p>
                    <p className="text-xs text-gray-600 mt-2"><span className="font-semibold text-gray-700">Doctor:</span> {doc ? doc.name : 'Unknown Specialist'}</p>
                    <p className="text-xs text-gray-600"><span className="font-semibold text-gray-700">Time:</span> {apt.appointment_date} at {apt.appointment_slot}</p>
                    {apt.reason && <p className="text-[11px] text-gray-400 mt-1 italic">Reason: "{apt.reason}"</p>}
                  </div>

                  {/* Actions */}
                  {apt.status === 'Pending' && (
                    <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                      <button
                        onClick={() => updateAppointmentStatus(apt.id, 'Approved')}
                        className="flex-1 btn-primary btn-sm justify-center text-xs py-1.5"
                      >
                        Approve Booking
                      </button>
                      <button
                        onClick={() => updateAppointmentStatus(apt.id, 'Rejected')}
                        className="flex-1 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
            {filteredAppointments.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-6 col-span-2">No matching appointments found.</p>
            )}
          </div>
        </div>
      )}

      {/* ==================== SUB-TAB: MEDICINE DELIVERIES ==================== */}
      {adminSubTab === 'deliveries' && (
        <div className="card p-5 border border-gray-100 space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-gray-100">
            <h3 className="text-sm font-extrabold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
              <Truck className="w-4.5 h-4.5 text-primary-600" /> Active Deliveries Queue
            </h3>
            
            <select
              value={delStatusFilter}
              onChange={(e) => setDelStatusFilter(e.target.value)}
              className="input text-xs py-1 px-3 rounded-xl bg-white"
            >
              <option value="">All Statuses</option>
              <option value="Order Placed">Order Placed</option>
              <option value="Accepted">Accepted</option>
              <option value="Preparing">Preparing</option>
              <option value="Packed">Packed</option>
              <option value="Out for Delivery">Out for Delivery</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredDeliveries.map(del => {
              const sale = sales.find(s => s.id === del.id);
              const assignedRider = deliveryStaff.find(s => s.id === del.delivery_executive_id);
              return (
                <div key={del.id} className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-mono font-bold text-gray-600">{del.id}</span>
                      <span className="badge badge-success text-[10px]">{del.status}</span>
                    </div>

                    <h4 className="text-sm font-bold text-gray-800 mt-2">{sale ? sale.customerName : 'Walk-in Patient'}</h4>
                    <p className="text-xs text-gray-500">Total payable: {formatCurrency(sale ? sale.total : 0)}</p>
                    <p className="text-xs text-gray-600 mt-2"><span className="font-semibold text-gray-700">Rider Assigned:</span> {assignedRider ? `${assignedRider.name} (${assignedRider.phone})` : 'Awaiting assignment'}</p>
                  </div>

                  {/* Rider Assignment Dropdown Form */}
                  <div className="pt-3 border-t border-gray-100 flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Assign Executive Rider</label>
                    <div className="flex gap-2">
                      <select
                        onChange={(e) => {
                          if (e.target.value) assignDeliveryExecutive(del.id, e.target.value);
                        }}
                        value={del.delivery_executive_id || ''}
                        className="input text-xs py-1.5 bg-white flex-1"
                      >
                        <option value="">-- Choose Rider --</option>
                        {deliveryStaff.map(staff => (
                          <option key={staff.id} value={staff.id}>{staff.name} ({staff.vehicle.split(' ')[0]})</option>
                        ))}
                      </select>
                    </div>

                    {/* Timeline status update quick bar */}
                    {['Accepted', 'Preparing', 'Packed', 'Cancelled'].includes(del.status) && (
                      <div className="flex gap-1.5 mt-2">
                        {['Preparing', 'Packed'].map(st => (
                          <button
                            key={st}
                            onClick={() => updateDeliveryStatus(del.id, st)}
                            className="flex-1 text-[10px] py-1 border border-gray-200 text-gray-600 rounded-lg hover:bg-primary-50 hover:text-primary-600 font-bold transition-all cursor-pointer"
                          >
                            Set {st}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {filteredDeliveries.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-6 col-span-2">No active delivery orders.</p>
            )}
          </div>
        </div>
      )}

      {/* ==================== SUB-TAB: DELIVERY STAFF ==================== */}
      {adminSubTab === 'staff' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-extrabold text-gray-800 uppercase tracking-wider">Delivery Executive Fleet</h3>
            <button
              onClick={() => setShowStaffForm(!showStaffForm)}
              className="btn-primary btn-sm flex items-center gap-1.5 cursor-pointer rounded-xl"
            >
              <UserPlus className="w-4 h-4" /> Add Rider
            </button>
          </div>

          {/* Add Staff form inline */}
          {showStaffForm && (
            <form onSubmit={handleAddStaff} className="card p-5 border border-gray-200/60 max-w-md space-y-3 animate-scale-in">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Register Delivery Exec</h4>
              <input
                type="text"
                placeholder="Rider Full Name*"
                value={staffName}
                onChange={(e) => setStaffName(e.target.value)}
                className="input text-xs w-full"
                required
              />
              <input
                type="email"
                placeholder="Email Address*"
                value={staffEmail}
                onChange={(e) => setStaffEmail(e.target.value)}
                className="input text-xs w-full"
                required
              />
              <input
                type="text"
                placeholder="Phone Number*"
                value={staffPhone}
                onChange={(e) => setStaffPhone(e.target.value)}
                className="input text-xs w-full"
                required
              />
              <input
                type="text"
                placeholder="Vehicle Info e.g. Splendor (TS-08-GH-1234)*"
                value={staffVehicle}
                onChange={(e) => setStaffVehicle(e.target.value)}
                className="input text-xs w-full"
                required
              />
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 btn-primary justify-center py-2 text-xs">Save Rider</button>
                <button type="button" onClick={() => setShowStaffForm(false)} className="flex-1 btn-outline justify-center py-2 text-xs text-gray-500 rounded-xl">Cancel</button>
              </div>
            </form>
          )}

          {/* Riders Cards listing */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {deliveryStaff.map(staff => (
              <div key={staff.id} className="card p-4 border border-gray-100 flex items-center gap-4">
                <img src={staff.photo || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=256&auto=format&fit=crop'} alt={staff.name} className="w-12 h-12 rounded-full object-cover border border-gray-100 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-gray-800">{staff.name}</h4>
                  <p className="text-xs text-gray-500 mt-0.5">📞 {staff.phone}</p>
                  <p className="text-[10px] text-gray-400 mt-1">Vehicle: {staff.vehicle}</p>
                  <span className={`inline-block mt-2 text-[9px] font-bold px-2 py-0.5 rounded-lg ${staff.status === 'Active' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                    {staff.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================== SUB-TAB: CLINIC DOCTORS ==================== */}
      {adminSubTab === 'doctors' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-extrabold text-gray-800 uppercase tracking-wider">Registered Specialist Doctors</h3>
            <button
              onClick={() => setShowDocForm(!showDocForm)}
              className="btn-primary btn-sm flex items-center gap-1.5 cursor-pointer rounded-xl"
            >
              <UserPlus className="w-4 h-4" /> Add Doctor
            </button>
          </div>

          {/* Add Doctor form inline */}
          {showDocForm && (
            <form onSubmit={handleAddDoctor} className="card p-5 border border-gray-200/60 max-w-lg space-y-3 animate-scale-in">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Register Specialist</h4>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Doctor Name*"
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  className="input text-xs w-full"
                  required
                />
                <input
                  type="email"
                  placeholder="Email Address*"
                  value={docEmail}
                  onChange={(e) => setDocEmail(e.target.value)}
                  className="input text-xs w-full"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Specialization e.g. Pedatrician*"
                  value={docSpec}
                  onChange={(e) => setDocSpec(e.target.value)}
                  className="input text-xs w-full"
                  required
                />
                <input
                  type="text"
                  placeholder="Qualifications e.g. MBBS, MD*"
                  value={docQual}
                  onChange={(e) => setDocQual(e.target.value)}
                  className="input text-xs w-full"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Experience (Years)*"
                  value={docExp}
                  onChange={(e) => setDocExp(e.target.value)}
                  className="input text-xs w-full"
                  required
                />
                <input
                  type="number"
                  placeholder="Consultation Fee (₹)*"
                  value={docFee}
                  onChange={(e) => setDocFee(e.target.value)}
                  className="input text-xs w-full"
                  required
                />
              </div>
              <input
                type="text"
                placeholder="Available Days (e.g. Monday,Wednesday)*"
                value={docDays}
                onChange={(e) => setDocDays(e.target.value)}
                className="input text-xs w-full"
                required
              />
              <input
                type="text"
                placeholder="Available Slots (e.g. 10:00 AM,11:00 AM)*"
                value={docSlots}
                onChange={(e) => setDocSlots(e.target.value)}
                className="input text-xs w-full"
                required
              />
              <textarea
                placeholder="About doctor / bio..."
                value={docAbout}
                onChange={(e) => setDocAbout(e.target.value)}
                rows={2}
                className="input text-xs w-full"
              />
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 btn-primary justify-center py-2 text-xs">Save Doctor</button>
                <button type="button" onClick={() => setShowDocForm(false)} className="flex-1 btn-outline justify-center py-2 text-xs text-gray-500 rounded-xl">Cancel</button>
              </div>
            </form>
          )}

          {/* Doctors List */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {doctors.map(doc => (
              <div key={doc.id} className="card p-5 border border-gray-100 flex items-start gap-4">
                <img src={doc.profile_picture} alt={doc.name} className="w-14 h-14 rounded-xl object-cover border border-gray-100 shrink-0" />
                <div>
                  <span className="badge badge-info text-[8px] uppercase tracking-wider font-extrabold">{doc.specialization}</span>
                  <h4 className="text-sm font-bold text-gray-800 mt-1">{doc.name}</h4>
                  <p className="text-[11px] text-gray-500">{doc.qualification}</p>
                  <p className="text-[10px] text-gray-400 mt-1">Fee: {formatCurrency(doc.consultation_fee)} | Exp: {doc.experience} Yrs</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================== SUB-TAB: DELIVERY SETTINGS ==================== */}
      {adminSubTab === 'settings' && (
        <form onSubmit={handleUpdateSettings} className="card p-5 border border-gray-100 max-w-md space-y-4">
          <h3 className="text-sm font-extrabold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
            <Settings className="w-4.5 h-4.5 text-primary-600" /> Delivery Configurations
          </h3>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="input-label">Delivery Radius (KM)</label>
              <input
                type="number"
                step="0.1"
                value={radiusKm}
                onChange={(e) => setRadiusKm(e.target.value)}
                className="input w-full"
                required
              />
            </div>
            <div>
              <label className="input-label">Base Charge (₹)</label>
              <input
                type="number"
                value={deliveryChargeVal}
                onChange={(e) => setDeliveryChargeVal(e.target.value)}
                className="input w-full"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="input-label">Min Order Amount (₹)</label>
              <input
                type="number"
                value={minOrderVal}
                onChange={(e) => setMinOrderVal(e.target.value)}
                className="input w-full"
                required
              />
            </div>
            <div>
              <label className="input-label">Free Delivery Threshold (₹)</label>
              <input
                type="number"
                value={freeDelVal}
                onChange={(e) => setFreeDelVal(e.target.value)}
                className="input w-full"
                required
              />
            </div>
          </div>

          <div className="text-xs">
            <label className="input-label">Serviceable Pincodes (Comma-separated)</label>
            <input
              type="text"
              value={pincodesVal}
              onChange={(e) => setPincodesVal(e.target.value)}
              className="input w-full font-mono text-xs"
              required
            />
          </div>

          <button
            type="submit"
            className="btn-primary w-full justify-center py-2.5 rounded-xl font-bold text-xs mt-3 shadow-md"
          >
            Save Configurations
          </button>
        </form>
      )}
    </div>
  );
}
