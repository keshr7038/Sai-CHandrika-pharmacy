import React, { useState, useContext, useMemo } from 'react';
import { AppContext, getSheetDisplay } from '../context/AppContext';
import InvoiceModal from './InvoiceModal';
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Receipt,
  CreditCard,
  Wallet,
  Smartphone,
  Pill,
  Loader,
  QrCode,
} from 'lucide-react';

const CATEGORIES = [
  'All',
  'Pain Relief',
  'Antibiotics',
  'Cardiac Care',
  'Diabetes Care',
  'Stomach Care',
  'Cold & Immunity',
  'Vitamins',
  'Respiratory',
];

const DOSAGE_COLORS = {
  Tablet: 'bg-blue-50 text-blue-700 border-blue-200',
  Capsule: 'bg-purple-50 text-purple-700 border-purple-200',
  Syrup: 'bg-amber-50 text-amber-700 border-amber-200',
  Injection: 'bg-red-50 text-red-700 border-red-200',
  Cream: 'bg-pink-50 text-pink-700 border-pink-200',
  Drops: 'bg-teal-50 text-teal-700 border-teal-200',
};

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function Sales() {
  const {
    user,
    medicines,
    cart,
    sales,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    generateBill,
    markPaymentSuccess,
    cancelPendingSale,
  } = useContext(AppContext);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [taxPercent, setTaxPercent] = useState(8);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [invoiceData, setInvoiceData] = useState(null);

  // Razorpay Payment States
  const [paymentStatus, setPaymentStatus] = useState('none'); // 'none' | 'initiating' | 'paying' | 'verifying' | 'success' | 'failed'
  const [paymentError, setPaymentError] = useState('');
  const [paymentSaleId, setPaymentSaleId] = useState('');
  const [utrValue, setUtrValue] = useState('');
  const [isMockPayment, setIsMockPayment] = useState(false);
  const [mockOrderData, setMockOrderData] = useState(null);
  const [mockTxn, setMockTxn] = useState(null);

  // Filter medicines
  const filteredMedicines = useMemo(() => {
    return medicines.filter((med) => {
      const matchesSearch =
        med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        med.genericName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        activeCategory === 'All' || med.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [medicines, searchQuery, activeCategory]);

  // Cart calculations
  const cartSubtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.sellingPrice * item.quantity, 0),
    [cart]
  );
  const discountAmount = (cartSubtotal * discountPercent) / 100;
  const taxableAmount = cartSubtotal - discountAmount;
  const taxAmount = (taxableAmount * taxPercent) / 100;
  const grandTotal = taxableAmount + taxAmount;

  const getCartQty = (medId) => {
    const item = cart.find((c) => c.medicineId === medId);
    return item ? item.quantity : 0;
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    
    // For Owners/Staff, run traditional synchronous (awaited) bill generation
    if (user?.role !== 'customer') {
      try {
        const txn = await generateBill(
          paymentMethod,
          discountPercent,
          taxPercent,
          customerName,
          customerPhone
        );
        if (txn) {
          setInvoiceData(txn);
          setCustomerName('');
          setCustomerPhone('');
          setDiscountPercent(0);
        }
      } catch (err) {
        console.error("Owner checkout error:", err);
      }
      return;
    }

    // For Customers, initiate Direct QR Payment Flow
    setPaymentStatus('initiating');
    setPaymentError('');
    setIsMockPayment(true);
    setUtrValue('');
    
    try {
      // 1. Create a Pending Sale record in Supabase to allocate order number and hold items
      const txn = await generateBill(
        'UPI', // Direct UPI payment
        discountPercent,
        taxPercent,
        user.name,
        user.phone
      );

      if (!txn) {
        throw new Error('Failed to create pending checkout record in database.');
      }

      setPaymentSaleId(txn.id);
      setMockTxn(txn);

      // Create a mock order data directly for verification
      const mockOrder = {
        success: true,
        order_id: `order_mock_${txn.id}_${Date.now()}`,
        amount: Math.round(txn.total * 100),
        currency: 'INR',
        is_mock: true
      };

      setMockOrderData(mockOrder);
      setPaymentStatus('paying');

    } catch (err) {
      console.error('Direct QR checkout initiation failed:', err);
      setPaymentStatus('failed');
      setPaymentError(err.message || 'Payment initiation failed.');
    }
  };

  const handleVerifyMockPayment = async () => {
    if (!/^\d{12}$/.test(utrValue)) {
      alert('Please enter a valid 12-digit UPI UTR / Transaction Ref No.');
      return;
    }

    setPaymentStatus('verifying');
    const apiBase = window.location.hostname === 'localhost' ? 'http://localhost:5000' : '';

    try {
      const verifyRes = await fetch(`${apiBase}/api/payments/verify-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: mockOrderData.order_id,
          payment_id: `pay_${utrValue}`,
          signature: 'mock_signature',
          user_id: user.id,
          sale_id: mockTxn.id,
          amount: mockOrderData.amount
        })
      });

      const verifyData = await verifyRes.json();

      if (verifyRes.ok && verifyData.success) {
        if (typeof markPaymentSuccess === 'function') {
          await markPaymentSuccess(mockTxn.id);
        }
        setInvoiceData({ ...mockTxn, paymentStatus: 'Success' });
        setPaymentStatus('none');
      } else {
        throw new Error(verifyData.error || 'Mock payment verification failed.');
      }
    } catch (err) {
      console.error('Verification error:', err);
      setPaymentStatus('failed');
    }
  };

  const handleCancelOrFailedPayment = async () => {
    if (paymentSaleId) {
      try {
        await cancelPendingSale(paymentSaleId);
      } catch (err) {
        console.error('Failed to cancel pending sale:', err);
      }
    }
    setPaymentStatus('failed');
    setPaymentError('Payment cancelled.');
  };

  const handleCloseFailedPayment = async () => {
    if (paymentSaleId) {
      try {
        await cancelPendingSale(paymentSaleId);
      } catch (err) {
        console.error('Failed to cancel pending sale:', err);
      }
    }
    setPaymentStatus('none');
    setPaymentSaleId('');
  };

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Receipt className="w-7 h-7 text-primary-600" />
            POS Billing Terminal
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Search medicines, build cart, and generate invoices
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge-info">
            <Pill className="w-3 h-3 mr-1" />
            {medicines.length} Products
          </span>
        </div>
      </div>

      {/* Two-Column Layout */}
      <div className="grid grid-cols-12 gap-6">
        {/* ============ LEFT PANEL - MEDICINE CATALOG ============ */}
        <div className="col-span-12 lg:col-span-8">
          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search medicines by name or generic name..."
              className="input pl-11"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Category Filter Tabs */}
          <div className="flex gap-2 mb-5 overflow-x-auto pb-2 scrollbar-thin">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`whitespace-nowrap px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-200 cursor-pointer ${
                  activeCategory === cat
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Medicine Grid */}
          {filteredMedicines.length === 0 ? (
            <div className="card p-12 text-center">
              <Pill className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No medicines found</p>
              <p className="text-gray-400 text-sm mt-1">
                Try adjusting your search or category filter
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredMedicines.map((med) => {
                const inCartQty = getCartQty(med.id);
                const isOutOfStock = med.stock <= 0;
                const isLowStock =
                  med.stock > 0 && med.stock <= med.minStock;

                return (
                  <div
                    key={med.id}
                    className={`card p-4 flex flex-col justify-between relative group ${
                      isOutOfStock ? 'opacity-50' : ''
                    }`}
                  >
                    {/* Dosage Form Badge */}
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide border ${
                          DOSAGE_COLORS[med.dosageForm] ||
                          'bg-gray-50 text-gray-600 border-gray-200'
                        }`}
                      >
                        {med.dosageForm}
                      </span>
                      {inCartQty > 0 && (
                        <span className="badge-info text-[10px]">
                          {inCartQty} in cart
                        </span>
                      )}
                    </div>

                    {/* Medicine Info */}
                    <div className="mb-2">
                      <h3 className="font-bold text-sm text-gray-900 leading-tight">
                        {med.name}
                      </h3>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {med.genericName}
                      </p>
                      {med.tabletsPerSheet > 1 && (
                        <p className="text-[10px] text-primary-500 font-semibold mt-1">
                          {med.packaging || 'Strip'} of {med.tabletsPerSheet}
                        </p>
                      )}
                    </div>

                    {/* Stock + Price */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex flex-col gap-0.5">
                        {isOutOfStock ? (
                          <span className="badge-danger">Out of Stock</span>
                        ) : isLowStock ? (
                          <span className="badge-warning">
                            Low: {getSheetDisplay(med.stock, med.tabletsPerSheet, med.packaging).display}
                          </span>
                        ) : (
                          <span className="badge-success">
                            {getSheetDisplay(med.stock, med.tabletsPerSheet, med.packaging).display}
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-bold text-primary-600">
                        ₹{med.sellingPrice.toFixed(2)}
                      </span>
                    </div>

                    {/* Add to Cart Button */}
                    <button
                      onClick={() => addToCart(med)}
                      disabled={isOutOfStock}
                      className="btn-primary btn-sm w-full justify-center"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add to Cart
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ============ RIGHT PANEL - BILLING CART ============ */}
        <div className="col-span-12 lg:col-span-4">
          <div className="card flex flex-col lg:sticky lg:top-4" style={{ maxHeight: 'calc(100vh - 6rem)' }}>
            {/* Cart Header */}
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-primary-600" />
                <span className="font-bold text-gray-900">Billing Cart</span>
                {cart.length > 0 && (
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary-600 text-white text-[10px] font-bold">
                    {cart.length}
                  </span>
                )}
              </div>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="btn-ghost btn-sm text-red-500 hover:text-red-700 hover:bg-red-50"
                  title="Clear cart"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Cart Items (Scrollable) */}
            <div className="flex-1 overflow-y-auto px-5 py-3 min-h-0">
              {cart.length === 0 ? (
                <div className="text-center py-10">
                  <ShoppingCart className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">Cart is empty</p>
                  <p className="text-xs text-gray-300 mt-1">
                    Add medicines from the catalog
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div
                      key={item.medicineId}
                      className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100 group/item"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {item.name}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          ₹{item.sellingPrice.toFixed(2)} × {item.quantity}
                        </p>
                        <p className="text-xs font-bold text-primary-600 mt-1">
                          ₹{(item.sellingPrice * item.quantity).toFixed(2)}
                        </p>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() =>
                            item.quantity > 1
                              ? updateCartQuantity(
                                  item.medicineId,
                                  item.quantity - 1
                                )
                              : removeFromCart(item.medicineId)
                          }
                          className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center text-xs font-bold text-gray-900">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateCartQuantity(
                              item.medicineId,
                              item.quantity + 1
                            )
                          }
                          disabled={item.quantity >= item.availableStock}
                          className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Remove */}
                      <button
                        onClick={() => removeFromCart(item.medicineId)}
                        className="opacity-0 group-hover/item:opacity-100 text-red-400 hover:text-red-600 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Section - Config & Checkout */}
            <div className="border-t border-gray-100 px-5 py-4 flex-shrink-0 space-y-4">
              {/* Customer Info & Settings (Owner/Staff Only) */}
              {user?.role !== 'customer' && (
                <>
                  {/* Customer Info */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="input-label">Customer Name</label>
                      <input
                        type="text"
                        placeholder="Optional"
                        className="input text-xs !py-2"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="input-label">Phone</label>
                      <input
                        type="text"
                        placeholder="Optional"
                        className="input text-xs !py-2"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Discount & Tax */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="input-label">Discount %</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        className="input text-xs !py-2"
                        value={discountPercent}
                        onChange={(e) =>
                          setDiscountPercent(
                            Math.min(100, Math.max(0, Number(e.target.value)))
                          )
                        }
                      />
                    </div>
                    <div>
                      <label className="input-label">Tax / GST %</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        className="input text-xs !py-2"
                        value={taxPercent}
                        onChange={(e) =>
                          setTaxPercent(
                            Math.min(100, Math.max(0, Number(e.target.value)))
                          )
                        }
                      />
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div>
                    <label className="input-label">Payment Method</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { key: 'Cash', icon: Wallet, label: 'Cash' },
                        { key: 'Card', icon: CreditCard, label: 'Card' },
                        { key: 'UPI', icon: Smartphone, label: 'UPI' },
                      ].map(({ key, icon: Icon, label }) => (
                        <button
                          key={key}
                          onClick={() => setPaymentMethod(key)}
                          className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                            paymentMethod === key
                              ? 'bg-primary-600 text-white shadow-sm'
                              : 'border border-gray-200 text-gray-600 hover:border-primary-300 hover:text-primary-600'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Financial Summary */}
              <div className="bg-gray-50 rounded-xl p-3 space-y-1.5">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Subtotal</span>
                  <span>₹{cartSubtotal.toFixed(2)}</span>
                </div>
                {discountPercent > 0 && (
                  <div className="flex justify-between text-xs text-green-600">
                    <span>Discount ({discountPercent}%)</span>
                    <span>-₹{discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Tax / GST ({taxPercent}%)</span>
                  <span>+₹{taxAmount.toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-200 pt-1.5 flex justify-between">
                  <span className="text-sm font-bold text-gray-900">
                    Grand Total
                  </span>
                  <span className="text-sm font-bold text-primary-600">
                    ₹{grandTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={handleCheckout}
                disabled={cart.length === 0}
                className="btn-primary btn-lg w-full justify-center text-sm"
              >
                <Receipt className="w-4 h-4" />
                {user?.role === 'customer' ? 'SCAN QR TO PAY' : 'GENERATE BILL'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Modal */}
      {invoiceData && (
        <InvoiceModal
          invoice={invoiceData}
          onClose={() => setInvoiceData(null)}
        />
      )}

      {/* Payment Status Modal */}
      {paymentStatus !== 'none' && (
        <div className="modal-overlay z-50">
          <div className={`modal-container ${paymentStatus === 'paying' ? 'max-w-md' : 'max-w-sm'} w-full p-6 text-center animate-scale-in`} onClick={(e) => e.stopPropagation()}>
            {paymentStatus === 'initiating' && (
              <div className="py-6">
                <div className="w-14 h-14 rounded-full bg-primary-50 flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <Loader className="w-8 h-8 text-primary-600 animate-spin" />
                </div>
                <h3 className="text-base font-bold text-gray-800">Securing Connection</h3>
                <p className="text-xs text-gray-400 mt-2">Initiating secure checkout session... Please do not reload or close this page.</p>
              </div>
            )}

            {paymentStatus === 'paying' && (
              <div className="py-2 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-primary-50 flex items-center justify-center mx-auto animate-bounce-gentle">
                  <QrCode className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="text-base font-bold text-gray-800">Scan QR Code to Pay</h3>
                <p className="text-xs text-gray-500">Scan using PhonePe / GPay / Paytm to pay <strong className="text-primary-600 font-bold">₹{mockTxn?.total.toFixed(2)}</strong></p>
                
                {/* Dynamic QR Code */}
                <div className="inline-block p-3 bg-white rounded-xl border-2 border-primary-100 shadow-sm mx-auto">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=6309337535@ybl&pn=Shekar%20Medicals&am=${mockTxn?.total}&cu=INR&tn=Invoice%20${mockTxn?.id}`}
                    alt="UPI QR Code"
                    className="w-44 h-44 rounded-lg object-contain mx-auto"
                  />
                </div>
                <p className="text-[10px] text-gray-400 font-semibold bg-gray-50 p-1.5 rounded-lg border border-gray-100 max-w-[200px] mx-auto truncate">UPI ID: 6309337535@ybl</p>

                {/* UTR input */}
                <div className="max-w-[240px] mx-auto text-left space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide block text-center">12-Digit UPI Transaction ID (UTR)</label>
                  <input
                    type="text"
                    placeholder="e.g. 123456789012"
                    className="input text-xs !py-2 text-center font-mono"
                    maxLength={12}
                    value={utrValue}
                    onChange={(e) => setUtrValue(e.target.value.replace(/\D/g, ''))}
                  />
                </div>

                <div className="flex gap-2 justify-center pt-2">
                  <button
                    onClick={handleVerifyMockPayment}
                    disabled={utrValue.length !== 12}
                    className="btn-primary btn-sm px-4 disabled:opacity-40"
                  >
                    Verify Payment
                  </button>
                  <button
                    onClick={handleCancelOrFailedPayment}
                    className="btn-outline btn-sm px-4"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {paymentStatus === 'verifying' && (
              <div className="py-6">
                <div className="w-14 h-14 rounded-full bg-primary-50 flex items-center justify-center mx-auto mb-4">
                  <Loader className="w-8 h-8 text-primary-600 animate-spin" />
                </div>
                <h3 className="text-base font-bold text-gray-800">Verifying Payment</h3>
                <p className="text-xs text-gray-400 mt-2">Confirming credentials with server logs. Please do not refresh...</p>
              </div>
            )}

            {paymentStatus === 'success' && (
              <div className="py-6">
                <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-9 h-9 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-800">Payment Successful!</h3>
                <p className="text-xs text-gray-400 mt-2">Your payment has been verified. Order #{paymentSaleId} is confirmed.</p>
                <div className="flex gap-2 mt-6 justify-center">
                  <button
                    onClick={() => {
                      const txn = sales.find(s => s.id === paymentSaleId);
                      if (txn) setInvoiceData(txn);
                      setPaymentStatus('none');
                    }}
                    className="btn-primary btn-sm px-4"
                  >
                    View Invoice
                  </button>
                  <button
                    onClick={() => setPaymentStatus('none')}
                    className="btn-outline btn-sm px-4"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

            {paymentStatus === 'failed' && (
              <div className="py-6">
                <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-9 h-9 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-800">Payment Failed</h3>
                <p className="text-xs text-red-500 bg-red-50/50 p-2.5 rounded-lg border border-red-100 mt-2">{paymentError || 'Transaction was not completed.'}</p>
                <div className="mt-6 flex justify-center">
                  <button
                    onClick={handleCloseFailedPayment}
                    className="btn-primary btn-sm px-6 bg-red-600 hover:bg-red-700"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
