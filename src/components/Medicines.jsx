import React, { useContext, useState, useMemo } from 'react';
import { AppContext, getSheetDisplay } from '../context/AppContext';
import {
  Search, Plus, Pencil, Trash2, X, AlertTriangle, AlertCircle,
  Pill, Calendar, CheckCircle, Package, Layers, FileText
} from 'lucide-react';

const categories = ['Pain Relief', 'Antibiotics', 'Cardiac Care', 'Diabetes Care', 'Stomach Care', 'Respiratory', 'Vitamins', 'Cold & Immunity', 'Oral Care', 'Liver Care', 'Elderly Care'];
const dosageForms = ['Tablet', 'Capsule', 'Syrup', 'Ointment', 'Injection', 'Inhaler', 'Drops'];
const packagingTypes = ['Strip', 'Sheet', 'Bottle', 'Tube', 'Box', 'Sachet'];
const commonSheetSizes = [6, 10, 15, 20, 30];

const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);
const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

export default function Medicines() {
  const { medicines, addMedicine, updateMedicine, deleteMedicine } = useContext(AppContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formError, setFormError] = useState('');

  // Form state
  const emptyForm = {
    name: '', genericName: '', category: 'Pain Relief', dosageForm: 'Tablet',
    packaging: 'Strip', tabletsPerSheet: 10, numberOfSheets: 0, looseUnits: 0,
    stock: 0, minStock: 10, purchasePrice: '', sellingPrice: '',
    expiryDate: '', shelfLocation: ''
  };
  const [form, setForm] = useState(emptyForm);

  // Computed values
  const today = new Date();
  const soonDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

  const lowStockMeds = medicines.filter(m => m.stock <= m.minStock);
  const expiringMeds = medicines.filter(m => {
    const exp = new Date(m.expiryDate);
    return exp <= soonDate && exp > today;
  });
  const expiredMeds = medicines.filter(m => new Date(m.expiryDate) <= today);

  const filteredMedicines = useMemo(() => {
    return medicines.filter(med => {
      const matchSearch = !searchTerm || 
        med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        med.genericName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        med.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategory = !categoryFilter || med.category === categoryFilter;
      let matchStock = true;
      if (stockFilter === 'healthy') matchStock = med.stock > med.minStock;
      else if (stockFilter === 'low') matchStock = med.stock <= med.minStock && med.stock > 0;
      else if (stockFilter === 'out') matchStock = med.stock === 0;
      else if (stockFilter === 'expiring') {
        const exp = new Date(med.expiryDate);
        matchStock = exp <= soonDate && exp > today;
      }
      return matchSearch && matchCategory && matchStock;
    });
  }, [medicines, searchTerm, categoryFilter, stockFilter, today, soonDate]);

  const openAddModal = () => {
    setEditingMedicine(null);
    setForm(emptyForm);
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (med) => {
    setEditingMedicine(med);
    const sd = getSheetDisplay(med.stock, med.tabletsPerSheet, med.packaging);
    setForm({
      name: med.name, genericName: med.genericName || '', category: med.category,
      dosageForm: med.dosageForm, packaging: med.packaging || 'Strip',
      tabletsPerSheet: med.tabletsPerSheet || 10,
      numberOfSheets: sd.sheets, looseUnits: sd.loose,
      stock: med.stock, minStock: med.minStock,
      purchasePrice: med.purchasePrice, sellingPrice: med.sellingPrice,
      expiryDate: med.expiryDate || '', shelfLocation: med.shelfLocation || ''
    });
    setFormError('');
    setShowModal(true);
  };

  const handleFormChange = (field, value) => {
    setForm(prev => {
      const updated = { ...prev, [field]: value };
      // Auto-recalculate total stock when sheets or loose changes
      if (field === 'numberOfSheets' || field === 'looseUnits' || field === 'tabletsPerSheet') {
        const tps = field === 'tabletsPerSheet' ? (parseInt(value) || 1) : (parseInt(updated.tabletsPerSheet) || 1);
        const sheets = field === 'numberOfSheets' ? (parseInt(value) || 0) : (parseInt(updated.numberOfSheets) || 0);
        const loose = field === 'looseUnits' ? (parseInt(value) || 0) : (parseInt(updated.looseUnits) || 0);
        updated.stock = (sheets * tps) + loose;
      }
      return updated;
    });
  };

  const handleSubmit = () => {
    if (!form.name.trim()) { setFormError('Medicine name is required'); return; }
    if (!form.sellingPrice || parseFloat(form.sellingPrice) <= 0) { setFormError('Selling price is required'); return; }
    if (!form.expiryDate) { setFormError('Expiry date is required'); return; }

    if (editingMedicine) {
      updateMedicine(editingMedicine.id, form);
    } else {
      addMedicine(form);
    }
    setShowModal(false);
  };

  const handleDelete = (medId) => {
    deleteMedicine(medId);
    setDeleteConfirm(null);
  };

  const getStockBadge = (med) => {
    const sd = getSheetDisplay(med.stock, med.tabletsPerSheet, med.packaging);
    if (med.stock === 0) return <span className="badge badge-danger">Out of Stock</span>;
    if (med.stock <= med.minStock) return <span className="badge badge-warning">Low: {sd.display}</span>;
    return <span className="badge badge-success">{sd.display}</span>;
  };

  const getExpiryBadge = (med) => {
    const exp = new Date(med.expiryDate);
    if (exp <= today) return <span className="badge badge-danger">EXPIRED</span>;
    if (exp <= soonDate) {
      const daysLeft = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
      return <span className="badge badge-warning">{daysLeft}d left</span>;
    }
    return <span className="text-xs text-gray-500">{formatDate(med.expiryDate)}</span>;
  };

  // Calculate total stock for the form preview
  const formTotalStock = (parseInt(form.numberOfSheets) || 0) * (parseInt(form.tabletsPerSheet) || 1) + (parseInt(form.looseUnits) || 0);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* ===== HEADER ===== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Medicine Inventory</h1>
          <p className="text-sm text-gray-400">{medicines.length} medicines • {lowStockMeds.length} low stock</p>
        </div>
        <button onClick={openAddModal} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Medicine
        </button>
      </div>

      {/* ===== ALERTS ===== */}
      {lowStockMeds.length > 0 && (
        <div className="alert-warning">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <span className="text-sm"><strong>{lowStockMeds.length} medicine(s)</strong> below minimum stock level.</span>
        </div>
      )}
      {expiringMeds.length > 0 && (
        <div className="alert-danger">
          <Calendar className="w-5 h-5 text-red-600 shrink-0" />
          <span className="text-sm"><strong>{expiringMeds.length} medicine(s)</strong> expiring within 30 days.</span>
        </div>
      )}

      {/* ===== FILTERS ===== */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search by name, generic, or code..." value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)} className="input pl-10" />
        </div>
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="select-field w-full sm:w-48">
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={stockFilter} onChange={e => setStockFilter(e.target.value)} className="select-field w-full sm:w-44">
          <option value="">All Status</option>
          <option value="healthy">In Stock</option>
          <option value="low">Low Stock</option>
          <option value="out">Out of Stock</option>
          <option value="expiring">Expiring Soon</option>
        </select>
      </div>

      {/* ===== TABLE ===== */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header text-left">
                <th>Code</th>
                <th>Medicine</th>
                <th>Category</th>
                <th>Packaging</th>
                <th>Stock (Sheets)</th>
                <th>Expiry</th>
                <th>Price (₹/unit)</th>
                <th>MRP (₹/unit)</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMedicines.map(med => (
                <tr key={med.id} className="table-row">
                  <td className="font-mono text-xs font-semibold text-primary-600">{med.id}</td>
                  <td>
                    <p className="text-sm font-semibold text-gray-800">{med.name}</p>
                    <p className="text-xs text-gray-400">{med.genericName}</p>
                  </td>
                  <td><span className="badge badge-info">{med.category}</span></td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-xs text-gray-600">
                        {med.packaging || 'Strip'} of {med.tabletsPerSheet || 10}
                      </span>
                    </div>
                  </td>
                  <td>
                    {getStockBadge(med)}
                    <p className="text-[10px] text-gray-400 mt-0.5">{med.stock} total units</p>
                  </td>
                  <td>{getExpiryBadge(med)}</td>
                  <td className="text-sm text-gray-600">{formatCurrency(med.purchasePrice)}</td>
                  <td className="text-sm font-semibold text-gray-800">{formatCurrency(med.sellingPrice)}</td>
                  <td>
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => openEditModal(med)}
                        className="p-2 rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteConfirm(med)}
                        className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredMedicines.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-16 text-center">
                    <Pill className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-gray-500">No medicines found</p>
                    <p className="text-xs text-gray-400">Try different filters or add a new medicine</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span>Showing {filteredMedicines.length} of {medicines.length} medicines</span>
          <span className="flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-green-500" />
            {medicines.filter(m => m.stock > m.minStock).length} healthy
          </span>
        </div>
      </div>

      {/* ===== ADD/EDIT MODAL ===== */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-container w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                <Pill className="w-5 h-5 text-primary-600" />
                {editingMedicine ? 'Edit Medicine' : 'Add New Medicine'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg text-gray-400 hover:bg-gray-100"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-5">
              {formError && (
                <div className="alert-danger">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span className="text-sm">{formError}</span>
                </div>
              )}

              {/* Medicine Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Medicine Name *</label>
                  <input type="text" className="input" placeholder="e.g. Paracetamol 650mg"
                    value={form.name} onChange={e => handleFormChange('name', e.target.value)} />
                </div>
                <div>
                  <label className="input-label">Generic Name</label>
                  <input type="text" className="input" placeholder="e.g. Acetaminophen"
                    value={form.genericName} onChange={e => handleFormChange('genericName', e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="input-label">Category</label>
                  <select className="select-field" value={form.category} onChange={e => handleFormChange('category', e.target.value)}>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="input-label">Dosage Form</label>
                  <select className="select-field" value={form.dosageForm} onChange={e => handleFormChange('dosageForm', e.target.value)}>
                    {dosageForms.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="input-label">Shelf Location</label>
                  <input type="text" className="input" placeholder="e.g. A-01"
                    value={form.shelfLocation} onChange={e => handleFormChange('shelfLocation', e.target.value)} />
                </div>
              </div>

              {/* ===== SHEET / PACKAGING SECTION (Highlighted) ===== */}
              <div className="bg-primary-50/50 border border-primary-100 rounded-2xl p-5 space-y-4">
                <h4 className="text-sm font-bold text-primary-700 flex items-center gap-2">
                  <Layers className="w-4 h-4" /> Packaging & Stock (Sheet-wise Entry)
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="input-label">Packaging Type</label>
                    <select className="select-field" value={form.packaging} onChange={e => handleFormChange('packaging', e.target.value)}>
                      {packagingTypes.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="input-label">Tablets per {form.packaging}</label>
                    <div className="flex gap-2">
                      <select className="select-field" value={form.tabletsPerSheet}
                        onChange={e => handleFormChange('tabletsPerSheet', e.target.value)}>
                        {commonSheetSizes.map(s => <option key={s} value={s}>{s}</option>)}
                        <option value="custom">Custom</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="input-label">Number of {form.packaging}s</label>
                    <input type="number" min="0" className="input" placeholder="0"
                      value={form.numberOfSheets} onChange={e => handleFormChange('numberOfSheets', e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="input-label">Loose Tablets (extra)</label>
                    <input type="number" min="0" className="input" placeholder="0"
                      value={form.looseUnits} onChange={e => handleFormChange('looseUnits', e.target.value)} />
                  </div>
                  <div>
                    <label className="input-label">Min. Stock (Units)</label>
                    <input type="number" min="0" className="input" placeholder="10"
                      value={form.minStock} onChange={e => handleFormChange('minStock', e.target.value)} />
                  </div>
                </div>
                {/* Stock Preview */}
                <div className="bg-white rounded-xl p-4 border border-primary-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                      <Package className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Total Stock Preview</p>
                      <p className="text-lg font-bold text-primary-700">
                        {getSheetDisplay(formTotalStock, parseInt(form.tabletsPerSheet) || 1, form.packaging).display}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-800">{formTotalStock}</p>
                    <p className="text-xs text-gray-400">total units</p>
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="input-label">Purchase Price (₹ per unit)</label>
                  <input type="number" step="0.01" min="0" className="input" placeholder="0.00"
                    value={form.purchasePrice} onChange={e => handleFormChange('purchasePrice', e.target.value)} />
                </div>
                <div>
                  <label className="input-label">Selling Price / MRP (₹ per unit) *</label>
                  <input type="number" step="0.01" min="0" className="input" placeholder="0.00"
                    value={form.sellingPrice} onChange={e => handleFormChange('sellingPrice', e.target.value)} />
                </div>
                <div>
                  <label className="input-label">Expiry Date *</label>
                  <input type="date" className="input"
                    value={form.expiryDate} onChange={e => handleFormChange('expiryDate', e.target.value)} />
                </div>
              </div>

              {/* Margin Preview */}
              {form.purchasePrice && form.sellingPrice && (
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-400">Margin:</span>
                  <span className={`font-bold ${(form.sellingPrice - form.purchasePrice) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(form.sellingPrice - form.purchasePrice)} / unit
                    ({((form.sellingPrice - form.purchasePrice) / form.purchasePrice * 100).toFixed(1)}%)
                  </span>
                </div>
              )}
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="btn-outline">Cancel</button>
              <button onClick={handleSubmit} className="btn-primary">
                <CheckCircle className="w-4 h-4" />
                {editingMedicine ? 'Update Medicine' : 'Add Medicine'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== DELETE CONFIRM MODAL ===== */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-container w-full max-w-sm p-6 text-center" onClick={e => e.stopPropagation()}>
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-7 h-7 text-red-500" />
            </div>
            <h3 className="text-base font-bold text-gray-800 mb-1">Delete Medicine?</h3>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to delete <strong>{deleteConfirm.name}</strong>? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="btn-outline flex-1">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm.id)} className="btn flex-1 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
