import React, { useContext, useState, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { generateAvailableSlots } from './DoctorConsultation';
import { 
  Calendar, Clock, User, Phone, CheckCircle, XCircle, Search, 
  Filter, CalendarDays, RefreshCw, Settings, Trash2, Plus, CalendarRange,
  FileText, Activity, AlertCircle, Trash, Pill, Edit3, X
} from 'lucide-react';

const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val || 0);
const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

const defaultScheduleConfig = {
  workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  startHour: '09:00',
  endHour: '17:00',
  duration: 30, // minutes
  maxAppointmentsPerDay: 16,
  holidays: [] // YYYY-MM-DD
};

export default function AppointmentsManager() {
  const { appointments, medicines, updateAppointment, addNotification, highlightedApptId } = useContext(AppContext);
  const [activeTab, setActiveTab] = useState('list'); // 'list' or 'settings'
  
  // Filtering & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');
  
  // Rescheduling Modal
  const [reschedulingAppt, setReschedulingAppt] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleSlot, setRescheduleSlot] = useState('');
  
  // Settings/Schedule Configuration
  const [scheduleConfig, setScheduleConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('saichandrika_doctor_schedule');
      return saved ? JSON.parse(saved) : defaultScheduleConfig;
    } catch {
      return defaultScheduleConfig;
    }
  });

  // Post-Consultation Form States
  const [consultingAppt, setConsultingAppt] = useState(null);
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [actualDuration, setActualDuration] = useState('15');
  const [consultationFee, setConsultationFee] = useState('');
  const [doctorRemarks, setDoctorRemarks] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [otherCharges, setOtherCharges] = useState('0');
  const [discount, setDiscount] = useState('0');
  const [gst, setGst] = useState('0');
  
  // Prescribed Medicines State
  const [prescribedMeds, setPrescribedMeds] = useState([]);
  const [medSearchTerm, setMedSearchTerm] = useState('');
  const [selectedMedId, setSelectedMedId] = useState('');
  const [selectedMedQty, setSelectedMedQty] = useState(1);

  const saveConfig = (newConfig) => {
    setScheduleConfig(newConfig);
    localStorage.setItem('saichandrika_doctor_schedule', JSON.stringify(newConfig));
    addNotification("⚙️ Doctor schedule updated successfully!", 'success');
  };

  // Holidays Input
  const [newHoliday, setNewHoliday] = useState('');

  // Filtered Appointments list
  const filteredAppointments = useMemo(() => {
    return appointments.filter(a => {
      const matchesSearch = a.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) || a.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All' || a.status === statusFilter;
      const matchesDate = !dateFilter || a.appointment_date === dateFilter;
      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [appointments, searchTerm, statusFilter, dateFilter]);

  // Filtered medicines for search in prescription
  const filteredPrescriptionMeds = useMemo(() => {
    if (!medSearchTerm) return [];
    return medicines.filter(m => 
      m.name.toLowerCase().includes(medSearchTerm.toLowerCase()) || 
      m.genericName.toLowerCase().includes(medSearchTerm.toLowerCase())
    ).slice(0, 5);
  }, [medicines, medSearchTerm]);

  // Available slots for rescheduling
  const bookedSlotsOnRescheduleDate = useMemo(() => {
    if (!rescheduleDate) return [];
    return appointments
      .filter(a => a.appointment_date === rescheduleDate && a.status !== 'Cancelled' && a.id !== reschedulingAppt?.id)
      .map(a => a.time_slot);
  }, [appointments, rescheduleDate, reschedulingAppt]);

  const rescheduleSlots = useMemo(() => {
    if (!rescheduleDate) return [];
    return generateAvailableSlots(rescheduleDate, bookedSlotsOnRescheduleDate, scheduleConfig);
  }, [rescheduleDate, bookedSlotsOnRescheduleDate, scheduleConfig]);

  const handleStatusChange = async (apptId, status) => {
    const res = await updateAppointment(apptId, { status });
    if (res.success) {
      addNotification(`📅 Appointment ${apptId} status updated to: ${status}`, 'success');
    }
  };

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    if (!rescheduleDate || !rescheduleSlot) {
      alert("Please select a valid date and time slot.");
      return;
    }

    const res = await updateAppointment(reschedulingAppt.id, {
      status: 'Pending',
      appointment_date: rescheduleDate,
      time_slot: rescheduleSlot
    });

    if (res.success) {
      addNotification(`📅 Appointment ${reschedulingAppt.id} rescheduled successfully!`, 'success');
      setReschedulingAppt(null);
      setRescheduleDate('');
      setRescheduleSlot('');
    }
  };

  // Add medicine to prescription list
  const handleAddPrescribedMed = (med) => {
    const qty = parseInt(selectedMedQty);
    if (qty > med.stock) {
      alert(`Insufficient stock. Only ${med.stock} sheets/items available.`);
      return;
    }

    const existingIndex = prescribedMeds.findIndex(m => m.medicineId === med.id);
    if (existingIndex > -1) {
      const updated = [...prescribedMeds];
      const newQty = updated[existingIndex].quantity + qty;
      if (newQty > med.stock) {
        alert(`Cannot add more. Exceeds total stock of ${med.stock}.`);
        return;
      }
      updated[existingIndex].quantity = newQty;
      updated[existingIndex].subtotal = newQty * med.sellingPrice;
      setPrescribedMeds(updated);
    } else {
      setPrescribedMeds([...prescribedMeds, {
        medicineId: med.id,
        name: med.name,
        quantity: qty,
        price: med.sellingPrice,
        subtotal: qty * med.sellingPrice
      }]);
    }
    setMedSearchTerm('');
    setSelectedMedQty(1);
  };

  const handleRemovePrescribedMed = (medicineId) => {
    setPrescribedMeds(prescribedMeds.filter(m => m.medicineId !== medicineId));
  };

  // Open consultation portal
  const handleOpenConsultation = (appt) => {
    setConsultingAppt(appt);
    setDiagnosis(appt.diagnosis || '');
    setNotes(appt.consultation_notes || '');
    setActualDuration(appt.actual_duration?.toString() || '15');
    setConsultationFee(appt.consultation_fee?.toString() || '500');
    setDoctorRemarks(appt.doctor_remarks || '');
    setFollowUpDate(appt.follow_up_date || '');
    setOtherCharges(appt.other_charges?.toString() || '0');
    setDiscount(appt.discount?.toString() || '0');
    setGst(appt.gst?.toString() || '0');
    setPrescribedMeds(appt.prescribed_medicines || []);
  };

  // Save consultation summary & trigger invoice generation
  const handleSaveConsultation = async (e) => {
    e.preventDefault();
    if (!consultationFee || parseFloat(consultationFee) < 0) {
      alert("Consultation fee is required to generate the final invoice.");
      return;
    }

    const updatePayload = {
      status: 'Completed',
      diagnosis,
      consultation_notes: notes,
      actual_duration: parseInt(actualDuration),
      consultation_fee: parseFloat(consultationFee),
      prescribed_medicines: prescribedMeds,
      follow_up_date: followUpDate || null,
      doctor_remarks: doctorRemarks,
      other_charges: parseFloat(otherCharges || 0),
      discount: parseFloat(discount || 0),
      gst: parseFloat(gst || 0),
      payment_status: consultingAppt.payment_status || 'Pending'
    };

    const res = await updateAppointment(consultingAppt.id, updatePayload);
    if (res.success) {
      addNotification(`🏥 Consultation summary & Invoice generated for ${consultingAppt.id}!`, 'success');
      setConsultingAppt(null);
    }
  };

  const handleAddHoliday = () => {
    if (!newHoliday) return;
    if (scheduleConfig.holidays.includes(newHoliday)) {
      alert("This holiday date is already added.");
      return;
    }
    const updatedHolidays = [...scheduleConfig.holidays, newHoliday].sort();
    saveConfig({ ...scheduleConfig, holidays: updatedHolidays });
    setNewHoliday('');
  };

  const handleRemoveHoliday = (holidayDate) => {
    const updatedHolidays = scheduleConfig.holidays.filter(h => h !== holidayDate);
    saveConfig({ ...scheduleConfig, holidays: updatedHolidays });
  };

  const toggleWorkingDay = (day) => {
    const updatedDays = scheduleConfig.workingDays.includes(day)
      ? scheduleConfig.workingDays.filter(d => d !== day)
      : [...scheduleConfig.workingDays, day];
    saveConfig({ ...scheduleConfig, workingDays: updatedDays });
  };

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CalendarDays className="w-7 h-7 text-primary-600" />
            Appointments Manager
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage consultations, rescheduling requests, and doctor schedule configuration
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex bg-gray-100 p-1 rounded-xl shrink-0 self-start">
          <button
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors ${
              activeTab === 'list' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Appointments List
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors ${
              activeTab === 'settings' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Settings className="w-4 h-4" />
            Schedule Configuration
          </button>
        </div>
      </div>

      {activeTab === 'list' ? (
        // ============ APPOINTMENTS LIST VIEW ============
        <div className="card p-6 bg-white border border-gray-100 space-y-5">
          {/* Stats Counters Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100/60 flex flex-col justify-between">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total Bookings</span>
              <p className="text-xl font-black text-gray-800 mt-1">{appointments.length}</p>
            </div>
            <div className="bg-amber-50/30 p-4 rounded-2xl border border-amber-100/50 flex flex-col justify-between">
              <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">Pending</span>
              <p className="text-xl font-black text-amber-750 mt-1">{appointments.filter(a => a.status === 'Pending').length}</p>
            </div>
            <div className="bg-emerald-50/30 p-4 rounded-2xl border border-emerald-100/50 flex flex-col justify-between">
              <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Confirmed</span>
              <p className="text-xl font-black text-emerald-700 mt-1">{appointments.filter(a => a.status === 'Confirmed').length}</p>
            </div>
            <div className="bg-blue-50/30 p-4 rounded-2xl border border-blue-100/50 flex flex-col justify-between">
              <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">Completed</span>
              <p className="text-xl font-black text-blue-700 mt-1">{appointments.filter(a => a.status === 'Completed').length}</p>
            </div>
            <div className="bg-red-50/30 p-4 rounded-2xl border border-red-100/50 flex flex-col justify-between">
              <span className="text-[10px] text-red-600 font-bold uppercase tracking-wider">Cancelled</span>
              <p className="text-xl font-black text-red-750 mt-1">{appointments.filter(a => a.status === 'Cancelled').length}</p>
            </div>
            <div className="bg-primary-50/30 p-4 rounded-2xl border border-primary-100/50 flex flex-col justify-between">
              <span className="text-[10px] text-primary-600 font-bold uppercase tracking-wider">Today's</span>
              <p className="text-xl font-black text-primary-700 mt-1">
                {appointments.filter(a => a.appointment_date === new Date().toISOString().split('T')[0]).length}
              </p>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-gray-50 pb-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by patient name or ID..."
                className="input pl-11"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Date Filter */}
            <div className="relative">
              <CalendarRange className="absolute left-4.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
                className="input pl-11 text-gray-700"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-4.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                className="input pl-11 py-2.5 text-gray-700"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="table-header">
                  <th className="py-3 px-5">Appt ID</th>
                  <th className="py-3 px-5">Patient Details</th>
                  <th className="py-3 px-5">Date & Time</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5">Fee / Invoice</th>
                  <th className="py-3 px-5">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAppointments.map((appt) => (
                  <tr 
                    key={appt.id} 
                    className={`table-row transition-all duration-700 ${
                      highlightedApptId === appt.id 
                        ? 'bg-emerald-50/70 border-l-4 border-l-emerald-500 scale-[1.002] shadow-sm animate-pulse' 
                        : ''
                    }`}
                  >
                    <td className="font-bold text-gray-800">{appt.id}</td>
                    <td>
                      <p className="font-bold text-gray-800">{appt.patient_name}</p>
                      <p className="text-xs text-gray-400">{appt.patient_phone} • {appt.patient_age} yrs • {appt.patient_gender}</p>
                      <p className="text-[10px] text-gray-400 font-medium italic mt-0.5">Reason: {appt.reason || 'General Checkup'}</p>
                      {appt.prescription_file_url && (
                        <a 
                          href={appt.prescription_file_url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] text-primary-600 hover:underline font-bold mt-1"
                        >
                          <FileText className="w-3 h-3" />
                          View Uploaded Report
                        </a>
                      )}
                    </td>
                    <td>
                      <p className="font-semibold text-gray-700">{formatDate(appt.appointment_date)}</p>
                      <p className="text-[10px] text-primary-600 font-extrabold uppercase">{appt.time_slot}</p>
                    </td>
                    <td>
                      <span className={`badge ${
                        appt.status === 'Confirmed' ? 'badge-success' :
                        appt.status === 'Completed' ? 'badge-info' :
                        appt.status === 'Cancelled' ? 'badge-danger' : 'badge-warning'
                      }`}>
                        {appt.status}
                      </span>
                    </td>
                    <td className="font-bold">
                      {appt.consultation_fee ? (
                        <div className="flex flex-col">
                          <span className="text-primary-750">{formatCurrency(appt.consultation_fee)}</span>
                          <span className={`text-[9px] font-bold uppercase tracking-wider ${
                            appt.payment_status === 'Paid' ? 'text-emerald-600' : 'text-rose-600 animate-pulse'
                          }`}>
                            {appt.payment_status || 'Pending'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-gray-400 italic">No fee entered</span>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        {appt.status === 'Pending' && (
                          <button
                            onClick={() => handleStatusChange(appt.id, 'Confirmed')}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold px-2 py-1.5 rounded-lg shadow-sm cursor-pointer transition-colors"
                          >
                            Confirm
                          </button>
                        )}
                        
                        {appt.status !== 'Cancelled' && (
                          <button
                            onClick={() => handleOpenConsultation(appt)}
                            className="bg-primary-600 hover:bg-primary-700 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg shadow-sm cursor-pointer transition-colors flex items-center gap-1"
                          >
                            <Edit3 className="w-3 h-3" />
                            {appt.status === 'Completed' ? 'Edit Consult' : 'Consult Now'}
                          </button>
                        )}

                        {appt.status !== 'Completed' && appt.status !== 'Cancelled' && (
                          <>
                            <button
                              onClick={() => setReschedulingAppt(appt)}
                              className="bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold px-2 py-1.5 rounded-lg shadow-sm cursor-pointer transition-colors flex items-center gap-0.5"
                            >
                              <RefreshCw className="w-2.5 h-2.5" />
                              Reschedule
                            </button>
                            <button
                              onClick={() => handleStatusChange(appt.id, 'Cancelled')}
                              className="bg-red-500 hover:bg-red-600 text-white text-[10px] font-bold px-2 py-1.5 rounded-lg shadow-sm cursor-pointer transition-colors"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredAppointments.length === 0 && (
                  <tr>
                    <td colSpan="6" className="py-20 text-center text-gray-400">
                      <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm font-semibold">No appointments found</p>
                      <p className="text-xs text-gray-400 mt-0.5">Try adjusting your filters or search query.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        // ============ SCHEDULE CONFIGURATION / SETTINGS VIEW ============
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main settings panel */}
          <div className="lg:col-span-2 card p-6 bg-white border border-gray-100 space-y-6">
            <h3 className="text-base font-bold text-gray-800 border-b border-gray-100 pb-3 flex items-center gap-1.5">
              <Settings className="w-5 h-5 text-primary-600" />
              Timing & Capacity Rules
            </h3>

            {/* Start & End Hours */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">Consultation Start Hour</label>
                <select
                  className="input py-2.5"
                  value={scheduleConfig.startHour}
                  onChange={(e) => saveConfig({ ...scheduleConfig, startHour: e.target.value })}
                >
                  <option value="08:00">08:00 AM</option>
                  <option value="09:00">09:00 AM</option>
                  <option value="10:00">10:00 AM</option>
                  <option value="11:00">11:00 AM</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">Consultation End Hour</label>
                <select
                  className="input py-2.5"
                  value={scheduleConfig.endHour}
                  onChange={(e) => saveConfig({ ...scheduleConfig, endHour: e.target.value })}
                >
                  <option value="16:00">04:00 PM</option>
                  <option value="17:00">05:00 PM</option>
                  <option value="18:00">06:00 PM</option>
                  <option value="19:00">07:00 PM</option>
                </select>
              </div>
            </div>

            {/* Slots duration & Max appointments */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">Default Duration (mins)</label>
                <select
                  className="input py-2.5"
                  value={scheduleConfig.duration}
                  onChange={(e) => saveConfig({ ...scheduleConfig, duration: parseInt(e.target.value) })}
                >
                  <option value="15">15 Minutes</option>
                  <option value="30">30 Minutes</option>
                  <option value="45">45 Minutes</option>
                  <option value="60">60 Minutes</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">Max Bookings Per Day</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  className="input"
                  value={scheduleConfig.maxAppointmentsPerDay}
                  onChange={(e) => saveConfig({ ...scheduleConfig, maxAppointmentsPerDay: parseInt(e.target.value) })}
                />
              </div>
            </div>

            {/* Working Days checklist */}
            <div>
              <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-2">Clinic Working Days</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {daysOfWeek.map(day => {
                  const isActive = scheduleConfig.workingDays.includes(day);
                  return (
                    <button
                      key={day}
                      onClick={() => toggleWorkingDay(day)}
                      className={`py-2 px-3 rounded-xl border text-xs font-semibold text-center cursor-pointer transition-all duration-200 ${
                        isActive 
                          ? 'bg-primary-50 border-primary-200 text-primary-700 font-bold'
                          : 'bg-white border-gray-150 text-gray-400 hover:bg-gray-50'
                      }`}
                    >
                      {day.slice(0, 3)}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Leave/Holidays panel */}
          <div className="lg:col-span-1 card p-6 bg-white border border-gray-100 space-y-5">
            <h3 className="text-base font-bold text-gray-800 border-b border-gray-100 pb-3 flex items-center gap-1.5">
              <CalendarDays className="w-5 h-5 text-primary-600" />
              Holidays / Leave Days
            </h3>

            {/* Add Holiday Input */}
            <div className="flex gap-2">
              <input
                type="date"
                className="input py-2 text-xs text-gray-700"
                value={newHoliday}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setNewHoliday(e.target.value)}
              />
              <button
                onClick={handleAddHoliday}
                className="btn-primary rounded-xl flex items-center justify-center p-2.5 cursor-pointer shrink-0"
                title="Add Leave"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {/* Holidays List */}
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {scheduleConfig.holidays.map(h => (
                <div key={h} className="p-3 bg-gray-50/70 border border-gray-100 rounded-xl flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-gray-700">{formatDate(h)}</span>
                  <button
                    onClick={() => handleRemoveHoliday(h)}
                    className="p-1 rounded-lg text-red-500 hover:bg-red-50 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {scheduleConfig.holidays.length === 0 && (
                <div className="py-12 text-center text-gray-400">
                  <CalendarDays className="w-10 h-10 mx-auto mb-1.5 text-gray-300" />
                  <p className="text-xs font-medium">No holiday leaves scheduled</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============ CONSULTATION & POST-BILLING FORM MODAL ============ */}
      {consultingAppt && (
        <div className="modal-overlay">
          <div className="modal-container w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="modal-header">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                <Activity className="w-5 h-5 text-primary-600" />
                Clinical Consultation Desk
              </h3>
              <button
                onClick={() => setConsultingAppt(null)}
                className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveConsultation} className="p-6 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* LEFT COLUMN: Clinical Diagnoses & Notes */}
                <div className="space-y-4">
                  <h4 className="text-xs font-extrabold text-gray-800 border-l-4 border-primary-500 pl-2 uppercase tracking-wide">
                    Medical Summary
                  </h4>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Diagnosis *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Acute Viral Bronchitis / Gastropathy"
                      className="input"
                      value={diagnosis}
                      onChange={(e) => setDiagnosis(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Consultation Clinical Notes</label>
                    <textarea
                      rows="3"
                      placeholder="Enter clinical examination notes..."
                      className="input py-2 resize-none"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Consultation Duration (mins)</label>
                      <input
                        type="number"
                        min="1"
                        placeholder="e.g. 15"
                        className="input"
                        value={actualDuration}
                        onChange={(e) => setActualDuration(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Follow-up Date (optional)</label>
                      <input
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                        className="input text-gray-700"
                        value={followUpDate}
                        onChange={(e) => setFollowUpDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Doctor Remarks / Instructions</label>
                    <input
                      type="text"
                      placeholder="e.g. Take medicines after meals; Bed rest for 2 days."
                      className="input"
                      value={doctorRemarks}
                      onChange={(e) => setDoctorRemarks(e.target.value)}
                    />
                  </div>
                </div>

                {/* RIGHT COLUMN: Prescription (Medicines selection) */}
                <div className="space-y-4">
                  <h4 className="text-xs font-extrabold text-gray-800 border-l-4 border-primary-500 pl-2 uppercase tracking-wide">
                    💊 Prescribe Medicines
                  </h4>

                  <div className="space-y-3">
                    <div className="relative">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Search Medicine</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Type medicine name to search..."
                          className="input"
                          value={medSearchTerm}
                          onChange={(e) => setMedSearchTerm(e.target.value)}
                        />
                        <input
                          type="number"
                          min="1"
                          className="input w-16 text-center"
                          value={selectedMedQty}
                          onChange={(e) => setSelectedMedQty(e.target.value)}
                        />
                      </div>

                      {/* Dropdown Results */}
                      {filteredPrescriptionMeds.length > 0 && (
                        <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-150 rounded-xl shadow-lg z-20 max-h-48 overflow-y-auto p-1.5 space-y-1">
                          {filteredPrescriptionMeds.map(med => (
                            <button
                              key={med.id}
                              type="button"
                              onClick={() => handleAddPrescribedMed(med)}
                              className="w-full text-left p-2 hover:bg-primary-50 rounded-lg text-xs flex justify-between items-center transition-colors cursor-pointer"
                            >
                              <div>
                                <p className="font-bold text-gray-800">{med.name}</p>
                                <p className="text-[10px] text-gray-400">Stock: {med.stock} sheets • {med.packaging}</p>
                              </div>
                              <span className="font-bold text-primary-700">{formatCurrency(med.sellingPrice)}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Prescribed List */}
                    <div className="space-y-2 border border-gray-100 rounded-xl p-3 bg-gray-50/40 min-h-[140px] max-h-[180px] overflow-y-auto">
                      {prescribedMeds.map(med => (
                        <div key={med.medicineId} className="flex justify-between items-center bg-white p-2 rounded-lg border border-gray-100 text-xs">
                          <div>
                            <p className="font-bold text-gray-700">{med.name}</p>
                            <p className="text-[10px] text-gray-400">{med.quantity} x {formatCurrency(med.price)}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-800">{formatCurrency(med.subtotal)}</span>
                            <button
                              type="button"
                              onClick={() => handleRemovePrescribedMed(med.medicineId)}
                              className="p-1 hover:bg-red-50 text-red-500 rounded-md transition-colors cursor-pointer"
                            >
                              <Trash className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                      {prescribedMeds.length === 0 && (
                        <div className="py-10 text-center text-gray-400">
                          <Pill className="w-7 h-7 mx-auto mb-1 text-gray-300" />
                          <p className="text-[10px] font-medium">No medicines prescribed yet.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* POST-CONSULTATION INVOICE FORM FIELDS */}
              <div className="border-t border-gray-150 pt-5 space-y-4">
                <h4 className="text-xs font-extrabold text-gray-800 border-l-4 border-primary-500 pl-2 uppercase tracking-wide">
                  📄 Consultation Fees & Invoicing Details
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Consultation Fee *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      placeholder="e.g. 500"
                      className="input font-bold text-primary-750"
                      value={consultationFee}
                      onChange={(e) => setConsultationFee(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Other Facility Charges (optional)</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g. 100"
                      className="input"
                      value={otherCharges}
                      onChange={(e) => setOtherCharges(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Special Discount (optional)</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g. 50"
                      className="input text-red-600 font-semibold"
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">GST (optional)</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g. 40"
                      className="input text-gray-600"
                      value={gst}
                      onChange={(e) => setGst(e.target.value)}
                    />
                  </div>
                </div>

                {/* Grand Total Preview */}
                <div className="p-4 bg-primary-50/40 border border-primary-100 rounded-xl flex justify-between items-center">
                  <div>
                    <span className="text-[10px] text-primary-600 font-bold uppercase tracking-wider">Invoice Grand Total Preview</span>
                    <p className="text-xl font-black text-primary-750 mt-0.5">
                      {(() => {
                        const medCost = prescribedMeds.reduce((sum, m) => sum + m.subtotal, 0);
                        const base = parseFloat(consultationFee || 0) + medCost + parseFloat(otherCharges || 0);
                        const afterDiscount = base - parseFloat(discount || 0);
                        const total = afterDiscount + parseFloat(gst || 0);
                        return formatCurrency(total);
                      })()}
                    </p>
                  </div>
                  <div className="text-xs text-gray-500 font-semibold text-right">
                    <p>Consultation: {formatCurrency(parseFloat(consultationFee || 0))}</p>
                    <p>Medicines: {formatCurrency(prescribedMeds.reduce((sum, m) => sum + m.subtotal, 0))}</p>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 flex gap-3 border-t border-gray-150 justify-end">
                <button
                  type="button"
                  onClick={() => setConsultingAppt(null)}
                  className="btn-outline btn-md py-2.5 rounded-xl text-gray-500 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary btn-md py-2.5 rounded-xl text-white cursor-pointer"
                >
                  Save Consultation & Generate Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============ RESCHEDULE APPOINTMENT MODAL ============ */}
      {reschedulingAppt && (
        <div className="modal-overlay">
          <div className="modal-container w-full max-w-md">
            <div className="modal-header">
              <h3 className="text-sm font-bold text-gray-800">Reschedule Appointment</h3>
              <button
                onClick={() => setReschedulingAppt(null)}
                className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 cursor-pointer"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRescheduleSubmit} className="p-6 space-y-4">
              <div>
                <p className="text-xs text-gray-500">Rescheduling appointment for patient:</p>
                <p className="text-sm font-bold text-gray-800 mt-0.5">{reschedulingAppt.patient_name}</p>
                <p className="text-[10px] text-gray-400">ID: {reschedulingAppt.id} • Current Slot: {formatDate(reschedulingAppt.appointment_date)} ({reschedulingAppt.time_slot})</p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">New Appointment Date *</label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className="input text-gray-700"
                  value={rescheduleDate}
                  onChange={(e) => {
                    setRescheduleDate(e.target.value);
                    setRescheduleSlot('');
                  }}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">Available Slots *</label>
                <select
                  className="input py-2.5 text-gray-700"
                  required
                  disabled={!rescheduleDate}
                  value={rescheduleSlot}
                  onChange={(e) => setRescheduleSlot(e.target.value)}
                >
                  <option value="">{rescheduleDate ? '-- Select a slot --' : 'Choose date first'}</option>
                  {rescheduleSlots.map(slot => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
                {rescheduleDate && rescheduleSlots.length === 0 && (
                  <p className="text-[10px] text-red-500 font-semibold mt-1">No slots available on this date.</p>
                )}
              </div>

              <div className="pt-4 flex gap-3 border-t border-gray-100 justify-end">
                <button
                  type="button"
                  onClick={() => setReschedulingAppt(null)}
                  className="btn-outline btn-md py-2 px-4 rounded-xl text-gray-500 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary btn-md py-2 px-5 rounded-xl text-white cursor-pointer"
                >
                  Save Rescheduling
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
