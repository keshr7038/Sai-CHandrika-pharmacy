import React, { useRef } from 'react';
import { X, Printer, Download, Pill, Activity } from 'lucide-react';

export default function PrescriptionModal({ rx, onClose }) {
  const printRef = useRef(null);

  if (!rx) return null;

  const handlePrint = () => {
    const printContent = printRef.current.innerHTML;
    const originalContent = document.body.innerHTML;
    
    // Simple custom print window trigger
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Prescription_${rx.id}</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #1f2937; }
            .header { display: flex; justify-between: space-between; border-bottom: 2px solid #10b981; padding-bottom: 20px; margin-bottom: 20px; }
            .title { font-size: 24px; font-weight: bold; color: #047857; }
            .details { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 30px; font-size: 14px; }
            .details-item { margin-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th { border-bottom: 2px solid #e5e7eb; text-align: left; padding: 10px; font-size: 13px; color: #4b5563; }
            td { border-bottom: 1px solid #f3f4f6; padding: 12px 10px; font-size: 14px; }
            .section-title { font-weight: bold; font-size: 14px; color: #047857; margin-bottom: 8px; margin-top: 20px; border-left: 3px solid #10b981; padding-left: 8px; }
            .footer { margin-top: 50px; display: flex; justify-content: space-between; align-items: flex-end; font-size: 13px; }
            .signature { border-top: 1px solid #d1d5db; padding-top: 5px; width: 180px; text-align: center; font-style: italic; }
          </style>
        </head>
        <body>
          ${printContent}
          <script>
            window.onload = function() {
              window.print();
              window.close();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl animate-scale-in">
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-primary-50/50">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary-600" />
            <span className="font-extrabold text-gray-800">Digital Prescription</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button 
              onClick={handlePrint}
              className="p-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
              title="Print Prescription"
            >
              <Printer className="w-4.5 h-4.5" />
            </button>
            <button 
              onClick={onClose}
              className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

        {/* Printable View wrapper */}
        <div className="p-6 md:p-8" ref={printRef}>
          {/* Clinic Header */}
          <div className="flex justify-between items-start border-b-2 border-primary-500 pb-5 mb-6">
            <div>
              <h2 className="text-xl font-black text-primary-700 tracking-tight">SAI CHANDRIKA CLINIC</h2>
              <p className="text-xs text-gray-500 font-medium">Digital Health & Family Care Centre</p>
              <p className="text-[10px] text-gray-400">Hyderabad, Telangana - 500012 | Contact: +91 9876543210</p>
            </div>
            <div className="text-right">
              <h3 className="font-bold text-gray-800 text-sm">Dr. Ramesh Kumar, MD</h3>
              <p className="text-xs text-primary-600 font-semibold">General Physician</p>
              <p className="text-[10px] text-gray-400">Reg No: AP-48590</p>
            </div>
          </div>

          {/* Patient Details */}
          <div className="bg-gray-50/60 rounded-2xl p-4 grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-xs">
            <div>
              <span className="text-gray-400 font-medium block">Patient Name</span>
              <span className="font-bold text-gray-800 block mt-0.5">{rx.patient_name}</span>
            </div>
            <div>
              <span className="text-gray-400 font-medium block">Age / Gender</span>
              <span className="font-bold text-gray-800 block mt-0.5">{rx.patient_age} Yrs / {rx.patient_gender}</span>
            </div>
            <div>
              <span className="text-gray-400 font-medium block">Prescription ID</span>
              <span className="font-bold text-primary-600 font-mono block mt-0.5">{rx.id}</span>
            </div>
            <div>
              <span className="text-gray-400 font-medium block">Date</span>
              <span className="font-bold text-gray-800 block mt-0.5">{new Date(rx.date || rx.created_at).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Symptoms & Diagnosis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h4 className="font-bold text-xs text-primary-700 uppercase tracking-wider border-l-2 border-primary-500 pl-2 mb-2">Symptoms</h4>
              <p className="text-sm text-gray-700 bg-gray-50/40 p-3 rounded-xl min-h-[50px]">{rx.symptoms || 'None reported'}</p>
            </div>
            <div>
              <h4 className="font-bold text-xs text-primary-700 uppercase tracking-wider border-l-2 border-primary-500 pl-2 mb-2">Diagnosis</h4>
              <p className="text-sm text-gray-700 bg-gray-50/40 p-3 rounded-xl min-h-[50px]">{rx.diagnosis || 'General Checkup'}</p>
            </div>
          </div>

          {/* Rx Icon Indicator */}
          <div className="flex items-center gap-1.5 mb-3">
            <span className="text-lg font-black text-primary-600">Rₓ</span>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Prescribed Medicines</span>
          </div>

          {/* Medicines Table */}
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80">
                  <th className="p-3 text-[11px] font-bold text-gray-500 rounded-l-xl">Medicine Name</th>
                  <th className="p-3 text-[11px] font-bold text-gray-500">Dosage</th>
                  <th className="p-3 text-[11px] font-bold text-gray-500">Timing</th>
                  <th className="p-3 text-[11px] font-bold text-gray-500">Duration</th>
                  <th className="p-3 text-[11px] font-bold text-gray-500 rounded-r-xl text-right">Qty</th>
                </tr>
              </thead>
              <tbody>
                {rx.items && rx.items.map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-gray-50/40 transition-colors">
                    <td className="p-3 font-semibold text-gray-800 text-sm">{item.name}</td>
                    <td className="p-3 text-gray-700 text-xs font-mono">{item.dosage}</td>
                    <td className="p-3 text-gray-700 text-xs">{item.timing}</td>
                    <td className="p-3 text-gray-700 text-xs">{item.duration} Days</td>
                    <td className="p-3 text-gray-800 text-xs text-right font-bold">{item.quantity}</td>
                  </tr>
                ))}
                {(!rx.items || rx.items.length === 0) && (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-xs text-gray-400">No medicines prescribed.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Advice & Remarks */}
          <div className="mb-8">
            <h4 className="font-bold text-xs text-primary-700 uppercase tracking-wider border-l-2 border-primary-500 pl-2 mb-2">Advice & Special Instructions</h4>
            <p className="text-sm text-gray-700 bg-gray-50/40 p-3 rounded-xl min-h-[50px]">{rx.advice || 'Take ample rest, stay hydrated.'}</p>
          </div>

          {/* Footer & Signature */}
          <div className="flex justify-between items-end pt-6 border-t border-gray-100 text-xs">
            <div>
              {rx.follow_up_date && (
                <p className="font-semibold text-primary-600">
                  🗓️ Follow-up Date: {new Date(rx.follow_up_date).toLocaleDateString()}
                </p>
              )}
            </div>
            <div className="text-right flex flex-col items-end">
              <span className="text-[10px] text-gray-400 mb-1">Doctor's Signature</span>
              <div className="signature font-serif text-sm font-bold text-primary-700 border-t border-gray-300 pt-1 w-44 text-center">
                {rx.doctor_signature || 'Dr. Ramesh Kumar'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
