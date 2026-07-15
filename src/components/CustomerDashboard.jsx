import React, { useContext, useState, useMemo } from 'react';
import { AppContext, getSheetDisplay } from '../context/AppContext';
import FirstAidKitsSection from './FirstAidKitsSection';
import QuantitySelector from './QuantitySelector';
import PrescriptionModal from './PrescriptionModal';
import {
  Search, ShoppingBag, Heart, Shield, Stethoscope, FlaskConical,
  ArrowRight, Pill, Star, TrendingUp, Clock, ShoppingCart,
  Sparkles, ChevronRight, BadgePercent, Truck, Package, Calendar,
  CheckCircle, AlertTriangle, FileText, Printer, Download, Plus, Trash2, MapPin, X, KeyRound, Bell
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

export default function CustomerDashboard({ setCurrentTab }) {
  const { 
    medicines, sales, user, addToCart, cart, removeFromCart, updateCartQuantity,
    doctors, appointments, prescriptions, deliveryAddresses, deliveryOrders,
    notificationHistory, bookAppointment, saveAddress, deleteAddress, setDefaultAddress, addNotification
  } = useContext(AppContext);

  const [searchTerm, setSearchTerm] = useState('');
  const [subTab, setSubTab] = useState('shop'); // 'shop' | 'appointments' | 'prescriptions' | 'delivery' | 'addresses' | 'notifications'

  // Booking Appointment states
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingSlot, setBookingSlot] = useState('');
  const [patientName, setPatientName] = useState(user?.name || '');
  const [patientPhone, setPatientPhone] = useState(user?.phone || '');
  const [patientAge, setPatientAge] = useState('');
  const [patientGender, setPatientGender] = useState('Male');
  const [patientReason, setPatientReason] = useState('');
  const [showBookingModal, setShowBookingModal] = useState(false);

  // Address states
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addrLine, setAddrLine] = useState('');
  const [addrCity, setAddrCity] = useState('');
  const [addrPincode, setAddrPincode] = useState('');
  const [addrLandmark, setAddrLandmark] = useState('');
  const [addrPhone, setAddrPhone] = useState('');

  // Alternatives / prescription ordering states
  const [selectedRx, setSelectedRx] = useState(null);
  const [alternativesList, setAlternativesList] = useState([]);
  const [showAlternativesModal, setShowAlternativesModal] = useState(false);

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

  // One-Click Order prescription handler
  const handleOrderPrescription = (rx) => {
    let alternatives = [];
    rx.items.forEach(item => {
      const med = medicines.find(m => m.id === item.medicine_id || m.name.toLowerCase() === item.name.toLowerCase());
      if (med && med.stock >= item.quantity) {
        addToCart(med);
        updateCartQuantity(med.id, item.quantity);
      } else {
        const categoryMeds = medicines.filter(m => m.category === (med?.category || 'General') && m.id !== med?.id && m.stock > 0);
        const altMed = categoryMeds[0];
        alternatives.push({
          prescribedName: item.name,
          prescribedQty: item.quantity,
          alternativeMed: altMed || null
        });
      }
    });

    if (alternatives.length > 0) {
      setAlternativesList(alternatives);
      setShowAlternativesModal(true);
    } else {
      addNotification("🛒 Prescription Ordered", "All prescribed medicines added to cart!", "success");
      setCurrentTab('shop');
    }
  };

  const handleAddAlternative = (item) => {
    if (item.alternativeMed) {
      addToCart(item.alternativeMed);
      updateCartQuantity(item.alternativeMed.id, item.prescribedQty);
    }
    // Remove from alternatives list
    setAlternativesList(prev => prev.filter(i => i.prescribedName !== item.prescribedName));
  };

  // Handle Book Appointment
  const handleBook = async (e) => {
    e.preventDefault();
    if (!selectedDoctor || !bookingDate || !bookingSlot || !patientName || !patientAge || !patientPhone) {
      alert("Please fill in all details.");
      return;
    }
    const res = await bookAppointment(selectedDoctor, bookingDate, bookingSlot, {
      name: patientName,
      phone: patientPhone,
      age: patientAge,
      gender: patientGender,
      reason: patientReason
    });

    if (res.success) {
      alert("🎉 Appointment requested successfully!");
      setShowBookingModal(false);
      setSelectedDoctor(null);
      setBookingDate('');
      setBookingSlot('');
      setPatientName(user?.name || '');
      setPatientPhone(user?.phone || '');
      setPatientAge('');
      setPatientReason('');
      setSubTab('appointments');
    } else {
      alert(`❌ Failed to book appointment: ${res.error}`);
    }
  };

  // Add Address Handler
  const handleAddAddress = async (e) => {
    e.preventDefault();
    if (!addrLine || !addrCity || !addrPincode || !addrPhone) {
      alert("Please fill all required address fields.");
      return;
    }
    const res = await saveAddress({
      address_line: addrLine,
      city: addrCity,
      state: 'Telangana',
      pincode: addrPincode,
      landmark: addrLandmark,
      phone: addrPhone,
      is_default: (deliveryAddresses || []).length === 0
    });
    if (res.success) {
      setShowAddressForm(false);
      setAddrLine('');
      setAddrCity('');
      setAddrPincode('');
      setAddrLandmark('');
      setAddrPhone('');
    } else {
      alert(`❌ Failed to save address: ${res.error}`);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ===== HERO BANNER ===== */}
      <div className="hero-banner p-6 sm:p-8 text-white relative">
        <div className="max-w-2xl relative z-10">
          <p className="text-sm font-medium text-white/70 mb-1">Welcome back, {user?.name?.split(' ')[0]} 👋</p>
          <h1 className="text-2xl sm:text-3xl font-bold mb-4">Digital Pharmacy & Care Hub</h1>
          <div className="relative max-w-lg">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search medicines, doctor checkups..."
              className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white text-gray-800 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-white/30 shadow-lg"
            />
          </div>
        </div>
        <div className="absolute top-4 right-8 hidden sm:block opacity-10">
          <Stethoscope className="w-24 h-24 text-white" />
        </div>
      </div>

      {/* ===== CUSTOMER HUB SUB-TABS NAVIGATION ===== */}
      <div className="flex overflow-x-auto gap-2 border-b border-gray-100 pb-3 scrollbar-none">
        {[
          { id: 'shop', label: 'Shop Medicines', icon: ShoppingBag },
          { id: 'appointments', label: 'Doctor Consultations', icon: Calendar },
          { id: 'prescriptions', label: 'My Prescriptions', icon: FileText },
          { id: 'delivery', label: 'Delivery Tracking', icon: Truck },
          { id: 'addresses', label: 'Saved Addresses', icon: MapPin },
          { id: 'notifications', label: 'Notifications', icon: Bell, badge: (notificationHistory || []).filter(n => !n.read).length }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSubTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
              subTab === tab.id ? 'bg-primary-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'
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

      {/* ========================================================
          SUB-TAB: SHOP (DEFAULT POPULAR ITEMS & FIRST AID KITS)
          ======================================================== */}
      {subTab === 'shop' && (
        <>
          {/* Browse Categories */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">Browse by Health Conditions</h2>
              <button onClick={() => setCurrentTab('shop')} className="text-sm font-semibold text-primary-600 hover:underline flex items-center gap-1">
                View All <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-8 gap-3">
              {healthCategories.map((cat) => (
                <button key={cat.name} onClick={() => setCurrentTab('shop')} className="health-category-card">
                  <div className={`health-category-icon ${cat.color}`}>
                    <span className="text-xl">{cat.icon}</span>
                  </div>
                  <p className="text-xs font-semibold text-gray-700 text-center leading-tight">{cat.name}</p>
                </button>
              ))}
            </div>
          </section>

          {/* First Aid Kits Section */}
          <FirstAidKitsSection setCurrentTab={setCurrentTab} />

          {/* Popular Medicines grid */}
          <section className="space-y-4">
            <h3 className="text-lg font-extrabold text-gray-800">Popular Medicines</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {filteredMeds.map((med) => (
                <div key={med.id} className="card p-4 flex flex-col group justify-between border border-gray-100/60 hover:shadow-md transition-shadow">
                  <div>
                    <span className="self-start badge badge-info mb-2">{med.category}</span>
                    <h4 className="text-sm font-bold text-gray-800 leading-tight mb-0.5">{med.name}</h4>
                    <p className="text-xs text-gray-400 mb-2">{med.genericName}</p>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="badge badge-neutral">{med.dosageForm}</span>
                      {med.tabletsPerSheet > 1 && (
                        <span className="text-[10px] text-primary-500 font-semibold">{med.packaging || 'Strip'} of {med.tabletsPerSheet}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-auto flex items-center justify-between gap-2 pt-2 border-t border-gray-50">
                    <div>
                      <p className="text-base font-bold text-primary-700">{formatCurrency(med.sellingPrice)}</p>
                      <p className="text-[10px] text-gray-400 line-through">{formatCurrency(med.sellingPrice * 1.2)}</p>
                    </div>
                    <div className="w-24 shrink-0">
                      <QuantitySelector
                        medicine={med}
                        cart={cart}
                        addToCart={addToCart}
                        removeFromCart={removeFromCart}
                        updateCartQuantity={updateCartQuantity}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {/* ========================================================
          SUB-TAB: DOCTOR CONSULTATIONS (LISTING & BOOKING)
          ======================================================== */}
      {subTab === 'appointments' && (
        <div className="space-y-8">
          {/* Doctor Cards */}
          <section className="space-y-4">
            <h3 className="text-lg font-bold text-gray-800">Available Specialists</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {doctors.map(doc => (
                <div key={doc.id} className="card p-5 border border-gray-100 flex flex-col justify-between hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                  <div className="flex gap-4 items-start">
                    <img src={doc.profile_picture} alt={doc.name} className="w-16 h-16 rounded-2xl object-cover border border-gray-100 shrink-0" />
                    <div>
                      <span className="bg-primary-50 text-primary-700 font-bold text-[9px] px-2 py-0.5 rounded-lg border border-primary-100">
                        {doc.specialization}
                      </span>
                      <h4 className="text-sm font-bold text-gray-800 mt-1">{doc.name}</h4>
                      <p className="text-[11px] text-gray-500 font-medium">{doc.qualification}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{doc.experience} Years Experience</p>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 mt-4 leading-relaxed bg-gray-50/50 p-3 rounded-xl min-h-[60px] line-clamp-2">
                    {doc.about || 'Specialist doctor consulting at Sai Chandrika Clinics.'}
                  </p>

                  <div className="flex justify-between items-center mt-5 pt-3 border-t border-gray-50 text-xs">
                    <div>
                      <span className="text-gray-400 block font-medium">Consultation Fee</span>
                      <span className="font-extrabold text-primary-700 text-sm">{formatCurrency(doc.consultation_fee)}</span>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedDoctor(doc);
                        setShowBookingModal(true);
                      }}
                      className="btn-primary btn-sm rounded-xl px-4 py-2 font-bold cursor-pointer"
                    >
                      Book Appointment
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* My Appointments queue */}
          <section className="space-y-4 border-t border-gray-100 pt-6">
            <h3 className="text-lg font-bold text-gray-800">My Appointments</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {appointments.map(apt => {
                const doc = doctors.find(d => d.id === apt.doctor_id);
                return (
                  <div key={apt.id} className="card p-5 border border-gray-100 flex justify-between items-start gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-mono font-bold text-primary-600">{apt.id}</span>
                        <span className={`badge ${
                          apt.status === 'Pending' ? 'badge-warning' :
                          apt.status === 'Approved' ? 'badge-info' :
                          apt.status === 'Completed' ? 'badge-success' : 'badge-danger'
                        }`}>
                          {apt.status}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-gray-800">{doc ? doc.name : 'Medical Doctor'}</h4>
                      <p className="text-xs text-gray-500 mt-1">🗓️ {apt.appointment_date} | ⏰ {apt.appointment_slot}</p>
                      <p className="text-xs text-gray-400 mt-1 font-medium">Patient: {apt.patient_name} ({apt.patient_age} Y/O)</p>
                    </div>
                  </div>
                );
              })}
              {appointments.length === 0 && (
                <div className="col-span-2 card p-8 text-center text-gray-400">
                  <Calendar className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                  <p className="text-xs font-semibold">No appointments scheduled</p>
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {/* ========================================================
          SUB-TAB: MY PRESCRIPTIONS (LISTING & ONE-CLICK ORDER)
          ======================================================== */}
      {subTab === 'prescriptions' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {prescriptions.map(rx => {
            const doc = doctors.find(d => d.id === rx.doctor_id);
            return (
              <div key={rx.id} className="card p-5 border border-gray-100 flex flex-col justify-between hover:shadow-md transition-all duration-200">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-mono font-bold text-primary-600">{rx.id}</span>
                    <span className="text-xs text-gray-400 font-medium">{new Date(rx.date || rx.created_at).toLocaleDateString()}</span>
                  </div>
                  <h4 className="text-sm font-bold text-gray-800">Doctor: {doc ? doc.name : 'Consultant Physician'}</h4>
                  <p className="text-xs text-gray-500">Patient: {rx.patient_name} • {rx.patient_age} Yrs</p>
                  
                  <div className="mt-3 text-xs bg-gray-50 p-3 rounded-xl space-y-1.5">
                    <p><span className="font-bold text-gray-700">Diagnosis:</span> {rx.diagnosis || 'General checkup'}</p>
                    <p className="text-primary-600 font-bold">📋 Prescribed {rx.items ? rx.items.length : 0} items</p>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-gray-100 flex gap-2">
                  <button
                    onClick={() => setSelectedRx(rx)}
                    className="flex-1 btn-outline btn-sm justify-center py-2 text-xs rounded-xl"
                  >
                    View Slip
                  </button>
                  <button
                    onClick={() => handleOrderPrescription(rx)}
                    className="flex-1 btn-primary btn-sm justify-center py-2 text-xs rounded-xl"
                  >
                    One-Click Order
                  </button>
                </div>
              </div>
            );
          })}
          {prescriptions.length === 0 && (
            <div className="col-span-2 card p-8 text-center text-gray-400">
              <FileText className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              <p className="text-xs font-semibold">No digital prescriptions found</p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          SUB-TAB: DELIVERY TRACKING (TIMELINES & OTP CODES)
          ======================================================== */}
      {subTab === 'delivery' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {deliveryOrders.map(order => {
            const sale = sales.find(s => s.id === order.id);
            return (
              <div key={order.id} className="card p-5 border border-gray-100 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-mono font-bold text-primary-600">{order.id}</span>
                  <span className="badge badge-success text-[10px]">{order.status}</span>
                </div>
                
                <div className="text-xs text-gray-600 space-y-1.5">
                  <p><span className="font-bold text-gray-700">Bill Total:</span> {formatCurrency(sale ? sale.total : 0)}</p>
                  <p><span className="font-bold text-gray-700">Delivery Notes:</span> {order.delivery_notes || 'None'}</p>
                </div>

                {/* OTP Sharing Widget */}
                {order.status === 'Out for Delivery' && (
                  <div className="bg-primary-50 p-3.5 rounded-2xl border border-primary-100 flex items-center justify-between text-xs animate-pulse">
                    <div className="flex items-center gap-2 text-primary-700">
                      <KeyRound className="w-4 h-4 shrink-0" />
                      <div>
                        <span className="font-bold block">Delivery OTP</span>
                        <span className="text-[10px] text-primary-600">Share this with rider on arrival</span>
                      </div>
                    </div>
                    <span className="font-mono font-black text-base text-primary-800 tracking-wider bg-white px-3 py-1 rounded-xl shadow-sm border border-primary-100">
                      {order.otp}
                    </span>
                  </div>
                )}

                {/* Timeline progress horizontal */}
                <div className="pt-2">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-3">Timeline Tracker</span>
                  <div className="relative flex justify-between items-center">
                    <div className="absolute left-0 right-0 h-0.5 bg-gray-200 top-2.5 z-0" />
                    {['Placed', 'Accepted', 'Out for Delivery', 'Delivered'].map((step, idx) => {
                      const statusMap = {
                        'Placed': ['Order Placed'],
                        'Accepted': ['Accepted', 'Preparing', 'Packed'],
                        'Out for Delivery': ['Out for Delivery'],
                        'Delivered': ['Delivered']
                      };
                      const currentStep = Object.keys(statusMap).find(k => statusMap[k].includes(order.status)) || 'Placed';
                      const stepList = Object.keys(statusMap);
                      const isDone = stepList.indexOf(step) <= stepList.indexOf(currentStep);

                      return (
                        <div key={idx} className="flex flex-col items-center relative z-10">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center border text-[9px] font-bold ${
                            isDone ? 'bg-primary-600 border-primary-600 text-white' : 'bg-white border-gray-300 text-gray-400'
                          }`}>
                            {idx + 1}
                          </div>
                          <span className="text-[8px] font-bold text-gray-500 mt-1">{step}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
          {deliveryOrders.length === 0 && (
            <div className="col-span-2 card p-8 text-center text-gray-400">
              <Truck className="w-10 h-10 mx-auto mb-2 text-gray-300 animate-bounce-gentle" />
              <p className="text-xs font-semibold">No active delivery orders found</p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          SUB-TAB: ADDRESS BOOK (LISTING & UPDATING)
          ======================================================== */}
      {subTab === 'addresses' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-extrabold text-gray-800 uppercase tracking-wider">Saved Delivery Addresses</h3>
            <button
              onClick={() => setShowAddressForm(!showAddressForm)}
              className="btn-primary btn-sm flex items-center gap-1.5 cursor-pointer rounded-xl"
            >
              <Plus className="w-4 h-4" /> Add Address
            </button>
          </div>

          {/* Add address Form inline toggle */}
          {showAddressForm && (
            <form onSubmit={handleAddAddress} className="card p-5 border border-gray-200/60 max-w-md space-y-3 animate-scale-in">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">New Address Profile</h4>
              <input
                type="text"
                placeholder="Flat, street address line*"
                value={addrLine}
                onChange={(e) => setAddrLine(e.target.value)}
                className="input text-xs w-full"
                required
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="City*"
                  value={addrCity}
                  onChange={(e) => setAddrCity(e.target.value)}
                  className="input text-xs w-full"
                  required
                />
                <input
                  type="text"
                  placeholder="Pincode*"
                  value={addrPincode}
                  onChange={(e) => setAddrPincode(e.target.value)}
                  className="input text-xs w-full"
                  required
                />
              </div>
              <input
                type="text"
                placeholder="Landmark (Optional)"
                value={addrLandmark}
                onChange={(e) => setAddrLandmark(e.target.value)}
                className="input text-xs w-full"
              />
              <input
                type="text"
                placeholder="Recipient Phone number*"
                value={addrPhone}
                onChange={(e) => setAddrPhone(e.target.value)}
                className="input text-xs w-full"
                required
              />
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 btn-primary justify-center py-2 text-xs">
                  Save Address
                </button>
                <button type="button" onClick={() => setShowAddressForm(false)} className="flex-1 btn-outline justify-center py-2 text-xs text-gray-500 rounded-xl">
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Address Cards listing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {deliveryAddresses.map(addr => (
              <div key={addr.id} className={`card p-5 border flex flex-col justify-between ${addr.is_default ? 'border-primary-500 shadow-sm' : 'border-gray-100'}`}>
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="flex items-center gap-1 text-xs font-bold text-gray-700">
                      <MapPin className="w-4 h-4 text-primary-600" /> Address Details
                    </span>
                    {addr.is_default && (
                      <span className="badge badge-success text-[9px] uppercase tracking-wider font-extrabold">Default</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed mt-1">{addr.address_line}, {addr.city} - {addr.pincode}</p>
                  {addr.landmark && <p className="text-[10px] text-gray-400 mt-0.5">Landmark: {addr.landmark}</p>}
                  <p className="text-[10px] text-gray-500 mt-2 font-medium">📞 Contact: {addr.phone}</p>
                </div>

                <div className="mt-5 pt-3 border-t border-gray-50 flex gap-2 justify-end">
                  {!addr.is_default && (
                    <button
                      onClick={() => setDefaultAddress(addr.id)}
                      className="text-[11px] font-bold text-primary-600 hover:underline cursor-pointer"
                    >
                      Make Default
                    </button>
                  )}
                  <button
                    onClick={() => deleteAddress(addr.id)}
                    className="text-[11px] font-bold text-red-500 hover:underline flex items-center gap-0.5 cursor-pointer ml-3"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            ))}
            {deliveryAddresses.length === 0 && (
              <div className="col-span-2 card p-8 text-center text-gray-400">
                <MapPin className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p className="text-xs font-semibold">No saved addresses found</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          SUB-TAB: NOTIFICATIONS (IN-APP INBOX)
          ======================================================== */}
      {subTab === 'notifications' && (
        <div className="card p-5 max-w-xl mx-auto space-y-3">
          <h3 className="text-sm font-extrabold text-gray-800 uppercase tracking-wider mb-2">In-App Notifications</h3>
          <div className="divide-y divide-gray-50">
            {notificationHistory.map(n => (
              <div key={n.id} className="py-3 flex items-start gap-3">
                <span className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${n.read ? 'bg-gray-300' : 'bg-primary-500 animate-pulse'}`} />
                <div className="min-w-0 flex-1">
                  <h5 className={`text-xs font-extrabold text-gray-800 ${!n.read ? 'text-primary-700' : ''}`}>{n.title}</h5>
                  <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                  <span className="text-[9px] text-gray-400 mt-1 block">{new Date(n.created_at).toLocaleString()}</span>
                </div>
              </div>
            ))}
            {notificationHistory.length === 0 && (
              <div className="py-8 text-center text-gray-400">
                <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-xs font-medium">No notifications yet</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============ MODAL: APPOINTMENT BOOKING DIALOG ============ */}
      {showBookingModal && selectedDoctor && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <form onSubmit={handleBook} className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl animate-scale-in space-y-4">
            <div className="flex justify-between items-start border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-black text-gray-800 text-sm">Request Consult Appointment</h3>
                <p className="text-xs text-primary-600 mt-0.5">Specialist: Dr. {selectedDoctor.name}</p>
              </div>
              <button type="button" onClick={() => setShowBookingModal(false)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="input-label">Select Date</label>
                  <input
                    type="date"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="input w-full text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="input-label">Select Slot</label>
                  <select
                    value={bookingSlot}
                    onChange={(e) => setBookingSlot(e.target.value)}
                    className="input w-full text-xs bg-white"
                    required
                  >
                    <option value="">-- Choose Slot --</option>
                    {selectedDoctor.available_slots.split(',').map(slot => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="input-label">Patient Name</label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="input w-full text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="input-label">Age</label>
                  <input
                    type="number"
                    value={patientAge}
                    onChange={(e) => setPatientAge(e.target.value)}
                    className="input w-full text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="input-label">Gender</label>
                  <select
                    value={patientGender}
                    onChange={(e) => setPatientGender(e.target.value)}
                    className="input w-full text-xs bg-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="input-label">Contact Phone</label>
                <input
                  type="text"
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                  className="input w-full text-xs"
                  required
                />
              </div>

              <div>
                <label className="input-label">Reason / Symptoms description</label>
                <input
                  type="text"
                  placeholder="e.g. Fever and dry cough..."
                  value={patientReason}
                  onChange={(e) => setPatientReason(e.target.value)}
                  className="input w-full text-xs"
                />
              </div>
            </div>

            <button type="submit" className="w-full btn-primary py-2.5 rounded-xl justify-center font-bold text-xs shadow-md mt-4">
              Confirm Appointment Booking
            </button>
          </form>
        </div>
      )}

      {/* ============ MODAL: ALTERNATIVES SUGGESTION POPUP ============ */}
      {showAlternativesModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl animate-scale-in space-y-4">
            <div className="flex justify-between items-start border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-black text-gray-800 text-sm">⚠️ Out of Stock Alert</h3>
                <p className="text-xs text-gray-400 mt-0.5">Some prescribed medicines are unavailable.</p>
              </div>
              <button onClick={() => setShowAlternativesModal(false)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {alternativesList.map((item, idx) => (
                <div key={idx} className="bg-amber-50/50 p-3.5 rounded-2xl border border-amber-100 space-y-2 text-xs">
                  <p className="font-semibold text-gray-700">Prescribed: <span className="text-red-600 font-bold">{item.prescribedName}</span> ({item.prescribedQty} Tablets)</p>
                  
                  {item.alternativeMed ? (
                    <div className="bg-white p-3 rounded-xl border border-gray-100 flex justify-between items-center">
                      <div>
                        <span className="text-[10px] text-green-600 font-bold bg-green-50 px-1.5 py-0.5 rounded-md border border-green-100">Alternative suggested</span>
                        <p className="font-bold text-gray-800 mt-1">{item.alternativeMed.name}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">Stock: {item.alternativeMed.stock} | Fee: {formatCurrency(item.alternativeMed.sellingPrice)}</p>
                      </div>
                      <button
                        onClick={() => handleAddAlternative(item)}
                        className="btn-primary btn-sm px-3 rounded-lg text-[10px] font-bold"
                      >
                        Add suggested
                      </button>
                    </div>
                  ) : (
                    <p className="text-[10px] text-red-500 font-medium bg-white p-2 rounded-xl border border-red-100/50">No stock alternatives available in inventory.</p>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-2 mt-4 pt-2">
              <button
                onClick={() => {
                  setShowAlternativesModal(false);
                  addNotification("🛒 Prescription Ordered", "Prescription medicines processed to checkout.", "success");
                  setCurrentTab('shop');
                }}
                className="flex-1 btn-primary justify-center py-2 text-xs font-bold shadow-md"
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slip modal viewer */}
      {selectedRx && (
        <PrescriptionModal rx={selectedRx} onClose={() => setSelectedRx(null)} />
      )}
    </div>
  );
}
