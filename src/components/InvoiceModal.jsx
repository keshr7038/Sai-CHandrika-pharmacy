import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import {
  X,
  Printer,
  Download,
  Check,
  QrCode,
  CreditCard,
  DollarSign,
  AlertCircle,
  Smartphone,
  Wallet,
  CheckCircle,
  Loader,
} from 'lucide-react';

const PAYMENT_STEPS = {
  REVIEW: 'review',
  PROCESSING: 'processing',
  SUCCESS: 'success',
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

export default function InvoiceModal({ invoice, onClose }) {
  const { user, markPaymentSuccess } = useContext(AppContext);
  const [paymentStep, setPaymentStep] = useState(
    invoice.paymentStatus === 'Success' ? PAYMENT_STEPS.SUCCESS : PAYMENT_STEPS.REVIEW
  );
  const [cashTendered, setCashTendered] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('none'); // 'none' | 'initiating' | 'paying' | 'verifying' | 'failed'
  const [paymentError, setPaymentError] = useState('');
  const [utrValue, setUtrValue] = useState('');
  const [isMockPayment, setIsMockPayment] = useState(false);
  const [mockOrderData, setMockOrderData] = useState(null);

  const changeDue =
    invoice.paymentMethod === 'Cash' && cashTendered
      ? Math.max(0, parseFloat(cashTendered) - invoice.total)
      : 0;

  const handleRazorpayPayment = async () => {
    setPaymentStatus('initiating');
    setPaymentError('');
    setIsMockPayment(true);
    setUtrValue('');
    try {
      const mockOrder = {
        success: true,
        order_id: `order_mock_${invoice.id}_${Date.now()}`,
        amount: Math.round(invoice.total * 100),
        currency: 'INR',
        is_mock: true
      };

      setMockOrderData(mockOrder);
      setPaymentStatus('paying');
    } catch (err) {
      console.error('Payment error:', err);
      setPaymentStatus('failed');
      setPaymentError(err.message || 'Failed to start payment.');
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
          sale_id: invoice.id,
          amount: mockOrderData.amount
        })
      });

      const verifyData = await verifyRes.json();

      if (verifyRes.ok && verifyData.success) {
        setPaymentStatus('none');
        setPaymentStep(PAYMENT_STEPS.SUCCESS);
        if (typeof markPaymentSuccess === 'function') {
          await markPaymentSuccess(invoice.id);
        }
      } else {
        throw new Error(verifyData.error || 'Mock payment verification failed.');
      }
    } catch (err) {
      console.error('Verification error:', err);
      setPaymentStatus('failed');
      setPaymentError(err.message || 'Verification failed.');
    }
  };

  const handleConfirmPayment = () => {
    setPaymentStep(PAYMENT_STEPS.PROCESSING);

    setTimeout(() => {
      markPaymentSuccess(invoice.id);
      setPaymentStep(PAYMENT_STEPS.SUCCESS);
    }, 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    // Simulated PDF download
    const element = document.createElement('a');
    const content = `
APOLLO MEDICAL STORE — TAX INVOICE
=====================================
Invoice: ${invoice.id}
Date: ${new Date(invoice.date).toLocaleString()}
Cashier: ${invoice.cashier}
Customer: ${invoice.customerName}
-------------------------------------
${invoice.items.map((item) => `${item.name}  x${item.quantity}  ₹${item.subtotal.toFixed(2)}`).join('\n')}
-------------------------------------
Subtotal:  ₹${invoice.items.reduce((s, i) => s + i.subtotal, 0).toFixed(2)}
Discount:  -₹${invoice.discount.toFixed(2)}
Tax/GST:   +₹${invoice.tax.toFixed(2)}
NET TOTAL: ₹${invoice.total.toFixed(2)}
-------------------------------------
Payment: ${invoice.paymentMethod}
Status: ${invoice.paymentStatus}
=====================================
Thank you for choosing Induja Medical Store!
    `.trim();
    const file = new Blob([content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `Invoice_${invoice.id}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const subtotal = invoice.items.reduce((s, i) => s + i.subtotal, 0);

  const PaymentMethodIcon =
    invoice.paymentMethod === 'Cash'
      ? Wallet
      : invoice.paymentMethod === 'Card'
      ? CreditCard
      : Smartphone;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-container w-full max-w-4xl max-h-[92vh] flex flex-col md:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ============ LEFT COLUMN - INVOICE RECEIPT ============ */}
        <div
          className="flex-[3] overflow-y-auto border-r border-gray-100 p-6"
          id="printable-receipt"
        >
          {/* Tax Invoice Badge */}
          <div className="text-center mb-5">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-[10px] font-bold uppercase tracking-widest border border-primary-200">
              Tax Invoice
            </span>
          </div>

          {/* Store Header */}
          <div className="text-center mb-5 pb-5 border-b border-dashed border-gray-200">
            <h2 className="text-xl font-extrabold text-primary-700 tracking-tight">
              APOLLO MEDICAL STORE
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              123 Health Avenue, Medical District, Mumbai — 400001
            </p>
            <p className="text-xs text-gray-400">
              Ph: +91 22 4000 5000 &nbsp;|&nbsp; GSTIN: 27AABCU9603R1ZM
            </p>
          </div>

          {/* Invoice Metadata */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 mb-5 text-xs">
            <div>
              <span className="text-gray-400 font-medium">Invoice ID</span>
              <p className="font-bold text-gray-900">{invoice.id}</p>
            </div>
            <div>
              <span className="text-gray-400 font-medium">Date</span>
              <p className="font-bold text-gray-900">
                {new Date(invoice.date).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
            <div>
              <span className="text-gray-400 font-medium">Cashier</span>
              <p className="font-bold text-gray-900">{invoice.cashier}</p>
            </div>
            <div>
              <span className="text-gray-400 font-medium">Customer</span>
              <p className="font-bold text-gray-900">
                {invoice.customerName}
              </p>
            </div>
            <div>
              <span className="text-gray-400 font-medium">Payment</span>
              <p className="font-bold text-gray-900">
                {invoice.paymentMethod}
              </p>
            </div>
            {invoice.customerPhone && (
              <div>
                <span className="text-gray-400 font-medium">Phone</span>
                <p className="font-bold text-gray-900">
                  {invoice.customerPhone}
                </p>
              </div>
            )}
          </div>

          {/* Itemized Table */}
          <div className="rounded-xl overflow-hidden border border-gray-100 mb-5">
            <table className="w-full text-xs">
              <thead>
                <tr className="table-header">
                  <th className="text-left">Item</th>
                  <th className="text-center">Qty</th>
                  <th className="text-right">Rate</th>
                  <th className="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, idx) => (
                  <tr key={idx} className="table-row">
                    <td className="font-medium text-gray-900">{item.name}</td>
                    <td className="text-center text-gray-600">
                      {item.quantity}
                    </td>
                    <td className="text-right text-gray-600">
                      ₹{item.price.toFixed(2)}
                    </td>
                    <td className="text-right font-semibold text-gray-900">
                      ₹{item.subtotal.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Calculations */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2 mb-5">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            {invoice.discount > 0 && (
              <div className="flex justify-between text-xs text-green-600">
                <span>Discount</span>
                <span>-₹{invoice.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-xs text-gray-500">
              <span>Tax / GST</span>
              <span>+₹{invoice.tax.toFixed(2)}</span>
            </div>
            <div className="border-t border-gray-200 pt-2 flex justify-between">
              <span className="text-base font-extrabold text-gray-900">
                Net Payable
              </span>
              <span className="text-base font-extrabold text-primary-600">
                ₹{invoice.total.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mb-4">
            <p className="text-xs text-gray-400 italic">
              Thank you for choosing Induja Medical Store!
            </p>
            <p className="text-[10px] text-gray-300 mt-1">
              This is a computer-generated invoice.
            </p>
            {/* Barcode Simulation */}
            <div className="mt-3 mx-auto w-48 h-10 flex items-end justify-center gap-px">
              {Array.from({ length: 40 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-gray-800 rounded-sm"
                  style={{
                    width: Math.random() > 0.5 ? '2px' : '3px',
                    height: `${20 + Math.random() * 16}px`,
                  }}
                />
              ))}
            </div>
            <p className="text-[9px] text-gray-300 mt-1 font-mono tracking-widest">
              {invoice.id}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button onClick={handlePrint} className="btn-outline btn-sm flex-1">
              <Printer className="w-3.5 h-3.5" />
              Print
            </button>
            <button
              onClick={handleDownloadPDF}
              className="btn-outline btn-sm flex-1"
            >
              <Download className="w-3.5 h-3.5" />
              Download PDF
            </button>
          </div>
        </div>

        {/* ============ RIGHT COLUMN - PAYMENT CONSOLE ============ */}
        <div className="flex-[2] flex flex-col bg-gray-50">
          {/* Header */}
          <div className="px-5 py-4 bg-white border-b border-gray-100 flex items-center justify-between flex-shrink-0">
            <h3 className="font-bold text-gray-900 text-sm">
              Payment Terminal
            </h3>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Payment Content */}
          <div className="flex-1 overflow-y-auto p-5">
            {user?.role === 'customer' && invoice.paymentStatus !== 'Success' ? (
              /* Customer Razorpay Checkout Terminal */
              <div className="animate-fade-in space-y-5">
                {paymentStatus === 'none' && (
                  <div className="space-y-5 text-center">
                    <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-card">
                      <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-1">
                        Amount to Pay
                      </p>
                      <p className="text-3xl font-extrabold text-primary-600">
                        ₹{invoice.total.toFixed(2)}
                      </p>
                      <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-semibold">
                        <Smartphone className="w-3.5 h-3.5" />
                        Online Checkout
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 p-5 text-left space-y-3">
                      <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Gateway Checkout Details</h4>
                      <div className="space-y-2 text-xs text-gray-500">
                        <div className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-green-500" />
                          <span>Direct UPI payment option enabled</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-green-500" />
                          <span>Support for Credit/Debit cards & wallets</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-green-500" />
                          <span>Instant digital receipt generation</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleRazorpayPayment}
                      className="btn-primary btn-lg w-full justify-center text-sm font-semibold shadow-md"
                    >
                      <QrCode className="w-4 h-4" />
                      SCAN QR TO PAY
                    </button>
                  </div>
                )}

                {(paymentStatus === 'initiating' || paymentStatus === 'verifying') && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Loader className="w-10 h-10 text-primary-600 animate-spin mb-4" />
                    <p className="text-sm font-bold text-gray-700">
                      {paymentStatus === 'initiating' ? 'Generating UPI QR Code...' : 'Verifying Transaction...'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Please do not refresh or close this modal.</p>
                  </div>
                )}

                {paymentStatus === 'paying' && (
                  <div className="py-4 text-center">
                    {isMockPayment ? (
                      <div className="space-y-4">
                        <div className="w-12 h-12 rounded-full bg-primary-50 flex items-center justify-center mx-auto animate-bounce-gentle">
                          <QrCode className="w-6 h-6 text-primary-600" />
                        </div>
                        <h3 className="text-base font-bold text-gray-800">Scan QR Code to Pay</h3>
                        <p className="text-xs text-gray-500">Scan using PhonePe / GPay / Paytm to pay **₹{invoice.total.toFixed(2)}**</p>
                        
                        {/* Dynamic QR Code */}
                        <div className="inline-block p-3 bg-white rounded-xl border-2 border-primary-100 shadow-sm mx-auto">
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=6309337535@ybl&pn=Induja%20Medical%20Store&am=${invoice.total}&cu=INR&tn=Invoice%20${invoice.id}`}
                            alt="UPI QR Code"
                            className="w-44 h-44 rounded-lg object-contain"
                          />
                        </div>
                        <p className="text-[10px] text-gray-400 font-semibold bg-gray-50 p-1.5 rounded-lg border border-gray-100 max-w-[200px] mx-auto truncate">UPI ID: 6309337535@ybl</p>

                        {/* UTR input */}
                        <div className="max-w-[240px] mx-auto text-left space-y-1.5">
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide block">12-Digit UPI Transaction ID (UTR)</label>
                          <input
                            type="text"
                            placeholder="e.g. 123456789012"
                            className="input text-xs !py-2 text-center"
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
                            onClick={() => {
                              setPaymentStatus('failed');
                              setPaymentError('Payment cancelled.');
                            }}
                            className="btn-outline btn-sm px-4"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="py-6">
                        <div className="w-14 h-14 rounded-full bg-primary-50 flex items-center justify-center mb-4 animate-bounce">
                          <Smartphone className="w-7 h-7 text-primary-600" />
                        </div>
                        <p className="text-sm font-bold text-gray-700">Checkout Modal Opened</p>
                        <p className="text-xs text-gray-400 mt-1">Please pay in the secure Razorpay popup window.</p>
                      </div>
                    )}
                  </div>
                )}

                {paymentStatus === 'failed' && (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
                      <X className="w-8 h-8 text-red-500" />
                    </div>
                    <h3 className="text-base font-bold text-gray-800">Payment Unsuccessful</h3>
                    <p className="text-xs text-red-500 bg-red-50/50 p-2.5 rounded-lg border border-red-100 mt-2 max-w-xs">{paymentError || 'Payment window dismissed.'}</p>
                    <button
                      onClick={() => setPaymentStatus('none')}
                      className="btn-primary btn-sm px-6 bg-red-600 hover:bg-red-700 mt-6"
                    >
                      Try Again
                    </button>
                  </div>
                )}
              </div>
            ) : (
              paymentStep === PAYMENT_STEPS.REVIEW && (
                <div className="animate-fade-in space-y-5">
                  {/* Amount Display */}
                  <div className="text-center p-5 bg-white rounded-2xl border border-gray-100 shadow-card">
                    <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-1">
                      Transaction Amount
                    </p>
                    <p className="text-3xl font-extrabold text-primary-600">
                      ₹{invoice.total.toFixed(2)}
                    </p>
                    <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold">
                      <PaymentMethodIcon className="w-3.5 h-3.5" />
                      {invoice.paymentMethod}
                    </div>
                  </div>

                  {/* Payment-specific UI */}
                  {invoice.paymentMethod === 'UPI' && (
                    <div className="text-center p-4 bg-white rounded-2xl border border-gray-100">
                      <p className="text-xs font-semibold text-gray-500 mb-3 flex items-center justify-center gap-1">
                        <QrCode className="w-3.5 h-3.5" />
                        Scan QR to Pay via PhonePe / GPay / Paytm
                      </p>
                      <div className="inline-block p-3 bg-white rounded-xl border-2 border-primary-100 shadow-sm">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=6309337535@ybl&pn=Induja%20Medical%20Store&am=${invoice.total}&cu=INR&tn=Invoice%20${invoice.id}`}
                          alt="UPI QR Code"
                          className="w-44 h-44 rounded-lg"
                        />
                      </div>
                      <div className="mt-3 flex items-center justify-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#5f259f] flex items-center justify-center">
                          <span className="text-white text-[10px] font-bold">Pe</span>
                        </div>
                        <p className="text-xs font-semibold text-gray-700">
                          UPI ID: 6309337535@ybl
                        </p>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1">
                        Amount: ₹{invoice.total.toFixed(2)}
                      </p>
                    </div>
                  )}

                  {invoice.paymentMethod === 'Card' && (
                    <div className="p-5 rounded-2xl text-white relative overflow-hidden"
                      style={{
                        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
                      }}
                    >
                      {/* Card chip */}
                      <div className="w-10 h-7 rounded-md bg-gradient-to-br from-yellow-300 to-yellow-500 mb-4 flex items-center justify-center">
                        <div className="w-6 h-4 rounded-sm border border-yellow-600/30 bg-gradient-to-br from-yellow-200 to-yellow-400" />
                      </div>
                      <p className="text-lg font-mono tracking-[0.25em] mb-3 opacity-90">
                        •••• •••• •••• 4821
                      </p>
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-[9px] uppercase tracking-wider opacity-50">
                            Card Holder
                          </p>
                          <p className="text-xs font-semibold opacity-80">
                            {invoice.customerName}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] uppercase tracking-wider opacity-50">
                            Amount
                          </p>
                          <p className="text-sm font-bold">
                            ₹{invoice.total.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      {/* Contactless icon */}
                      <div className="absolute top-5 right-5 opacity-30">
                        <CreditCard className="w-6 h-6" />
                      </div>
                    </div>
                  )}

                  {invoice.paymentMethod === 'Cash' && (
                    <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
                        <DollarSign className="w-3.5 h-3.5" />
                        Cash Payment
                      </div>
                      <div>
                        <label className="input-label">Cash Tendered (₹)</label>
                        <input
                          type="number"
                          className="input"
                          placeholder={`Min ₹${invoice.total.toFixed(2)}`}
                          value={cashTendered}
                          onChange={(e) => setCashTendered(e.target.value)}
                          min={0}
                        />
                      </div>
                      {cashTendered && parseFloat(cashTendered) >= invoice.total && (
                        <div className="flex justify-between items-center p-3 bg-green-50 rounded-xl border border-green-200 animate-fade-in">
                          <span className="text-xs font-semibold text-green-700">
                            Change Due
                          </span>
                          <span className="text-lg font-extrabold text-green-700">
                            ₹{changeDue.toFixed(2)}
                          </span>
                        </div>
                      )}
                      {cashTendered &&
                        parseFloat(cashTendered) > 0 &&
                        parseFloat(cashTendered) < invoice.total && (
                          <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl border border-red-200 animate-fade-in">
                            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                            <span className="text-xs text-red-600 font-medium">
                              Insufficient amount. Need ₹
                              {(invoice.total - parseFloat(cashTendered)).toFixed(
                                2
                              )}{' '}
                              more.
                            </span>
                          </div>
                        )}
                    </div>
                  )}

                  {/* Confirm Button */}
                  <button
                    onClick={handleConfirmPayment}
                    disabled={
                      invoice.paymentMethod === 'Cash' &&
                      (!cashTendered ||
                        parseFloat(cashTendered) < invoice.total)
                    }
                    className="btn-primary btn-lg w-full justify-center"
                  >
                    <Check className="w-4 h-4" />
                    Confirm Payment
                  </button>
                </div>
              )
            )}

            {/* ---- PROCESSING STEP ---- */}
            {paymentStep === PAYMENT_STEPS.PROCESSING && (
              <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
                {/* Spinner */}
                <div className="relative w-16 h-16 mb-5">
                  <div className="absolute inset-0 rounded-full border-4 border-gray-200" />
                  <div className="absolute inset-0 rounded-full border-4 border-primary-600 border-t-transparent animate-spin" />
                </div>
                <p className="text-sm font-bold text-gray-700">
                  Processing payment...
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Please wait, do not close this window
                </p>
              </div>
            )}

            {/* ---- SUCCESS STEP ---- */}
            {paymentStep === PAYMENT_STEPS.SUCCESS && (
              <div className="flex flex-col items-center justify-center py-10 animate-fade-in">
                {/* Green Checkmark Circle */}
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-5 animate-scale-in">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>

                <h3 className="text-lg font-extrabold text-gray-900 mb-1">
                  Payment Successful!
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Transaction {invoice.id} completed
                </p>

                {/* Details */}
                <div className="w-full bg-white rounded-xl border border-gray-100 p-4 space-y-2 mb-4">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Amount Paid</span>
                    <span className="font-bold text-primary-600">
                      ₹{invoice.total.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Payment Method</span>
                    <span className="font-semibold text-gray-700">
                      {invoice.paymentMethod}
                    </span>
                  </div>
                  {invoice.paymentMethod === 'Cash' && changeDue > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Change Returned</span>
                      <span className="font-bold text-green-600">
                        ₹{changeDue.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>

                {/* SMS Confirmation */}
                {invoice.customerPhone && (
                  <div className="alert-success w-full mb-4">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-xs">SMS Sent</p>
                      <p className="text-[11px] text-green-600 mt-0.5">
                        Payment confirmation sent to {invoice.customerPhone}
                      </p>
                    </div>
                  </div>
                )}

                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="btn-primary w-full justify-center"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
