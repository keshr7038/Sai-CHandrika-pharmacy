import React, { useState, useContext, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { 
  MapPin, Phone, CheckCircle2, Navigation, AlertCircle, ShoppingBag, Clock, Sparkles, KeyRound 
} from 'lucide-react';

export default function DeliveryExecutiveDashboard() {
  const { 
    user, deliveryOrders, sales, deliveryAddresses, 
    updateDeliveryStatus, verifyDeliveryOtp 
  } = useContext(AppContext);

  const [otpInputs, setOtpInputs] = useState({});
  const [errors, setErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState({});

  // Helper: Get sales details & address details for order
  const fullOrdersData = useMemo(() => {
    return deliveryOrders.map(delOrder => {
      const sale = sales.find(s => s.id === delOrder.id);
      const address = deliveryAddresses.find(a => a.id === delOrder.delivery_address_id);
      return {
        ...delOrder,
        customerName: sale ? sale.customerName : 'Unknown Patient',
        customerPhone: sale ? sale.customerPhone : '',
        totalAmount: sale ? sale.total : 0.0,
        addressString: address 
          ? `${address.address_line}, ${address.city}, ${address.state} - ${address.pincode} (Landmark: ${address.landmark || 'None'})`
          : 'Store Pickup / Address not found',
        contactPhone: address ? address.phone : (sale ? sale.customerPhone : '')
      };
    });
  }, [deliveryOrders, sales, deliveryAddresses]);

  // Handle Out for Delivery status update
  const handleMarkOutForDelivery = async (orderId) => {
    const res = await updateDeliveryStatus(orderId, 'Out for Delivery', 'Order is out with executive.');
    if (res.success) {
      alert(`🚚 Order ${orderId} is now out for delivery!`);
    } else {
      alert(`❌ Failed to update status: ${res.error}`);
    }
  };

  // Handle OTP Delivery confirmation
  const handleVerifyOtp = async (orderId) => {
    const otp = otpInputs[orderId];
    if (!otp || otp.length !== 4) {
      setErrors(prev => ({ ...prev, [orderId]: 'Please enter a valid 4-digit OTP' }));
      return;
    }

    setErrors(prev => ({ ...prev, [orderId]: '' }));
    const res = await verifyDeliveryOtp(orderId, otp);
    if (res.success) {
      setSuccessMsg(prev => ({ ...prev, [orderId]: '✅ Order Delivered Successfully!' }));
      // Clear inputs
      setOtpInputs(prev => ({ ...prev, [orderId]: '' }));
    } else {
      setErrors(prev => ({ ...prev, [orderId]: res.error || 'Incorrect OTP code.' }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Executive Welcome Banner */}
      <div className="card bg-gradient-to-br from-primary-600 to-primary-800 text-white p-6 relative overflow-hidden">
        <div className="relative z-10">
          <span className="bg-white/20 backdrop-blur-sm text-xs font-bold px-3 py-1 rounded-full text-white uppercase tracking-wider">
            Delivery executive portal
          </span>
          <h2 className="text-2xl font-black mt-3">Rider: {user.name}</h2>
          <p className="text-xs text-white/80 mt-1 max-w-md">
            View your assigned delivery orders, launch routing maps to navigate to patient addresses, and complete deliveries securely using customer OTP codes.
          </p>
        </div>
        <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-15 flex items-center justify-center">
          <Sparkles className="w-32 h-32" />
        </div>
      </div>

      {/* Active Orders List */}
      <div>
        <h3 className="text-sm font-extrabold text-gray-800 uppercase tracking-wider mb-4">Assigned Deliveries Queue</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {fullOrdersData.map((order) => {
            const isCompleted = order.status === 'Delivered';
            const isCancelled = order.status === 'Cancelled';
            const isActive = !isCompleted && !isCancelled;
            
            return (
              <div 
                key={order.id} 
                className={`card p-5 border flex flex-col justify-between transition-all duration-300 ${
                  isCompleted ? 'border-green-100 bg-green-50/10' :
                  isCancelled ? 'border-red-100 bg-red-50/10' : 'border-gray-100'
                }`}
              >
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-1.5">
                      <ShoppingBag className="w-4 h-4 text-primary-600" />
                      <span className="text-xs font-mono font-bold text-gray-600">{order.id}</span>
                    </div>
                    <span className={`badge ${
                      order.status === 'Order Placed' ? 'badge-neutral' :
                      order.status === 'Accepted' ? 'badge-info' :
                      order.status === 'Preparing' || order.status === 'Packed' ? 'badge-warning' :
                      order.status === 'Out for Delivery' ? 'bg-primary-100 text-primary-800' :
                      order.status === 'Delivered' ? 'badge-success' : 'badge-danger'
                    }`}>
                      {order.status}
                    </span>
                  </div>

                  <h4 className="text-sm font-extrabold text-gray-800 mt-2">{order.customerName}</h4>
                  
                  {/* Address Section */}
                  <div className="mt-3 flex items-start gap-2 text-xs text-gray-600 bg-gray-50/70 p-3 rounded-xl">
                    <MapPin className="w-4 h-4 text-primary-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-gray-700 block">Deliver to:</span>
                      <p className="mt-1 leading-relaxed">{order.addressString}</p>
                    </div>
                  </div>

                  {/* Contact Executive Actions */}
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <a
                      href={`tel:${order.contactPhone}`}
                      className="btn-outline flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-gray-700 bg-white"
                    >
                      <Phone className="w-3.5 h-3.5" /> Call Patient
                    </a>
                    
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.addressString)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-outline flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-gray-700 bg-white"
                    >
                      <Navigation className="w-3.5 h-3.5 text-primary-600" /> Google Maps
                    </a>
                  </div>

                  {/* Summary & Price */}
                  <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center text-xs">
                    <div className="flex items-center gap-1.5 text-gray-500">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <span className="font-bold text-gray-800">
                      Collect: ₹{parseFloat(order.totalAmount + order.delivery_charge).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Status-Driven Workflow Bottom bar */}
                <div className="mt-5 pt-4 border-t border-gray-100">
                  {order.status === 'Accepted' && (
                    <button
                      onClick={() => handleMarkOutForDelivery(order.id)}
                      className="w-full btn-primary py-2.5 rounded-xl justify-center text-xs font-bold shadow-md"
                    >
                      🚚 Start Delivery (Out for Delivery)
                    </button>
                  )}

                  {order.status === 'Out for Delivery' && (
                    <div className="space-y-3 bg-primary-50/30 p-3 rounded-2xl border border-primary-100/50">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-primary-700">
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>VERIFY OTP (Ask patient for the 4-digit code)</span>
                      </div>
                      
                      <div className="flex gap-2">
                        <input
                          type="text"
                          pattern="[0-9]*"
                          inputMode="numeric"
                          maxLength={4}
                          placeholder="e.g. 1234"
                          value={otpInputs[order.id] || ''}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, '');
                            setOtpInputs(prev => ({ ...prev, [order.id]: val }));
                          }}
                          className="input flex-1 py-1.5 px-3 text-center font-mono font-black text-sm tracking-widest rounded-xl border border-gray-200"
                        />
                        <button
                          onClick={() => handleVerifyOtp(order.id)}
                          className="btn-primary btn-sm px-4 rounded-xl text-xs font-bold"
                        >
                          Verify & Deliver
                        </button>
                      </div>
                      
                      {errors[order.id] && (
                        <p className="text-[10px] text-red-500 font-semibold flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 shrink-0" /> {errors[order.id]}
                        </p>
                      )}
                    </div>
                  )}

                  {isCompleted && (
                    <p className="text-center text-xs font-bold text-green-600 bg-green-50/50 py-2.5 rounded-xl border border-green-200/50 flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-green-600" /> Delivered Securely with OTP
                    </p>
                  )}

                  {isCancelled && (
                    <p className="text-center text-xs font-bold text-red-600 bg-red-50/50 py-2.5 rounded-xl border border-red-200/50">
                      Order Cancelled
                    </p>
                  )}

                  {successMsg[order.id] && (
                    <p className="mt-2 text-center text-[10px] text-green-600 font-bold">
                      {successMsg[order.id]}
                    </p>
                  )}
                </div>
              </div>
            );
          })}

          {fullOrdersData.length === 0 && (
            <div className="col-span-2 card py-12 text-center text-gray-400">
              <ShoppingBag className="w-12 h-12 mx-auto mb-3 text-gray-300 animate-pulse" />
              <p className="text-sm font-semibold">No assigned deliveries queue</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
