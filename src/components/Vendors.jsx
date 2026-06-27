import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import {
  Users,
  Plus,
  Mail,
  Phone,
  MapPin,
  Search,
  AlertCircle,
  CheckCircle,
  UserPlus,
  ShieldAlert,
  MessageSquare,
  IndianRupee,
  Truck,
} from 'lucide-react';

const formatCurrency = (val) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);
};

export default function Vendors() {
  const { vendors, addVendor, sendVendorDueReminder, addNotification } = useContext(AppContext);

  const [search, setSearch] = useState('');
  const [alert, setAlert] = useState({ type: '', message: '' });

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    contact: '',
    email: '',
    address: '',
    itemsSupplied: '',
    dueAmount: '0',
  });
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Filter vendors
  const filteredVendors = vendors.filter((v) => {
    const q = search.toLowerCase();
    return (
      v.name.toLowerCase().includes(q) ||
      v.contactPerson.toLowerCase().includes(q) ||
      v.id.toLowerCase().includes(q) ||
      v.email.toLowerCase().includes(q)
    );
  });

  // Handle reminder click
  const handleSendReminder = (vendorId) => {
    sendVendorDueReminder(vendorId);
    const vendor = vendors.find((v) => v.id === vendorId);
    setAlert({
      type: 'success',
      message: `Payment reminder SMS sent to ${vendor?.contactPerson || 'vendor'} (${vendor?.contact}).`,
    });
    setTimeout(() => setAlert({ type: '', message: '' }), 4000);
  };

  // Handle form submit
  const handleFormSubmit = (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!formData.name.trim() || !formData.contactPerson.trim() || !formData.contact.trim()) {
      setFormError('Company Name, Contact Person, and Phone are required.');
      return;
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setFormError('Please enter a valid email address.');
      return;
    }

    const result = addVendor({
      name: formData.name.trim(),
      contactPerson: formData.contactPerson.trim(),
      contact: formData.contact.trim(),
      email: formData.email.trim(),
      address: formData.address.trim(),
      itemsSupplied: formData.itemsSupplied.trim(),
      dueAmount: parseFloat(formData.dueAmount) || 0,
    });

    if (result) {
      setFormSuccess(`Vendor "${result.name}" registered as ${result.id}.`);
      addNotification(`🚚 New vendor registered: ${result.name} (${result.id})`, 'success');

      // Reset form
      setFormData({
        name: '',
        contactPerson: '',
        contact: '',
        email: '',
        address: '',
        itemsSupplied: '',
        dueAmount: '0',
      });
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Alert */}
      {alert.message && (
        <div className={alert.type === 'success' ? 'alert-success' : 'alert-warning'}>
          {alert.type === 'success' ? (
            <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          )}
          <span>{alert.message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ========== LEFT: VENDOR DIRECTORY (8 cols) ========== */}
        <div className="lg:col-span-8 space-y-0">
          <div className="card p-0 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-800">Vendor Directory</h2>
                  <p className="text-[11px] text-gray-400 font-medium">
                    Manage your registered suppliers
                  </p>
                </div>
              </div>

              {/* Search */}
              <div className="relative w-full sm:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="Search vendors..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input !pl-9 !py-2"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="table-header">
                    <th>Code</th>
                    <th>Company / Contact</th>
                    <th>Phone</th>
                    <th>Email</th>
                    <th>Items Supplied</th>
                    <th>Due Amount</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVendors.length > 0 ? (
                    filteredVendors.map((v) => (
                      <tr key={v.id} className="table-row">
                        <td className="font-mono font-bold text-gray-800 text-xs">{v.id}</td>
                        <td>
                          <div className="font-semibold text-gray-800">{v.name}</div>
                          <div className="text-[11px] text-gray-400 flex items-center gap-1">
                            <UserPlus className="w-3 h-3" />
                            {v.contactPerson}
                          </div>
                        </td>
                        <td>
                          <div className="flex items-center gap-1.5 text-xs text-gray-600">
                            <Phone className="w-3 h-3 text-gray-400" />
                            {v.contact}
                          </div>
                        </td>
                        <td>
                          <div className="flex items-center gap-1.5 text-xs text-gray-600">
                            <Mail className="w-3 h-3 text-gray-400" />
                            {v.email || '—'}
                          </div>
                        </td>
                        <td>
                          <span className="text-xs text-gray-500">{v.itemsSupplied || '—'}</span>
                        </td>
                        <td>
                          {v.dueAmount > 0 ? (
                            <span className="font-mono font-bold text-red-600 flex items-center gap-1">
                              <IndianRupee className="w-3 h-3" />
                              {v.dueAmount.toLocaleString('en-IN', {
                                minimumFractionDigits: 2,
                              })}
                            </span>
                          ) : (
                            <span className="badge-success">Clear</span>
                          )}
                        </td>
                        <td>
                          <span
                            className={
                              v.status === 'active' ? 'badge-success' : 'badge-neutral'
                            }
                          >
                            {v.status}
                          </span>
                        </td>
                        <td className="text-right">
                          {v.dueAmount > 0 && (
                            <button
                              onClick={() => handleSendReminder(v.id)}
                              className="btn-accent btn-sm"
                              title="Send payment reminder SMS"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span className="hidden xl:inline">Remind</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="py-12 text-center">
                        <div className="flex flex-col items-center gap-2 text-gray-400">
                          <Truck className="w-8 h-8 text-gray-300" />
                          <p className="text-xs font-semibold">No vendors found.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="bg-gray-50 border-t border-gray-100 px-6 py-3 flex items-center justify-between text-xs text-gray-500 font-medium">
              <span>
                Showing {filteredVendors.length} of {vendors.length} vendor(s)
              </span>
              <span>
                Total Outstanding:{' '}
                <span className="font-bold text-red-600">
                  {formatCurrency(vendors.reduce((sum, v) => sum + (v.dueAmount || 0), 0))}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* ========== RIGHT: REGISTER VENDOR FORM (4 cols) ========== */}
        <div className="lg:col-span-4">
          <div className="card p-0 overflow-hidden sticky top-6">
            {/* Card Header */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-accent-50 flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-accent-600" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-800">Register Vendor</h2>
                <p className="text-[11px] text-gray-400 font-medium">Add a new supplier</p>
              </div>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              {/* Alerts */}
              {formError && (
                <div className="alert-danger">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}
              {formSuccess && (
                <div className="alert-success">
                  <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{formSuccess}</span>
                </div>
              )}

              {/* Company Name */}
              <div>
                <label className="input-label">Company Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Metro Pharma Distributors"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  required
                />
              </div>

              {/* Contact Person */}
              <div>
                <label className="input-label">Contact Person *</label>
                <input
                  type="text"
                  placeholder="e.g. Alex Mercer"
                  value={formData.contactPerson}
                  onChange={(e) =>
                    setFormData({ ...formData, contactPerson: e.target.value })
                  }
                  className="input"
                  required
                />
              </div>

              {/* Phone */}
              <div>
                <label className="input-label">Phone *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={formData.contact}
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                    className="input !pl-9"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="input-label">Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    placeholder="vendor@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input !pl-9"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="input-label">Address</label>
                <div className="relative">
                  <div className="absolute top-3 left-3 pointer-events-none text-gray-400">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <textarea
                    rows={2}
                    placeholder="Full address..."
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="input !pl-9 resize-none"
                  />
                </div>
              </div>

              {/* Items Supplied */}
              <div>
                <label className="input-label">Items Supplied</label>
                <input
                  type="text"
                  placeholder="e.g. Antibiotics, Pain Relief"
                  value={formData.itemsSupplied}
                  onChange={(e) =>
                    setFormData({ ...formData, itemsSupplied: e.target.value })
                  }
                  className="input"
                />
              </div>

              {/* Initial Due Amount */}
              <div>
                <label className="input-label">Initial Due Amount (₹)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <IndianRupee className="w-4 h-4" />
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.dueAmount}
                    onChange={(e) =>
                      setFormData({ ...formData, dueAmount: e.target.value })
                    }
                    className="input !pl-9"
                  />
                </div>
              </div>

              {/* Submit */}
              <button type="submit" className="btn-primary w-full">
                <Truck className="w-4 h-4" />
                Register Supplier
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
