import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { Plus, Trash2, CheckCircle, AlertTriangle, Package, ShoppingBag, ArrowUpRight } from 'lucide-react';

const formatCurrency = (val) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);
};

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export default function Purchases() {
  const { medicines, vendors, purchases, addPurchase, addNotification } = useContext(AppContext);

  const [selectedVendor, setSelectedVendor] = useState('');
  const [items, setItems] = useState([
    { medicineId: '', quantity: '', purchasePrice: '' },
  ]);
  const [alert, setAlert] = useState({ type: '', message: '' });

  // Add a new empty row
  const handleAddItem = () => {
    setItems([...items, { medicineId: '', quantity: '', purchasePrice: '' }]);
  };

  // Remove a row
  const handleRemoveItem = (index) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  // Update a field in a row
  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };

    // Auto-populate price when medicine is selected
    if (field === 'medicineId' && value) {
      const med = medicines.find((m) => m.id === value);
      if (med) {
        updated[index].purchasePrice = med.purchasePrice.toString();
      }
    }

    setItems(updated);
  };

  // Calculate row subtotal
  const getRowTotal = (item) => {
    const qty = parseInt(item.quantity) || 0;
    const price = parseFloat(item.purchasePrice) || 0;
    return qty * price;
  };

  // Grand total
  const grandTotal = items.reduce((sum, item) => sum + getRowTotal(item), 0);

  // Submit voucher
  const handleSubmit = () => {
    setAlert({ type: '', message: '' });

    if (!selectedVendor) {
      setAlert({ type: 'error', message: 'Please select a vendor before posting.' });
      return;
    }

    const validItems = items.filter(
      (item) =>
        item.medicineId &&
        parseInt(item.quantity) > 0 &&
        parseFloat(item.purchasePrice) > 0
    );

    if (validItems.length === 0) {
      setAlert({
        type: 'error',
        message: 'Please add at least one valid item with quantity and price.',
      });
      return;
    }

    const result = addPurchase(selectedVendor, validItems);

    if (result) {
      setAlert({
        type: 'success',
        message: `Purchase voucher ${result.id} posted successfully! Stock updated for ${validItems.length} item(s).`,
      });
      addNotification(
        `📦 New purchase ${result.id} from ${result.vendorName} — ${formatCurrency(result.total)}`,
        'success'
      );

      // Reset form
      setSelectedVendor('');
      setItems([{ medicineId: '', quantity: '', purchasePrice: '' }]);
    } else {
      setAlert({
        type: 'error',
        message: 'Failed to post purchase voucher. Please check form data.',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* ========== NEW PURCHASE VOUCHER ========== */}
      <div className="card p-0 overflow-hidden">
        {/* Card Header */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center">
            <Package className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-800">New Purchase Inward Voucher</h2>
            <p className="text-[11px] text-gray-400 font-medium">
              Record incoming stock from suppliers
            </p>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Alert Messages */}
          {alert.message && (
            <div
              className={
                alert.type === 'success' ? 'alert-success' : 'alert-danger'
              }
            >
              {alert.type === 'success' ? (
                <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <span>{alert.message}</span>
            </div>
          )}

          {/* Vendor Selection */}
          <div>
            <label className="input-label">Select Vendor / Supplier</label>
            <select
              value={selectedVendor}
              onChange={(e) => setSelectedVendor(e.target.value)}
              className="select-field"
            >
              <option value="">— Choose a vendor —</option>
              {vendors
                .filter((v) => v.status === 'active')
                .map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.id})
                  </option>
                ))}
            </select>
          </div>

          {/* Dynamic Item Rows */}
          <div className="space-y-3">
            <label className="input-label">Purchase Items</label>

            {/* Column headers */}
            <div className="hidden md:grid grid-cols-12 gap-3 px-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
              <div className="col-span-4">Medicine</div>
              <div className="col-span-2">Quantity</div>
              <div className="col-span-2">Unit Price (₹)</div>
              <div className="col-span-2">Row Total</div>
              <div className="col-span-2 text-right">Action</div>
            </div>

            {items.map((item, index) => (
              <div
                key={index}
                className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center p-3 rounded-xl bg-gray-50/60 border border-gray-100"
              >
                {/* Medicine dropdown */}
                <div className="md:col-span-4">
                  <select
                    value={item.medicineId}
                    onChange={(e) =>
                      handleItemChange(index, 'medicineId', e.target.value)
                    }
                    className="select-field !py-2.5 text-xs"
                  >
                    <option value="">Select medicine</option>
                    {medicines.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.id})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quantity */}
                <div className="md:col-span-2">
                  <input
                    type="number"
                    min="1"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) =>
                      handleItemChange(index, 'quantity', e.target.value)
                    }
                    className="input !py-2.5 text-xs"
                  />
                </div>

                {/* Unit Price */}
                <div className="md:col-span-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={item.purchasePrice}
                    onChange={(e) =>
                      handleItemChange(index, 'purchasePrice', e.target.value)
                    }
                    className="input !py-2.5 text-xs"
                  />
                </div>

                {/* Row Total */}
                <div className="md:col-span-2">
                  <div className="px-3 py-2.5 rounded-xl bg-white border border-gray-200 text-xs font-bold text-gray-700">
                    {formatCurrency(getRowTotal(item))}
                  </div>
                </div>

                {/* Remove Button */}
                <div className="md:col-span-2 flex justify-end">
                  <button
                    onClick={() => handleRemoveItem(index)}
                    disabled={items.length === 1}
                    className="btn-ghost btn-sm text-red-500 hover:text-red-700 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {/* Add Item Button */}
            <button
              onClick={handleAddItem}
              className="btn-outline btn-sm w-full border-dashed !border-2 !text-gray-400 hover:!text-primary-600 hover:!border-primary-300"
            >
              <Plus className="w-4 h-4" />
              <span>Add Item</span>
            </button>
          </div>

          {/* Grand Total & Submit */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Grand Total
              </span>
              <span className="text-2xl font-extrabold text-primary-600">
                {formatCurrency(grandTotal)}
              </span>
            </div>
            <button onClick={handleSubmit} className="btn-primary btn-lg tracking-wider">
              <ShoppingBag className="w-4 h-4" />
              POST PURCHASE VOUCHER
            </button>
          </div>
        </div>
      </div>

      {/* ========== PURCHASE HISTORY TABLE ========== */}
      <div className="card p-0 overflow-hidden">
        {/* Card Header */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent-50 flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5 text-accent-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-800">Purchase History</h2>
              <p className="text-[11px] text-gray-400 font-medium">
                All recorded inward vouchers
              </p>
            </div>
          </div>
          <span className="badge-info">{purchases.length} Records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="table-header">
                <th>PO Number</th>
                <th>Date</th>
                <th>Vendor</th>
                <th>Items</th>
                <th className="text-right">Cost</th>
              </tr>
            </thead>
            <tbody>
              {purchases.length > 0 ? (
                purchases.map((po) => (
                  <tr key={po.id} className="table-row">
                    <td className="font-mono font-bold text-gray-800">{po.id}</td>
                    <td>{formatDate(po.date)}</td>
                    <td>
                      <div className="font-semibold text-gray-800">{po.vendorName}</div>
                      <div className="text-[11px] text-gray-400">{po.vendorId}</div>
                    </td>
                    <td>
                      <div className="space-y-0.5">
                        {po.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="text-xs text-gray-500"
                          >
                            {item.name}{' '}
                            <span className="font-semibold text-gray-700">
                              ×{item.quantity}
                            </span>{' '}
                            @ {formatCurrency(item.purchasePrice)}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="text-right font-mono font-bold text-gray-800">
                      {formatCurrency(po.total)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <Package className="w-8 h-8 text-gray-300" />
                      <p className="text-xs font-semibold">No purchase records yet.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="bg-gray-50 border-t border-gray-100 px-6 py-3 flex items-center justify-between text-xs text-gray-500 font-medium">
          <span>Showing {purchases.length} purchase order(s)</span>
          <span>
            Total Invested:{' '}
            <span className="font-bold text-gray-800">
              {formatCurrency(purchases.reduce((sum, p) => sum + p.total, 0))}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
