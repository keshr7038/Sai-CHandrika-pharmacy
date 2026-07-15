import React, { useContext, useState, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { generateAvailableSlots } from './DoctorConsultation';
import { 
  Calendar, Clock, User, Phone, CheckCircle, XCircle, Search, 
  Filter, CalendarDays, RefreshCw, Settings, Trash2, Plus, CalendarRange
} from 'lucide-react';

const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);
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
  const { appointments, updateAppointmentStatus, addNotification } = useContext(AppContext);
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
    const res = await updateAppointmentStatus(apptId, status);
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

    const res = await updateAppointmentStatus(reschedulingAppt.id, 'Pending', rescheduleDate, rescheduleSlot);
    if (res.success) {
      addNotification(`📅 Appointment ${reschedulingAppt.id} rescheduled successfully!`, 'success');
      setReschedulingAppt(null);
      setRescheduleDate('');
      setRescheduleSlot('');
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
                  <th className="py-3 px-5">Fee</th>
                  <th className="py-3 px-5">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAppointments.map((appt) => (
                  <tr key={appt.id} className="table-row">
                    <td className="font-bold text-gray-800">{appt.id}</td>
                    <td>
                      <p className="font-bold text-gray-800">{appt.patient_name}</p>
                      <p className="text-xs text-gray-400">{appt.patient_phone} • {appt.patient_age} yrs • {appt.patient_gender}</p>
                      <p className="text-[10px] text-gray-400 font-medium italic mt-0.5">Reason: {appt.reason || 'General Checkup'}</p>
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
                    <td className="font-bold text-primary-750">{formatCurrency(appt.consultation_fee)}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        {appt.status === 'Pending' && (
                          <button
                            onClick={() => handleStatusChange(appt.id, 'Confirmed')}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-sm cursor-pointer transition-colors"
                          >
                            Confirm
                          </button>
                        )}
                        {appt.status !== 'Completed' && appt.status !== 'Cancelled' && (
                          <>
                            <button
                              onClick={() => setReschedulingAppt(appt)}
                              className="bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-sm cursor-pointer transition-colors flex items-center gap-0.5"
                            >
                              <RefreshCw className="w-2.5 h-2.5" />
                              Reschedule
                            </button>
                            <button
                              onClick={() => handleStatusChange(appt.id, 'Completed')}
                              className="bg-blue-500 hover:bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-sm cursor-pointer transition-colors"
                            >
                              Complete
                            </button>
                            <button
                              onClick={() => handleStatusChange(appt.id, 'Cancelled')}
                              className="bg-red-500 hover:bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-sm cursor-pointer transition-colors"
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
                <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">Appointment Duration</label>
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
