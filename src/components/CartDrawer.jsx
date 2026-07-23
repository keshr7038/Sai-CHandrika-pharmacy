import React, { useContext, useState, useMemo, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import {
  X, ShoppingCart, Trash2, Minus, Plus, Wallet, CreditCard, 
  Smartphone, Receipt, Loader, QrCode
} from 'lucide-react';
import InvoiceModal from './InvoiceModal';

export default function CartDrawer({ isOpen, onClose }) {
  const { 
    user, cart, updateCartQuantity, removeFromCart, clearCart, 
    generateBill, sales, addNotification 
  } = useContext(AppContext);

  // Form inputs for Owner/Staff Checkout
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [taxPercent, setTaxPercent] = useState(8); // Default 8% GST
  const [paymentMethod, setPaymentMethod] = useState('Cash');

  // Customer Payment States
  const [invoiceData, setInvoiceData] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('none'); // 'none'|'initiating'|'paying'|'verifying'|'success'|'failed'
  const [paymentError, setPaymentError] = useState('');
  const [utrValue, setUtrValue] = useState('');
  const [mockTxn, setMockTxn] = useState(null);
  const [mockOrderData, setMockOrderData] = useState(null);
  const [paymentSaleId, setPaymentSaleId] = useState(null);

  // Cart Calculations
  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.sellingPrice * item.quantity, 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    return (cartSubtotal * discountPercent) / 100;
  }, [cartSubtotal, discountPercent]);

  const taxableAmount = useMemo(() => {
    return cartSubtotal - discountAmount;
  }, [cartSubtotal, discountAmount]);

  const taxAmount = useMemo(() => {
    return (taxableAmount * taxPercent) / 100;
  }, [taxableAmount, taxPercent]);

  const grandTotal = useMemo(() => {
    return taxableAmount + taxAmount;
  }, [taxableAmount, taxAmount]);

  // Handle Checkout
  const handleCheckout = async () => {
    if (cart.length === 0) return;

    // For Owners/Staff, run bill generation directly
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
          clearCart();
          onClose();
        }
      } catch (err) {
        console.error("Owner checkout error:", err);
        addNotification("❌ Failed to generate invoice", "error");
      }
      return;
    }

    // For Customers, initiate Direct QR Payment Flow
    setPaymentStatus('initiating');
    setPaymentError('');
    setUtrValue('');
    
    try {
      const txn = await generateBill(
        'UPI', // Direct UPI payment
        0, // No owner-specific discount
        8, // Default 8% tax
        user.name,
        user.phone
      );

      if (!txn) {
        throw new Error('Failed to create pending checkout record in database.');
      }

      setPaymentSaleId(txn.id);
      setMockTxn(txn);

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

      if (verifyData.success) {
        setPaymentStatus('success');
        clearCart();
        addNotification("🎉 Payment verified successfully!", "success");
      } else {
        throw new Error(verifyData.error || 'Verification failed.');
      }
    } catch (err) {
      console.error('Payment verification failed:', err);
      setPaymentStatus('failed');
      setPaymentError(err.message || 'Verification failed. Please check UTR.');
    }
  };

  const handleCancelOrFailedPayment = async () => {
    if (paymentSaleId) {
      const apiBase = window.location.hostname === 'localhost' ? 'http://localhost:5000' : '';
      try {
        await fetch(`${apiBase}/api/payments/cancel-sale`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sale_id: paymentSaleId })
        });
      } catch (err) {
        console.warn("Failed to cancel pending sale:", err.message);
      }
    }
    setPaymentStatus('none');
  };

  const handleCloseFailedPayment = () => {
    setPaymentStatus('none');
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Drawer Overlay */}
      <div 
        className="fixed inset-0 bg-black/45 backdrop-blur-xs z-50 transition-opacity duration-300 animate-fade-in"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-primary-600" />
            <span className="font-bold text-gray-900 text-base">
              {user?.role === 'customer' ? 'My Cart' : 'Billing Cart'}
            </span>
            {cart.length > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary-600 text-white text-[10px] font-bold">
                {cart.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                title="Clear cart"
              >
                <Trash2 className="w-4.5 h-4.5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Cart Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4 min-h-0 space-y-4">
          {cart.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4 border border-gray-100/60">
                <ShoppingCart className="w-7 h-7 text-gray-300" />
              </div>
              <p className="text-sm font-semibold text-gray-600">Your cart is empty</p>
              <p className="text-xs text-gray-400 mt-1 max-w-[200px] mx-auto">
                Explore the medicines catalog and add items to get started
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <div
                  key={item.medicineId}
                  className="flex items-start gap-3 p-3.5 rounded-xl bg-gray-50 border border-gray-100/60 group/item hover:bg-white hover:shadow-sm hover:border-gray-200 transition-all duration-200"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">
                      {item.name}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      ₹{item.sellingPrice.toFixed(2)} × {item.quantity}
                    </p>
                    <p className="text-xs font-black text-primary-600 mt-1">
                      ₹{(item.sellingPrice * item.quantity).toFixed(2)}
                    </p>
                  </div>

                  {/* Qty selectors */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() =>
                        item.quantity > 1
                          ? updateCartQuantity(item.medicineId, item.quantity - 1)
                          : removeFromCart(item.medicineId)
                      }
                      className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center text-xs font-bold text-gray-900">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateCartQuantity(item.medicineId, item.quantity + 1)}
                      disabled={item.quantity >= item.availableStock}
                      className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer disabled:opacity-40"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.medicineId)}
                    className="text-gray-300 hover:text-red-500 transition-colors cursor-pointer self-center ml-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Area - Config inputs & Checkout button */}
        {cart.length > 0 && (
          <div className="border-t border-gray-100 px-5 py-4 flex-shrink-0 bg-gray-50/40 space-y-4 shadow-[0_-4px_12px_rgba(0,0,0,0.02)]">
            {/* Owner specific inputs */}
            {user?.role !== 'customer' && (
              <div className="space-y-3 bg-white p-3.5 rounded-xl border border-gray-100 shadow-xs">
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Customer Name</label>
                    <input
                      type="text"
                      placeholder="Optional"
                      className="input text-xs !py-1.5"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Phone Number</label>
                    <input
                      type="text"
                      placeholder="Optional"
                      className="input text-xs !py-1.5"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Discount %</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      className="input text-xs !py-1.5"
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(Math.min(100, Math.max(0, Number(e.target.value))))}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">GST Tax %</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      className="input text-xs !py-1.5"
                      value={taxPercent}
                      onChange={(e) => setTaxPercent(Math.min(100, Math.max(0, Number(e.target.value))))}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Payment Method</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: 'Cash', icon: Wallet, label: 'Cash' },
                      { key: 'Card', icon: CreditCard, label: 'Card' },
                      { key: 'UPI', icon: Smartphone, label: 'UPI' },
                    ].map(({ key, icon: Icon, label }) => (
                      <button
                        key={key}
                        onClick={() => setPaymentMethod(key)}
                        className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                          paymentMethod === key
                            ? 'bg-primary-600 text-white'
                            : 'border border-gray-200 text-gray-600 hover:border-primary-300 hover:text-primary-600'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Financial Summary */}
            <div className="bg-white rounded-xl p-3.5 border border-gray-100 space-y-2 text-xs shadow-xs">
              <div className="flex justify-between text-gray-500 font-medium">
                <span>Subtotal</span>
                <span>₹{cartSubtotal.toFixed(2)}</span>
              </div>
              {discountPercent > 0 && (
                <div className="flex justify-between text-green-600 font-semibold">
                  <span>Discount ({discountPercent}%)</span>
                  <span>-₹{discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-500 font-medium">
                <span>GST Tax ({taxPercent}%)</span>
                <span>+₹{taxAmount.toFixed(2)}</span>
              </div>
              <div className="border-t border-gray-100 pt-2 flex justify-between font-extrabold">
                <span className="text-gray-800 text-sm">Grand Total</span>
                <span className="text-primary-600 text-sm">₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Checkout / Generate Bill Button */}
            <button
              onClick={handleCheckout}
              disabled={cart.length === 0}
              className="btn-primary btn-lg w-full justify-center text-sm shadow-md py-3 hover:translate-y-[-1px] active:translate-y-[0px]"
            >
              <Receipt className="w-4.5 h-4.5" />
              <span>{user?.role === 'customer' ? 'SCAN QR TO PAY' : 'GENERATE BILL'}</span>
            </button>
          </div>
        )}
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
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=6309337535@ybl&pn=Sai%20Chandrika%20Pharmacy&am=${mockTxn?.total}&cu=INR&tn=Invoice%20${mockTxn?.id}`}
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
                    onClick={() => {
                      setPaymentStatus('none');
                      onClose();
                    }}
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
    </>
  );
}
