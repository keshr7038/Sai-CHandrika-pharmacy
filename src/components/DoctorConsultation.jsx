import React, { useState, useContext, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { 
  Calendar, Clock, User, Phone, BookOpen, AlertCircle, CheckCircle, 
  XCircle, ChevronRight, Eye, CalendarDays, Award, Languages, Stethoscope, Heart, X,
  FileText, Plus, ClipboardList, Check
} from 'lucide-react';

const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val || 0);
const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

// Default Schedule configuration
const defaultScheduleConfig = {
  workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  startHour: '09:00',
  endHour: '17:00',
  duration: 30, // 30 minutes
  maxAppointmentsPerDay: 16,
  holidays: [] // YYYY-MM-DD
};

// Slots Generator Helper
export function generateAvailableSlots(dateStr, bookedSlots = [], scheduleConfig = defaultScheduleConfig) {
  const dateObj = new Date(dateStr);
  const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
  
  if (!scheduleConfig.workingDays.includes(dayName)) return [];
  if (scheduleConfig.holidays.includes(dateStr)) return [];
  
  const slots = [];
  let [startH, startM] = scheduleConfig.startHour.split(':').map(Number);
  let [endH, endM] = scheduleConfig.endHour.split(':').map(Number);
  
  let current = new Date(2000, 0, 1, startH, startM);
  const end = new Date(2000, 0, 1, endH, endM);
  
  while (current < end) {
    const hours = current.getHours().toString().padStart(2, '0');
    const mins = current.getMinutes().toString().padStart(2, '0');
    const slotStr = `${hours}:${mins}`;
    
    if (!bookedSlots.includes(slotStr)) {
      slots.push(slotStr);
    }
    
    current.setMinutes(current.getMinutes() + scheduleConfig.duration);
  }
  
  return slots;
}

export default function DoctorConsultation() {
  const { user, appointments, bookAppointment, updateAppointment, addNotification } = useContext(AppContext);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState(null);
  
  // Booking Form States
  const [patientName, setPatientName] = useState(user?.name || '');
  const [patientPhone, setPatientPhone] = useState(user?.phone || '');
  const [patientAge, setPatientAge] = useState('');
  const [patientGender, setPatientGender] = useState('Male');
  const [apptDate, setApptDate] = useState('');
  const [apptSlot, setApptSlot] = useState('');
  const [reason, setReason] = useState('');
  const [symptoms, setSymptoms] = useState('');
  
  // File Upload State
  const [fileName, setFileName] = useState('');
  const [fileUrl, setFileUrl] = useState('');

  // Read schedule config from localStorage
  const scheduleConfig = useMemo(() => {
    try {
      const saved = localStorage.getItem('saichandrika_doctor_schedule');
      return saved ? JSON.parse(saved) : defaultScheduleConfig;
    } catch {
      return defaultScheduleConfig;
    }
  }, []);

  // Filter appointments for the current customer
  const myAppointments = useMemo(() => {
    return appointments.filter(a => a.customer_email === user?.email);
  }, [appointments, user?.email]);

  // Compute booked slots on the selected date to prevent double-booking
  const bookedSlotsOnSelectedDate = useMemo(() => {
    if (!apptDate) return [];
    return appointments
      .filter(a => a.appointment_date === apptDate && a.status !== 'Cancelled')
      .map(a => a.time_slot);
  }, [appointments, apptDate]);

  // Generate slots dynamically for the selected date
  const availableSlots = useMemo(() => {
    if (!apptDate) return [];
    return generateAvailableSlots(apptDate, bookedSlotsOnSelectedDate, scheduleConfig);
  }, [apptDate, bookedSlotsOnSelectedDate, scheduleConfig]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFileName(file.name);
      // Generate a mock object URL for frontend preview
      setFileUrl(URL.createObjectURL(file));
    }
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!patientName || !patientPhone || !patientAge || !apptDate || !apptSlot) {
      alert("Please fill in all required fields.");
      return;
    }

    const uniqueId = `APT-${Math.floor(100000 + Math.random() * 900000)}`;
    const newAppointment = {
      id: uniqueId,
      patient_name: patientName,
      patient_phone: patientPhone,
      patient_age: parseInt(patientAge),
      patient_gender: patientGender,
      appointment_date: apptDate,
      time_slot: apptSlot,
      reason,
      symptoms,
      prescription_file_url: fileUrl,
      status: 'Pending',
      consultation_fee: null, // Entered post-consultation
      customer_email: user?.email || 'walkin@gmail.com',
      created_at: new Date().toISOString(),
      diagnosis: null,
      consultation_notes: null,
      actual_duration: null,
      prescribed_medicines: [],
      follow_up_date: null,
      doctor_remarks: null,
      other_charges: 0,
      discount: 0,
      gst: 0,
      payment_status: 'Pending'
    };

    const res = await bookAppointment(newAppointment);
    if (res.success) {
      addNotification(`📅 Appointment ${uniqueId} booked successfully!`, 'success');
      setIsBookingOpen(false);
      // Reset form states
      setPatientAge('');
      setApptDate('');
      setApptSlot('');
      setReason('');
      setSymptoms('');
      setFileName('');
      setFileUrl('');
    }
  };

  const handleCancelAppointment = async (apptId) => {
    if (window.confirm("Are you sure you want to cancel this appointment?")) {
      const res = await updateAppointment(apptId, { status: 'Cancelled' });
      if (res.success) {
        addNotification(`❌ Appointment ${apptId} cancelled.`, 'warning');
      }
    }
  };

  const handlePayInvoice = async (apptId) => {
    const res = await updateAppointment(apptId, { payment_status: 'Paid' });
    if (res.success) {
      addNotification(`💳 Invoice for appointment ${apptId} marked as Paid!`, 'success');
      // Update local selected state if open
      if (selectedAppt && selectedAppt.id === apptId) {
        setSelectedAppt(prev => ({ ...prev, payment_status: 'Paid' }));
      }
    }
  };

  const isUpcoming = (dateStr, slotStr) => {
    const [hours, minutes] = slotStr.split(':').map(Number);
    const apptDateTime = new Date(dateStr);
    apptDateTime.setHours(hours, minutes, 0, 0);
    return apptDateTime > new Date();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Stethoscope className="w-7 h-7 text-primary-600" />
          Doctor Consultation
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Book appointments and consult with our resident medical specialist
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ============ DOCTOR PROFILE CARD ============ */}
        <div className="lg:col-span-1">
          <div className="card p-6 flex flex-col justify-between h-full bg-white relative overflow-hidden border border-gray-100">
            <div>
              {/* Doctor Headshot Photo */}
              <div className="relative w-36 h-36 mx-auto rounded-full overflow-hidden border-4 border-primary-50 shadow-soft mb-4">
                <img 
                  src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400" 
                  alt="Dr. Chandrashekhar Rao"
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="text-center mb-5">
                <h2 className="text-lg font-black text-gray-800">Dr. Chandrashekhar Rao</h2>
                <p className="text-xs font-semibold text-primary-600 uppercase tracking-wider mt-0.5">MBBS, MD (General Medicine)</p>
                <p className="text-[11px] text-gray-400 mt-1">General Physician & Family Consultant</p>
              </div>

              <div className="space-y-3.5 border-t border-gray-100 pt-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
                    <Award className="w-4 h-4 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Experience</p>
                    <p className="text-xs font-semibold text-gray-700">15+ Years of Service</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Timings & Availability</p>
                    <p className="text-xs font-semibold text-gray-700">09:00 AM - 05:00 PM</p>
                    <p className="text-[10px] text-gray-500 font-medium">Monday to Saturday</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
                    <Languages className="w-4 h-4 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Languages Spoken</p>
                    <p className="text-xs font-semibold text-gray-700">English, Telugu, Hindi</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-gray-100 pt-4">
              <p className="text-xs text-gray-500 leading-relaxed mb-4">
                Dr. Chandrashekhar Rao is a dedicated general physician with over 15 years of experience. He provides comprehensive family healthcare, preventive consultations, and wellness therapies.
              </p>
              <button 
                onClick={() => setIsBookingOpen(true)}
                className="w-full btn-primary btn-md justify-center py-2.5 rounded-xl text-sm"
              >
                <Calendar className="w-4 h-4" />
                Book Consultation
              </button>
            </div>
          </div>
        </div>

        {/* ============ MY APPOINTMENTS HISTORY ============ */}
        <div className="lg:col-span-2">
          <div className="card p-6 bg-white border border-gray-100 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
                <h3 className="text-base font-bold text-gray-800 flex items-center gap-1.5">
                  <CalendarDays className="w-5 h-5 text-primary-600" />
                  My Appointments
                </h3>
                <span className="badge-info text-xs">{myAppointments.length} Booked</span>
              </div>

              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                {myAppointments.map((appt) => {
                  const active = isUpcoming(appt.appointment_date, appt.time_slot);
                  return (
                    <div 
                      key={appt.id} 
                      className="p-4 rounded-xl border border-gray-100 hover:shadow-sm transition-all duration-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
                          <Stethoscope className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-gray-800">{appt.id}</span>
                            <span className={`badge ${
                              appt.status === 'Confirmed' ? 'badge-success' :
                              appt.status === 'Completed' ? 'badge-info' :
                              appt.status === 'Cancelled' ? 'badge-danger' : 'badge-warning'
                            }`}>
                              {appt.status}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 font-medium mt-1">
                            Patient: <span className="font-semibold text-gray-700">{appt.patient_name}</span> ({appt.patient_age} yrs, {appt.patient_gender})
                          </p>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            Reason: {appt.reason || 'General Checkup'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between md:text-right border-t md:border-t-0 border-gray-50 pt-2.5 md:pt-0">
                        <div className="md:pr-4 text-left md:text-right">
                          <p className="text-xs font-bold text-gray-700">{formatDate(appt.appointment_date)}</p>
                          <p className="text-[10px] text-gray-400 font-semibold uppercase">{appt.time_slot}</p>
                          {appt.consultation_fee ? (
                            <p className="text-xs font-semibold text-primary-700 mt-0.5">
                              Fee: {formatCurrency(appt.consultation_fee)}
                            </p>
                          ) : (
                            <p className="text-[10px] text-amber-600 font-bold mt-0.5 uppercase tracking-wide">
                              Pending Invoice
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => setSelectedAppt(appt)}
                            className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700 cursor-pointer"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {appt.status !== 'Cancelled' && appt.status !== 'Completed' && active && (
                            <button 
                              onClick={() => handleCancelAppointment(appt.id)}
                              className="btn-danger btn-sm text-[10px] py-1.5 rounded-lg"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {myAppointments.length === 0 && (
                  <div className="py-20 text-center text-gray-400">
                    <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm font-semibold">No appointments scheduled</p>
                    <p className="text-xs text-gray-400 mt-0.5">Click "Book Consultation" to schedule your appointment.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============ APPOINTMENT BOOKING FORM MODAL ============ */}
      {isBookingOpen && (
        <div className="modal-overlay">
          <div className="modal-container w-full max-w-lg">
            <div className="modal-header">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                <CalendarDays className="w-5 h-5 text-primary-600" />
                Book Consultation
              </h3>
              <button 
                onClick={() => setIsBookingOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleBookingSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">Patient Name *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Enter full name"
                    className="input"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">Phone Number *</label>
                  <input 
                    type="tel" 
                    required 
                    placeholder="Enter phone number"
                    className="input"
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">Age *</label>
                  <input 
                    type="number" 
                    required 
                    min="1" 
                    max="120"
                    placeholder="Age in years"
                    className="input"
                    value={patientAge}
                    onChange={(e) => setPatientAge(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">Gender *</label>
                  <select 
                    className="input py-2.5"
                    value={patientGender}
                    onChange={(e) => setPatientGender(e.target.value)}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">Preferred Date *</label>
                  <input 
                    type="date" 
                    required 
                    min={new Date().toISOString().split('T')[0]}
                    className="input text-gray-700"
                    value={apptDate}
                    onChange={(e) => {
                      setApptDate(e.target.value);
                      setApptSlot('');
                    }}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">Preferred Time Slot *</label>
                  <select 
                    className="input py-2.5 text-gray-700"
                    required
                    disabled={!apptDate}
                    value={apptSlot}
                    onChange={(e) => setApptSlot(e.target.value)}
                  >
                    <option value="">{apptDate ? '-- Select a slot --' : 'Choose date first'}</option>
                    {availableSlots.map(slot => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                  {apptDate && availableSlots.length === 0 && (
                    <p className="text-[10px] text-red-500 font-semibold mt-1">No slots available on this date.</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">Reason for Visit</label>
                <input 
                  type="text"
                  placeholder="e.g. Routine consultation, Chronic disease checkup"
                  className="input"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">Symptoms (optional)</label>
                <textarea 
                  rows="2"
                  placeholder="Describe your symptoms (e.g. high fever, headache since 2 days)"
                  className="input py-2 resize-none"
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">Upload Previous Prescription/Report (optional)</label>
                <div className="flex items-center gap-3">
                  <label className="flex-1 border border-dashed border-gray-200 rounded-xl p-3 text-center cursor-pointer hover:bg-gray-50 transition-colors">
                    <span className="text-xs text-gray-500 font-semibold">{fileName || 'Choose report file...'}</span>
                    <input 
                      type="file" 
                      accept="image/*,.pdf" 
                      className="hidden" 
                      onChange={handleFileChange}
                    />
                  </label>
                  {fileName && (
                    <button 
                      type="button" 
                      onClick={() => { setFileName(''); setFileUrl(''); }}
                      className="p-2 bg-red-50 text-red-500 rounded-xl border border-red-150 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="pt-4 flex gap-3 border-t border-gray-100 justify-end">
                <button 
                  type="button" 
                  onClick={() => setIsBookingOpen(false)}
                  className="btn-outline btn-md py-2.5 rounded-xl text-gray-500 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary btn-md py-2.5 rounded-xl text-white cursor-pointer"
                >
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============ APPOINTMENT DETAILS & DIGITAL INVOICE MODAL ============ */}
      {selectedAppt && (
        <div className="modal-overlay">
          <div className="modal-container w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="modal-header">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                <FileText className="w-5 h-5 text-primary-600" />
                Appointment Detail Hub
              </h3>
              <button 
                onClick={() => setSelectedAppt(null)}
                className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Header Status Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-100 pb-4">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Appointment ID</p>
                  <p className="text-lg font-black text-gray-800">{selectedAppt.id}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`badge ${
                    selectedAppt.status === 'Confirmed' ? 'badge-success' :
                    selectedAppt.status === 'Completed' ? 'badge-info' :
                    selectedAppt.status === 'Cancelled' ? 'badge-danger' : 'badge-warning'
                  }`}>
                    Status: {selectedAppt.status}
                  </span>
                  {selectedAppt.consultation_fee && (
                    <span className={`badge ${
                      selectedAppt.payment_status === 'Paid' ? 'badge-success' : 'badge-danger'
                    }`}>
                      Payment: {selectedAppt.payment_status || 'Pending'}
                    </span>
                  )}
                </div>
              </div>

              {/* Grid sections */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. Patient & Schedule Info */}
                <div className="space-y-4">
                  <h4 className="text-xs font-extrabold text-gray-800 border-l-4 border-primary-500 pl-2 uppercase tracking-wide">
                    Patient & Booking Info
                  </h4>
                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Patient Name:</span>
                      <span className="text-gray-700 font-bold">{selectedAppt.patient_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Age / Gender:</span>
                      <span className="text-gray-700 font-bold">{selectedAppt.patient_age} yrs / {selectedAppt.patient_gender}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Phone Number:</span>
                      <span className="text-gray-700 font-semibold">{selectedAppt.patient_phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Appt Date:</span>
                      <span className="text-gray-700 font-semibold">{formatDate(selectedAppt.appointment_date)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Time Slot:</span>
                      <span className="text-primary-700 font-bold uppercase">{selectedAppt.time_slot}</span>
                    </div>
                    {selectedAppt.symptoms && (
                      <div className="pt-1.5">
                        <span className="text-gray-400 block mb-0.5">Symptoms:</span>
                        <p className="bg-gray-50 p-2 rounded-lg text-gray-600 italic text-[11px] leading-relaxed">
                          {selectedAppt.symptoms}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Consultation Summary (Diagnosis & Notes) */}
                <div className="space-y-4">
                  <h4 className="text-xs font-extrabold text-gray-800 border-l-4 border-primary-500 pl-2 uppercase tracking-wide">
                    Consultation Summary
                  </h4>
                  {selectedAppt.status === 'Completed' || selectedAppt.diagnosis ? (
                    <div className="space-y-2.5 text-xs">
                      <div>
                        <span className="text-gray-400 block mb-0.5">Diagnosis:</span>
                        <p className="text-gray-800 font-bold bg-primary-50/40 p-2 rounded-lg border border-primary-100">
                          {selectedAppt.diagnosis || 'General debility / Wellness review'}
                        </p>
                      </div>
                      {selectedAppt.consultation_notes && (
                        <div>
                          <span className="text-gray-400 block mb-0.5">Clinical Notes:</span>
                          <p className="text-gray-600 bg-gray-50 p-2 rounded-lg text-[11px] leading-relaxed">
                            {selectedAppt.consultation_notes}
                          </p>
                        </div>
                      )}
                      {selectedAppt.doctor_remarks && (
                        <div>
                          <span className="text-gray-400 block mb-0.5">Doctor Remarks:</span>
                          <p className="text-gray-600 bg-gray-50 p-2 rounded-lg text-[11px] leading-relaxed">
                            {selectedAppt.doctor_remarks}
                          </p>
                        </div>
                      )}
                      {selectedAppt.actual_duration && (
                        <div className="flex justify-between pt-1 border-t border-gray-100">
                          <span className="text-gray-400">Actual Duration:</span>
                          <span className="text-gray-700 font-bold">{selectedAppt.actual_duration} minutes</span>
                        </div>
                      )}
                      {selectedAppt.follow_up_date && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Follow-up Date:</span>
                          <span className="text-primary-700 font-extrabold">{formatDate(selectedAppt.follow_up_date)}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-gray-400 border border-dashed border-gray-150 rounded-xl">
                      <Clock className="w-8 h-8 mx-auto mb-1 text-gray-300" />
                      <p className="text-xs font-semibold">Consultation details pending</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">Summary will appear here after consultation completes.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* 3. Digital Prescription (Medicines) */}
              {(selectedAppt.prescribed_medicines && selectedAppt.prescribed_medicines.length > 0) && (
                <div className="space-y-3 pt-3 border-t border-gray-100">
                  <h4 className="text-xs font-extrabold text-gray-800 border-l-4 border-primary-500 pl-2 uppercase tracking-wide">
                    💊 Prescribed Medicines (Digital Prescription)
                  </h4>
                  <div className="overflow-x-auto rounded-xl border border-gray-100">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="bg-gray-50 text-gray-500 font-bold border-b border-gray-100">
                          <th className="py-2 px-4">Medicine</th>
                          <th className="py-2 px-4">Quantity</th>
                          <th className="py-2 px-4">Price</th>
                          <th className="py-2 px-4 text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedAppt.prescribed_medicines.map((med, i) => (
                          <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/40">
                            <td className="py-2 px-4 font-bold text-gray-700">{med.name}</td>
                            <td className="py-2 px-4 font-semibold text-gray-600">{med.quantity}</td>
                            <td className="py-2 px-4 text-gray-500">{formatCurrency(med.price)}</td>
                            <td className="py-2 px-4 font-bold text-gray-700 text-right">{formatCurrency(med.subtotal)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 4. Consultation Invoice Invoice section */}
              {selectedAppt.consultation_fee ? (
                <div className="pt-4 border-t border-gray-150 space-y-3.5">
                  <h4 className="text-xs font-extrabold text-gray-800 border-l-4 border-primary-500 pl-2 uppercase tracking-wide">
                    📄 Consultation Invoice
                  </h4>
                  <div className="bg-gray-50/50 rounded-2xl border border-gray-150/80 p-5 space-y-3">
                    <div className="text-xs space-y-2.5">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Consultation Professional Fee:</span>
                        <span className="font-bold text-gray-700">{formatCurrency(selectedAppt.consultation_fee)}</span>
                      </div>
                      
                      {selectedAppt.prescribed_medicines && selectedAppt.prescribed_medicines.length > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Prescribed Medicine Charges:</span>
                          <span className="font-bold text-gray-700">
                            {formatCurrency(selectedAppt.prescribed_medicines.reduce((sum, m) => sum + m.subtotal, 0))}
                          </span>
                        </div>
                      )}

                      {selectedAppt.other_charges > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Other / Clinical Facility Charges:</span>
                          <span className="font-bold text-gray-700">{formatCurrency(selectedAppt.other_charges)}</span>
                        </div>
                      )}

                      {selectedAppt.discount > 0 && (
                        <div className="flex justify-between text-red-600">
                          <span>Special Discount:</span>
                          <span className="font-bold">-{formatCurrency(selectedAppt.discount)}</span>
                        </div>
                      )}

                      {selectedAppt.gst > 0 && (
                        <div className="flex justify-between text-gray-500">
                          <span>GST / SGST/CGST:</span>
                          <span className="font-bold">{formatCurrency(selectedAppt.gst)}</span>
                        </div>
                      )}
                    </div>

                    {/* Grand Total */}
                    <div className="pt-3.5 border-t border-gray-200/80 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Grand Total Amount</span>
                        <p className="text-lg font-black text-primary-750">
                          {(() => {
                            const medCost = selectedAppt.prescribed_medicines?.reduce((sum, m) => sum + m.subtotal, 0) || 0;
                            const base = parseFloat(selectedAppt.consultation_fee) + medCost + parseFloat(selectedAppt.other_charges || 0);
                            const afterDiscount = base - parseFloat(selectedAppt.discount || 0);
                            const total = afterDiscount + parseFloat(selectedAppt.gst || 0);
                            return formatCurrency(total);
                          })()}
                        </p>
                      </div>

                      {/* Payment Action if pending */}
                      {selectedAppt.payment_status !== 'Paid' ? (
                        <button
                          onClick={() => handlePayInvoice(selectedAppt.id)}
                          className="btn-success btn-md py-2 px-5 rounded-xl text-white font-bold flex items-center gap-1.5 shadow-sm active:scale-[0.98] transition-transform cursor-pointer"
                        >
                          <Check className="w-4 h-4" />
                          Pay Invoice
                        </button>
                      ) : (
                        <div className="flex items-center gap-1 text-emerald-600 font-extrabold text-sm bg-emerald-50 px-3.5 py-1.5 rounded-xl border border-emerald-200">
                          <CheckCircle className="w-4 h-4" />
                          Invoice Paid
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : selectedAppt.status === 'Completed' && (
                <div className="py-6 text-center text-gray-400 border border-dashed border-gray-150 rounded-xl">
                  <AlertCircle className="w-7 h-7 mx-auto mb-1 text-amber-500 animate-pulse" />
                  <p className="text-xs font-semibold text-gray-600">Invoice Draft Pending</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">The invoice will be generated as soon as the doctor enters the consultation fee details.</p>
                </div>
              )}

              {/* Close Button Footer */}
              <div className="pt-4 border-t border-gray-100 flex justify-end">
                <button 
                  onClick={() => setSelectedAppt(null)}
                  className="btn-primary btn-md py-2 px-6 rounded-xl text-white cursor-pointer"
                >
                  Close Detail Hub
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
