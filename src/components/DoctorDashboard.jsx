import React, { useState, useContext, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { 
  Calendar, Clock, User, Heart, Search, Plus, Trash2, FileText, Check, X, ShieldAlert, Sparkles, BookOpen 
} from 'lucide-react';
import PrescriptionModal from './PrescriptionModal';

export default function DoctorDashboard() {
  const { 
    user, appointments, medicines, prescriptions, 
    updateAppointmentStatus, createPrescription, addNotification 
  } = useContext(AppContext);

  const [activeTab, setActiveTab] = useState('appointments'); // 'appointments' | 'prescriptions'
  const [selectedRx, setSelectedRx] = useState(null);
  
  // Builder Form State
  const [showBuilder, setShowBuilder] = useState(false);
  const [activeAppointment, setActiveAppointment] = useState(null);
  const [diagnosis, setDiagnosis] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [advice, setAdvice] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [prescriptionItems, setPrescriptionItems] = useState([]);
  
  // Medicine Search inside Builder
  const [medQuery, setMedQuery] = useState('');
  const [selectedMed, setSelectedMed] = useState(null);
  const [medQty, setMedQty] = useState(10);
  const [medDosage, setMedDosage] = useState('1-0-1');
  const [medTiming, setMedTiming] = useState('After Food');
  const [medDuration, setMedDuration] = useState(5);

  // Filter medicines based on search query
  const filteredMedicines = useMemo(() => {
    if (!medQuery.trim()) return [];
    return medicines.filter(m => 
      m.name.toLowerCase().includes(medQuery.toLowerCase()) ||
      (m.genericName && m.genericName.toLowerCase().includes(medQuery.toLowerCase()))
    );
  }, [medQuery, medicines]);

  // Handle Add Item to Builder list
  const addMedicineItem = () => {
    if (!selectedMed) return;
    
    // Check if duplicate
    if (prescriptionItems.some(i => i.medicineId === selectedMed.id)) {
      alert("Medicine already added to prescription.");
      return;
    }

    const newItem = {
      medicineId: selectedMed.id,
      name: selectedMed.name,
      quantity: parseInt(medQty),
      dosage: medDosage,
      timing: medTiming,
      duration: parseInt(medDuration),
      availableStock: selectedMed.stock
    };

    setPrescriptionItems(prev => [...prev, newItem]);
    setSelectedMed(null);
    setMedQuery('');
    setMedQty(10);
  };

  // Submit Prescription
  const handleSubmitPrescription = async (e) => {
    e.preventDefault();
    if (!activeAppointment) return;
    if (prescriptionItems.length === 0) {
      alert("Please add at least one medicine to the prescription.");
      return;
    }

    const rxData = {
      appointmentId: activeAppointment.id,
      doctorId: user.id,
      doctorName: user.name,
      customerId: activeAppointment.customer_id,
      patientName: activeAppointment.patient_name,
      patientAge: activeAppointment.patient_age,
      patientGender: activeAppointment.patient_gender,
      diagnosis,
      symptoms,
      advice,
      followUpDate: followUpDate || null,
      doctorSignature: user.name
    };

    const res = await createPrescription(rxData, prescriptionItems);
    if (res.success) {
      // Mark appointment completed
      await updateAppointmentStatus(activeAppointment.id, 'Completed');
      
      // Reset Form
      setShowBuilder(false);
      setActiveAppointment(null);
      setDiagnosis('');
      setSymptoms('');
      setAdvice('');
      setFollowUpDate('');
      setPrescriptionItems([]);
      alert("🎉 Digital Prescription created and sent to patient!");
    } else {
      alert(`❌ Failed to create prescription: ${res.error}`);
    }
  };

  const handleOpenBuilder = (apt) => {
    setActiveAppointment(apt);
    setDiagnosis('');
    setSymptoms(apt.reason || '');
    setAdvice('');
    setPrescriptionItems([]);
    setShowBuilder(true);
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="card bg-gradient-to-br from-primary-600 to-primary-800 text-white p-6 relative overflow-hidden">
        <div className="relative z-10">
          <span className="bg-white/20 backdrop-blur-sm text-xs font-bold px-3 py-1 rounded-full text-white uppercase tracking-wider">
            Doctor Portal
          </span>
          <h2 className="text-2xl font-black mt-3">Welcome, Dr. {user.name}</h2>
          <p className="text-xs text-white/80 mt-1 max-w-md">
            Manage your patient consultations queue, write digital prescriptions utilizing the store's active inventory, and track checkup schedules.
          </p>
        </div>
        <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-15 flex items-center justify-center">
          <Sparkles className="w-32 h-32" />
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex gap-2 border-b border-gray-100 pb-3">
        <button
          onClick={() => setActiveTab('appointments')}
          className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all duration-200 cursor-pointer ${activeTab === 'appointments' ? 'bg-primary-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}
        >
          Appointments Queue ({appointments.length})
        </button>
        <button
          onClick={() => setActiveTab('prescriptions')}
          className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all duration-200 cursor-pointer ${activeTab === 'prescriptions' ? 'bg-primary-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}
        >
          Written Prescriptions ({prescriptions.length})
        </button>
      </div>

      {/* TAB CONTENT: APPOINTMENTS */}
      {activeTab === 'appointments' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {appointments.map((apt) => (
            <div key={apt.id} className="card p-5 border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="flex justify-between items-start mb-3">
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
                <p className="text-xs text-gray-500 mt-0.5">{apt.patient_age} Yrs • {apt.patient_gender}</p>

                <div className="mt-4 space-y-2 border-t border-gray-50 pt-3 text-xs text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    <span>{new Date(apt.appointment_date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    <span>{apt.appointment_slot}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-gray-400" />
                    <span className="font-medium text-gray-700">Reason:</span>
                    <span>{apt.reason || 'General health consult'}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3 border-t border-gray-50 flex gap-2">
                {apt.status === 'Pending' && (
                  <>
                    <button
                      onClick={() => updateAppointmentStatus(apt.id, 'Approved')}
                      className="flex-1 btn-primary btn-sm justify-center py-2 text-xs"
                    >
                      <Check className="w-3.5 h-3.5" /> Accept
                    </button>
                    <button
                      onClick={() => updateAppointmentStatus(apt.id, 'Rejected')}
                      className="flex-1 bg-red-50 text-red-600 hover:bg-red-100 btn-sm justify-center py-2 text-xs rounded-xl border border-red-200"
                    >
                      <X className="w-3.5 h-3.5" /> Reject
                    </button>
                  </>
                )}

                {apt.status === 'Approved' && (
                  <button
                    onClick={() => handleOpenBuilder(apt)}
                    className="w-full btn-primary btn-sm justify-center py-2 text-xs"
                  >
                    <FileText className="w-3.5 h-3.5" /> Create Prescription
                  </button>
                )}

                {apt.status === 'Completed' && (
                  <span className="w-full text-center text-xs font-bold text-green-600 bg-green-50/50 py-2 rounded-xl border border-green-200/50">
                    Consultation Completed
                  </span>
                )}
              </div>
            </div>
          ))}
          {appointments.length === 0 && (
            <div className="col-span-2 card py-12 text-center text-gray-400">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm font-semibold">No appointments scheduled</p>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: WRITTEN PRESCRIPTIONS */}
      {activeTab === 'prescriptions' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {prescriptions.map((rx) => (
            <div key={rx.id} className="card p-5 border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-mono font-bold text-primary-600">{rx.id}</span>
                  <span className="text-xs text-gray-400 font-medium">
                    {new Date(rx.date || rx.created_at).toLocaleDateString()}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-gray-800">{rx.patient_name}</h4>
                <p className="text-xs text-gray-500">{rx.patient_age} Yrs • {rx.patient_gender}</p>
                <div className="mt-3 text-xs text-gray-600 bg-gray-50 p-3 rounded-xl">
                  <span className="font-bold text-gray-700 block">Diagnosis:</span>
                  <p className="mt-0.5">{rx.diagnosis || 'General Checkup'}</p>
                </div>
                {rx.items && (
                  <p className="text-[11px] text-primary-600 font-bold mt-3">
                    📋 Contains {rx.items.length} prescribed medications
                  </p>
                )}
              </div>
              <button
                onClick={() => setSelectedRx(rx)}
                className="w-full btn-outline btn-sm justify-center py-2 text-xs mt-4 rounded-xl"
              >
                <BookOpen className="w-3.5 h-3.5" /> View Prescription Slip
              </button>
            </div>
          ))}
          {prescriptions.length === 0 && (
            <div className="col-span-2 card py-12 text-center text-gray-400">
              <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm font-semibold">No prescriptions written yet</p>
            </div>
          )}
        </div>
      )}

      {/* ============ MODAL: PRESCRIPTION BUILDER FORM ============ */}
      {showBuilder && activeAppointment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-in">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-primary-50/50">
              <div>
                <h3 className="font-black text-gray-800 text-sm">Digital Prescription Builder</h3>
                <p className="text-xs text-primary-600 mt-0.5">Patient: {activeAppointment.patient_name} ({activeAppointment.patient_age} Y/O)</p>
              </div>
              <button onClick={() => setShowBuilder(false)} className="p-2 rounded-xl text-gray-400 hover:bg-gray-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitPrescription} className="p-6 space-y-5">
              {/* Patient Profile Specs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="input-label">Symptoms</label>
                  <textarea
                    rows={2}
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    placeholder="Dry cough, low fever..."
                    className="input w-full"
                    required
                  />
                </div>
                <div>
                  <label className="input-label">Diagnosis</label>
                  <textarea
                    rows={2}
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    placeholder="Acute Bronchitis..."
                    className="input w-full"
                    required
                  />
                </div>
                <div>
                  <label className="input-label">Advice / Lifestyle remarks</label>
                  <textarea
                    rows={2}
                    value={advice}
                    onChange={(e) => setAdvice(e.target.value)}
                    placeholder="Avoid cold water, bedrest for 3 days."
                    className="input w-full"
                  />
                </div>
              </div>

              {/* Medicine Search Section */}
              <div className="border-t border-gray-100 pt-4">
                <h4 className="font-extrabold text-xs text-gray-700 uppercase tracking-wider mb-3">Add Medications from Inventory</h4>
                
                <div className="bg-gray-50 p-4 rounded-2xl space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 relative">
                    <div>
                      <label className="input-label">Search Medicine</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search e.g. Dolo, Paracetamol..."
                          value={medQuery}
                          onChange={(e) => setMedQuery(e.target.value)}
                          className="input pl-9 w-full"
                        />
                      </div>
                      
                      {/* Search Results Dropdown */}
                      {filteredMedicines.length > 0 && (
                        <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-gray-100 z-50 max-h-48 overflow-y-auto">
                          {filteredMedicines.map((med) => (
                            <div
                              key={med.id}
                              onClick={() => {
                                setSelectedMed(med);
                                setMedQuery(med.name);
                              }}
                              className="px-4 py-2 hover:bg-primary-50 cursor-pointer flex justify-between items-center text-xs"
                            >
                              <div>
                                <span className="font-bold text-gray-800">{med.name}</span>
                                <span className="text-gray-400 block text-[10px]">{med.genericName}</span>
                              </div>
                              <span className={`font-semibold px-2 py-0.5 rounded-lg ${med.stock > 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                Stock: {med.stock}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="input-label">Total Qty</label>
                        <input
                          type="number"
                          min={1}
                          value={medQty}
                          onChange={(e) => setMedQty(e.target.value)}
                          className="input w-full"
                        />
                      </div>
                      <div>
                        <label className="input-label">Dosage</label>
                        <select
                          value={medDosage}
                          onChange={(e) => setMedDosage(e.target.value)}
                          className="input w-full"
                        >
                          <option value="1-0-1">1-0-1</option>
                          <option value="1-1-1">1-1-1</option>
                          <option value="1-0-0">1-0-0</option>
                          <option value="0-0-1">0-0-1</option>
                          <option value="1-1-1-1">1-1-1-1</option>
                          <option value="SOS">SOS (As needed)</option>
                        </select>
                      </div>
                      <div>
                        <label className="input-label">Duration (Days)</label>
                        <input
                          type="number"
                          min={1}
                          value={medDuration}
                          onChange={(e) => setMedDuration(e.target.value)}
                          className="input w-full"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <div className="flex gap-2">
                      <select
                        value={medTiming}
                        onChange={(e) => setMedTiming(e.target.value)}
                        className="input text-xs"
                      >
                        <option value="After Food">After Food</option>
                        <option value="Before Food">Before Food</option>
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={addMedicineItem}
                      disabled={!selectedMed}
                      className="btn-primary btn-sm"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add to List
                    </button>
                  </div>
                </div>
              </div>

              {/* Prescribed Items List */}
              <div className="space-y-2">
                <h5 className="font-bold text-xs text-gray-700">Medications Added:</h5>
                <div className="border border-gray-100 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="p-3 font-bold text-gray-600">Medicine</th>
                        <th className="p-3 font-bold text-gray-600">Dosage</th>
                        <th className="p-3 font-bold text-gray-600">Timing</th>
                        <th className="p-3 font-bold text-gray-600">Duration</th>
                        <th className="p-3 font-bold text-gray-600">Qty</th>
                        <th className="p-3 text-right text-gray-600">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {prescriptionItems.map((item, idx) => (
                        <tr key={idx} className="border-t border-gray-50">
                          <td className="p-3 font-bold text-gray-800">{item.name}</td>
                          <td className="p-3 font-mono">{item.dosage}</td>
                          <td className="p-3">{item.timing}</td>
                          <td className="p-3">{item.duration} Days</td>
                          <td className="p-3 font-bold">{item.quantity}</td>
                          <td className="p-3 text-right">
                            <button
                              type="button"
                              onClick={() => setPrescriptionItems(prev => prev.filter((_, i) => i !== idx))}
                              className="text-red-500 hover:text-red-700 p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {prescriptionItems.length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-4 text-center text-gray-400">No medicines added yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Follow up & submit */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-100 pt-4">
                <div>
                  <label className="input-label">Follow-up Date (Optional)</label>
                  <input
                    type="date"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className="input w-full"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full btn-primary py-3 justify-center shadow-lg"
                  >
                    🚀 Sign & Complete Consultation
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Digital Slip Viewer Modal */}
      {selectedRx && (
        <PrescriptionModal rx={selectedRx} onClose={() => setSelectedRx(null)} />
      )}
    </div>
  );
}
