import React, { createContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { sendSmsWithFallback, SMS_TEMPLATES, getTwilioConfig } from '../services/twilioService';

export const AppContext = createContext();

// ===== MAPPERS: DB (snake_case) ↔ Frontend (camelCase) =====
const mapMedicineFromDB = (row) => ({
  id: row.id, name: row.name, genericName: row.generic_name || '',
  category: row.category || 'Uncategorized', dosageForm: row.dosage_form || 'Tablet',
  packaging: row.packaging || 'Strip', tabletsPerSheet: row.tablets_per_sheet || 10,
  stock: row.stock || 0, minStock: row.min_stock || 10,
  purchasePrice: parseFloat(row.purchase_price) || 0,
  sellingPrice: parseFloat(row.selling_price) || 0,
  shelfLocation: row.shelf_location || '', expiryDate: row.expiry_date || '',
});

const mapMedicineToDB = (med) => ({
  id: med.id, name: med.name, generic_name: med.genericName || '',
  category: med.category, dosage_form: med.dosageForm,
  packaging: med.packaging || 'Strip', tablets_per_sheet: parseInt(med.tabletsPerSheet) || 10,
  stock: parseInt(med.stock) || 0, min_stock: parseInt(med.minStock) || 10,
  purchase_price: parseFloat(med.purchasePrice) || 0,
  selling_price: parseFloat(med.sellingPrice) || 0,
  shelf_location: med.shelfLocation || '', expiry_date: med.expiryDate || null,
});

const mapVendorFromDB = (row) => ({
  id: row.id, name: row.name, contactPerson: row.contact_person || '',
  contact: row.contact || '', email: row.email || '', address: row.address || '',
  dueAmount: parseFloat(row.due_amount) || 0, status: row.status || 'active',
  itemsSupplied: row.items_supplied || '',
});

const mapVendorToDB = (v) => ({
  id: v.id, name: v.name, contact_person: v.contactPerson || '',
  contact: v.contact || '', email: v.email || '', address: v.address || '',
  due_amount: parseFloat(v.dueAmount) || 0, status: v.status || 'active',
  items_supplied: v.itemsSupplied || '',
});

const mapSaleFromDB = (row, items = []) => ({
  id: row.id, date: row.date || row.created_at,
  customerName: row.customer_name || 'Walk-in Customer',
  customerPhone: row.customer_phone || '',
  items: items.map(i => ({
    medicineId: i.medicine_id, name: i.name,
    quantity: i.quantity, price: parseFloat(i.price),
    subtotal: parseFloat(i.subtotal),
  })),
  tax: parseFloat(row.tax) || 0, discount: parseFloat(row.discount) || 0,
  total: parseFloat(row.total) || 0,
  paymentMethod: row.payment_method || 'Cash',
  paymentStatus: row.payment_status || 'Pending',
  cashier: row.cashier || '',
});

const mapPurchaseFromDB = (row, items = []) => ({
  id: row.id, date: row.date || row.created_at,
  vendorId: row.vendor_id || '', vendorName: row.vendor_name || '',
  items: items.map(i => ({
    medicineId: i.medicine_id, name: i.name,
    quantity: i.quantity, purchasePrice: parseFloat(i.purchase_price),
    subtotal: parseFloat(i.subtotal),
  })),
  total: parseFloat(row.total) || 0,
});

// ===== Sheet display helper =====
export function getSheetDisplay(totalUnits, tabletsPerSheet, packaging = 'Strip') {
  if (!tabletsPerSheet || tabletsPerSheet <= 1) {
    return { sheets: totalUnits, loose: 0, display: `${totalUnits} ${packaging === 'Bottle' ? 'bottles' : 'units'}` };
  }
  const sheets = Math.floor(totalUnits / tabletsPerSheet);
  const loose = totalUnits % tabletsPerSheet;
  let display = '';
  if (sheets > 0 && loose > 0) display = `${sheets} ${packaging}${sheets > 1 ? 's' : ''} + ${loose} loose`;
  else if (sheets > 0) display = `${sheets} ${packaging}${sheets > 1 ? 's' : ''}`;
  else display = `${loose} loose tablet${loose !== 1 ? 's' : ''}`;
  return { sheets, loose, display, total: totalUnits };
}

export const AppProvider = ({ children }) => {
  const [medicines, setMedicines] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [sales, setSales] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('saichandrika_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  useEffect(() => {
    localStorage.setItem('saichandrika_cart', JSON.stringify(cart));
  }, [cart]);
  const [appointments, setAppointments] = useState(() => {
    try {
      const saved = localStorage.getItem('saichandrika_appointments');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  useEffect(() => {
    localStorage.setItem('saichandrika_appointments', JSON.stringify(appointments));
  }, [appointments]);
  const [smsLogs, setSmsLogs] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [twilioConfig, setTwilioConfigState] = useState(getTwilioConfig);
  const [user, setUser] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('saichandrika_dark_mode') === 'true');
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState(null);

  const toggleDarkMode = () => setDarkMode(prev => !prev);
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
      localStorage.setItem('saichandrika_dark_mode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
      localStorage.setItem('saichandrika_dark_mode', 'false');
    }
  }, [darkMode]);

  // Restore session on mount
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const storedUser = localStorage.getItem('saichandrika_user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (err) {
        console.error("Failed to restore session:", err);
      } finally {
        setLoading(false);
      }
    };
    restoreSession();
  }, []);

  // =============================================
  // LOAD DATA FROM SUPABASE ON MOUNT/LOGIN
  // =============================================
  const loadAllData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setDbError(null);
    try {
      // Medicines (visible to both roles)
      const { data: medsData, error: medsErr } = await supabase.from('medicines').select('*').order('id');
      if (medsErr) throw medsErr;
      setMedicines((medsData || []).map(mapMedicineFromDB));

      if (user.role === 'owner') {
        // Vendors
        const { data: vendorsData, error: vendorsErr } = await supabase.from('vendors').select('*').order('id');
        if (vendorsErr) throw vendorsErr;
        setVendors((vendorsData || []).map(mapVendorFromDB));

        // Sales with items
        const { data: salesData, error: salesErr } = await supabase.from('sales').select('*').order('date', { ascending: false });
        if (salesErr) throw salesErr;
        const salesWithItems = [];
        for (const sale of (salesData || [])) {
          const { data: items } = await supabase.from('sale_items').select('*').eq('sale_id', sale.id);
          salesWithItems.push(mapSaleFromDB(sale, items || []));
        }
        setSales(salesWithItems);

        // Purchases with items
        const { data: purchasesData, error: purchasesErr } = await supabase.from('purchases').select('*').order('date', { ascending: false });
        if (purchasesErr) throw purchasesErr;
        const purchasesWithItems = [];
        for (const purchase of (purchasesData || [])) {
          const { data: items } = await supabase.from('purchase_items').select('*').eq('purchase_id', purchase.id);
          purchasesWithItems.push(mapPurchaseFromDB(purchase, items || []));
        }
        setPurchases(purchasesWithItems);

        // SMS Logs
        const { data: smsData } = await supabase.from('sms_logs').select('*').order('created_at', { ascending: false }).limit(50);
        setSmsLogs((smsData || []).map(row => ({
          id: row.id, to: row.recipient, message: row.message, type: row.type,
          timestamp: row.created_at, status: row.status, method: row.method,
          twilioSid: row.twilio_sid, error: row.error,
        })));

        // Customers (Analytics list)
        const { data: custData, error: custErr } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
        if (custErr) throw custErr;
        setCustomers(custData || []);

        // Payments (Payment Gateway Logs)
        const { data: paymentsData, error: paymentsErr } = await supabase.from('payments').select('*').order('created_at', { ascending: false });
        if (!paymentsErr) {
          setPayments(paymentsData || []);
        } else {
          console.warn("Could not load payments (payments table might not exist yet):", paymentsErr.message);
        }
      } else if (user.role === 'customer') {
        // Customer can only view their own transactions / orders
        const customerPhone = user.phone ? user.phone.replace(/[\s\-()]/g, '') : 'None';
        const { data: salesData } = await supabase.from('sales')
          .select('*')
          .or(`customer_phone.eq.${customerPhone},customer_name.ilike.%${user.name}%`)
          .order('date', { ascending: false });

        const salesWithItems = [];
        for (const sale of (salesData || [])) {
          const { data: items } = await supabase.from('sale_items').select('*').eq('sale_id', sale.id);
          salesWithItems.push(mapSaleFromDB(sale, items || []));
        }
        setSales(salesWithItems);

        // Payments (Own online payments)
        const { data: paymentsData, error: paymentsErr } = await supabase.from('payments').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
        if (!paymentsErr) {
          setPayments(paymentsData || []);
        } else {
          console.warn("Could not load payments:", paymentsErr.message);
        }
      }

      // Load Appointments (visible to both roles)
      try {
        if (user.role === 'owner') {
          const { data: apptData, error: apptErr } = await supabase.from('appointments').select('*').order('appointment_date', { ascending: true });
          if (!apptErr) setAppointments(apptData || []);
        } else {
          const { data: apptData, error: apptErr } = await supabase.from('appointments').select('*').eq('customer_email', user.email).order('appointment_date', { ascending: true });
          if (!apptErr) setAppointments(apptData || []);
        }
      } catch (apptLoadErr) {
        console.warn("Failed to load appointments from Supabase:", apptLoadErr.message);
      }

    } catch (err) {
      console.error('Failed to load data from Supabase:', err);
      setDbError(err.message || 'Failed to connect to database');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load data when user logs in
  useEffect(() => {
    if (user) loadAllData();
  }, [user, loadAllData]);

  // =============================================
  // NOTIFICATION SYSTEM
  // =============================================
  const addNotification = useCallback((message, type = 'info') => {
    setNotifications(prev => [{
      id: `NOTIF-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      message, type, timestamp: new Date().toISOString(), read: false
    }, ...prev.slice(0, 19)]);
  }, []);

  const markNotificationRead = (id) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  const clearNotifications = () => setNotifications([]);

  // =============================================
  // SMS — Twilio + Supabase logging
  // =============================================
  const updateTwilioConfig = (config) => setTwilioConfigState(config);

  const sendSms = useCallback(async (to, message, type = 'info') => {
    const result = await sendSmsWithFallback(to, message);
    const smsEntry = {
      id: `SMS-${Date.now()}`, to, message, type,
      timestamp: new Date().toISOString(),
      status: result.success ? 'delivered' : 'failed',
      method: result.method || 'simulated',
      twilioSid: result.sid || null, error: result.error || null,
    };
    setSmsLogs(prev => [smsEntry, ...prev]);

    // Persist to Supabase
    await supabase.from('sms_logs').insert({
      id: smsEntry.id, recipient: to, message, type,
      status: smsEntry.status, method: smsEntry.method,
      twilio_sid: smsEntry.twilioSid, error: smsEntry.error,
    });

    addNotification(
      result.method === 'twilio' ? `✅ SMS sent to ${to} via Twilio` : `📱 SMS to ${to}: ${message.substring(0, 60)}...`,
      type
    );
    return smsEntry;
  }, [addNotification]);

  // =============================================
  // AUTH — Custom Phone OTP + users/customers table
  // =============================================
  const checkOwnerEmail = async (email) => {
    try {
      const normEmail = email.trim().toLowerCase();
      const { data, error } = await supabase
        .from('owners')
        .select('*')
        .eq('email', normEmail)
        .maybeSingle();
      if (error) throw error;
      return !!data;
    } catch (err) {
      console.error("Error checking owner email:", err.message);
      return false;
    }
  };

  const sendOwnerOtp = async (email) => {
    try {
      const normEmail = email.trim().toLowerCase();

      // Call native Supabase Auth signInWithOtp
      const { data, error } = await supabase.auth.signInWithOtp({
        email: normEmail,
        options: {
          shouldCreateUser: true
        }
      });

      if (error) throw error;

      addNotification(`Verification code sent to email: ${normEmail}`, 'success');
      return { success: true, data };
    } catch (err) {
      console.error("Error sending owner OTP:", err.message);
      addNotification(`Failed to send OTP: ${err.message}`, 'warning');
      return { success: false, error: err.message };
    }
  };

  const logOwnerLogin = async (email) => {
    try {
      // 1. Insert into owner_logs table
      await supabase.from('owner_logs').insert({
        email: email,
        login_time: new Date().toISOString()
      });

      // 2. Also keep writing to owner_login_logs for backward compatibility
      let ip = 'Unknown';
      try {
        const res = await fetch('https://api.ipify.org?format=json');
        const data = await res.json();
        ip = data.ip;
      } catch (e) {
        console.warn("Failed to fetch IP:", e.message);
      }
      
      const deviceInfo = navigator.userAgent;
      
      await supabase.from('owner_login_logs').insert({
        phone_number: email,
        ip_address: ip,
        device_info: deviceInfo
      });
    } catch (err) {
      console.error("Error logging owner login:", err.message);
    }
  };

  // Handle auth state changes (e.g. Magic Link login redirects)
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const storedUser = localStorage.getItem('saichandrika_user');
        const currentUser = storedUser ? JSON.parse(storedUser) : null;
        
        if (!currentUser || currentUser.id !== session.user.id) {
          const email = session.user.email;
          const isOwner = await checkOwnerEmail(email);
          if (isOwner) {
            await logOwnerLogin(email);
            const userData = {
              id: session.user.id,
              name: 'Store Owner',
              email: email,
              phone: '',
              role: 'owner',
              createdAt: session.user.created_at
            };
            setUser(userData);
            localStorage.setItem('saichandrika_user', JSON.stringify(userData));
            addNotification("Logged in successfully as Owner!", "success");
          } else {
            const { data: customerProfile } = await supabase
              .from('customers')
              .select('*')
              .eq('email', email)
              .maybeSingle();
            
            if (customerProfile) {
              const userData = {
                id: customerProfile.id,
                name: customerProfile.name,
                email: customerProfile.email,
                phone: customerProfile.phone || '',
                role: 'customer',
                createdAt: customerProfile.created_at,
                lastLogin: customerProfile.last_login
              };
              setUser(userData);
              localStorage.setItem('saichandrika_user', JSON.stringify(userData));
              addNotification("Logged in successfully as Customer!", "success");
            }
          }
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        localStorage.removeItem('saichandrika_user');
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [addNotification]);

  const verifyOwnerOtp = async (email, otp) => {
    try {
      const normEmail = email.trim().toLowerCase();

      // Call native Supabase Auth verifyOtp
      const { data, error } = await supabase.auth.verifyOtp({
        email: normEmail,
        token: otp,
        type: 'email'
      });

      if (error) throw error;

      if (!data?.session) {
        throw new Error("Invalid code or session could not be established.");
      }

      await logOwnerLogin(normEmail);
      
      const userData = {
        id: data.user.id,
        name: 'Store Owner',
        email: normEmail,
        phone: '',
        role: 'owner',
        createdAt: data.user.created_at
      };
      
      setUser(userData);
      localStorage.setItem('saichandrika_user', JSON.stringify(userData));
      addNotification("Logged in successfully as Owner!", "success");
      return { success: true };
    } catch (err) {
      console.error("Owner OTP verification failed:", err.message);
      return { success: false, error: err.message };
    }
  };

  const loginCustomerDirectly = async (name, email, phone) => {
    try {
      const normEmail = email.trim().toLowerCase();

      // 1. Get/update customer profile in customers table
      const { data: customer, error: dbErr } = await supabase
        .from('customers')
        .select('*')
        .eq('email', normEmail)
        .maybeSingle();

      if (dbErr) throw dbErr;

      let customerProfile = customer;
      if (!customerProfile) {
        // Create profile if missing
        const { data: newCust, error: insertErr } = await supabase
          .from('customers')
          .insert({
            name: name || normEmail.split('@')[0],
            email: normEmail,
            phone: phone || '',
            created_at: new Date().toISOString()
          })
          .select()
          .single();
        if (insertErr) throw insertErr;
        customerProfile = newCust;
      } else {
        // Update details if profile already exists
        await supabase
          .from('customers')
          .update({ name: name || customerProfile.name, phone: phone || customerProfile.phone })
          .eq('email', normEmail);
        customerProfile.name = name || customerProfile.name;
        customerProfile.phone = phone || customerProfile.phone;
      }

      const lastLogin = new Date().toISOString();
      await supabase.from('customers').update({ last_login: lastLogin }).eq('id', customerProfile.id);

      const userData = {
        id: customerProfile.id,
        name: customerProfile.name,
        email: customerProfile.email,
        phone: customerProfile.phone || '',
        role: 'customer',
        createdAt: customerProfile.created_at,
        lastLogin: lastLogin
      };

      setUser(userData);
      localStorage.setItem('saichandrika_user', JSON.stringify(userData));
      addNotification("Logged in successfully as Customer!", "success");
      return { success: true };
    } catch (err) {
      console.error("Customer direct login failed:", err.message);
      return { success: false, error: err.message };
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn("Failed to sign out from Supabase:", e.message);
    }
    setUser(null);
    localStorage.removeItem('saichandrika_user');
    setCart([]);
    setMedicines([]);
    setVendors([]);
    setSales([]);
    setPurchases([]);
    setSmsLogs([]);
    setCustomers([]);
    setPayments([]);
  };

  // =============================================
  // MEDICINES — Supabase CRUD
  // =============================================
  const addMedicine = async (medData) => {
    const newId = `MED${String(Date.now()).slice(-6)}`;
    const tabletsPerSheet = parseInt(medData.tabletsPerSheet) || 10;
    const numberOfSheets = parseInt(medData.numberOfSheets) || 0;
    const looseUnits = parseInt(medData.looseUnits) || 0;
    const totalStock = (numberOfSheets * tabletsPerSheet) + looseUnits;

    const newMedicine = {
      id: newId, name: medData.name || '', genericName: medData.genericName || '',
      category: medData.category || 'Uncategorized', dosageForm: medData.dosageForm || 'Tablet',
      packaging: medData.packaging || 'Strip', tabletsPerSheet,
      stock: totalStock || parseInt(medData.stock) || 0,
      minStock: parseInt(medData.minStock) || 10,
      purchasePrice: parseFloat(medData.purchasePrice) || 0,
      sellingPrice: parseFloat(medData.sellingPrice) || 0,
      shelfLocation: medData.shelfLocation || '', expiryDate: medData.expiryDate || '',
    };

    // Optimistic update
    setMedicines(prev => [...prev, newMedicine]);

    // Persist to Supabase
    const { error } = await supabase.from('medicines').insert(mapMedicineToDB(newMedicine));
    if (error) {
      console.error('Failed to add medicine:', error);
      addNotification(`❌ Failed to save medicine: ${error.message}`, 'warning');
      setMedicines(prev => prev.filter(m => m.id !== newId)); // rollback
    } else {
      addNotification(`✅ ${newMedicine.name} added to inventory`, 'success');
    }
    return newMedicine;
  };

  const updateMedicine = async (id, updatedData) => {
    const oldMedicine = medicines.find(m => m.id === id);

    // Build updated object
    const tabletsPerSheet = updatedData.tabletsPerSheet !== undefined ? parseInt(updatedData.tabletsPerSheet) : oldMedicine?.tabletsPerSheet;
    let stock = oldMedicine?.stock || 0;
    if (updatedData.numberOfSheets !== undefined) {
      stock = (parseInt(updatedData.numberOfSheets) || 0) * tabletsPerSheet + (parseInt(updatedData.looseUnits) || 0);
    } else if (updatedData.stock !== undefined) {
      stock = parseInt(updatedData.stock);
    }

    const merged = {
      ...oldMedicine, ...updatedData, tabletsPerSheet, stock,
      minStock: updatedData.minStock !== undefined ? parseInt(updatedData.minStock) : oldMedicine?.minStock,
      purchasePrice: updatedData.purchasePrice !== undefined ? parseFloat(updatedData.purchasePrice) : oldMedicine?.purchasePrice,
      sellingPrice: updatedData.sellingPrice !== undefined ? parseFloat(updatedData.sellingPrice) : oldMedicine?.sellingPrice,
    };

    // Optimistic update
    setMedicines(prev => prev.map(med => med.id === id ? merged : med));

    // Persist
    const { error } = await supabase.from('medicines').update(mapMedicineToDB(merged)).eq('id', id);
    if (error) {
      console.error('Failed to update medicine:', error);
      addNotification(`❌ Failed to update: ${error.message}`, 'warning');
      if (oldMedicine) setMedicines(prev => prev.map(m => m.id === id ? oldMedicine : m)); // rollback
    }
  };

  const deleteMedicine = async (id) => {
    const old = medicines.find(m => m.id === id);
    setMedicines(prev => prev.filter(med => med.id !== id));

    const { error } = await supabase.from('medicines').delete().eq('id', id);
    if (error) {
      console.error('Failed to delete medicine:', error);
      addNotification(`❌ Failed to delete: ${error.message}`, 'warning');
      if (old) setMedicines(prev => [...prev, old]); // rollback
    } else {
      addNotification(`🗑️ ${old?.name || 'Medicine'} removed`, 'info');
    }
  };

  // =============================================
  // VENDORS — Supabase CRUD
  // =============================================
  const addVendor = async (vendorData) => {
    const newId = `VND${String(Date.now()).slice(-6)}`;
    const newVendor = {
      id: newId, ...vendorData,
      dueAmount: parseFloat(vendorData.dueAmount) || 0, status: 'active',
    };

    setVendors(prev => [...prev, newVendor]);

    const { error } = await supabase.from('vendors').insert(mapVendorToDB(newVendor));
    if (error) {
      console.error('Failed to add vendor:', error);
      addNotification(`❌ Failed to save vendor: ${error.message}`, 'warning');
      setVendors(prev => prev.filter(v => v.id !== newId));
    } else {
      addNotification(`✅ Vendor ${newVendor.name} registered`, 'success');
    }
    return newVendor;
  };

  const updateVendor = async (id, updatedData) => {
    const old = vendors.find(v => v.id === id);
    const merged = { ...old, ...updatedData };
    setVendors(prev => prev.map(v => v.id === id ? merged : v));

    const { error } = await supabase.from('vendors').update(mapVendorToDB(merged)).eq('id', id);
    if (error) {
      console.error('Failed to update vendor:', error);
      if (old) setVendors(prev => prev.map(v => v.id === id ? old : v));
    }
  };

  // =============================================
  // CART OPERATIONS (local only)
  // =============================================
  const addToCart = (medicine) => {
    if (medicine.stock <= 0) return;
    setCart(prevCart => {
      const existing = prevCart.find(item => item.medicineId === medicine.id);
      if (existing) {
        if (existing.quantity < medicine.stock) {
          return prevCart.map(item =>
            item.medicineId === medicine.id ? { ...item, quantity: item.quantity + 1 } : item
          );
        }
        return prevCart;
      }
      return [...prevCart, {
        medicineId: medicine.id, name: medicine.name,
        sellingPrice: medicine.sellingPrice, quantity: 1,
        availableStock: medicine.stock,
        tabletsPerSheet: medicine.tabletsPerSheet || 10,
        packaging: medicine.packaging || 'Strip',
      }];
    });
  };

  const removeFromCart = (medicineId) => setCart(prev => prev.filter(item => item.medicineId !== medicineId));
  const updateCartQuantity = (medicineId, quantity) => {
    setCart(prev => prev.map(item =>
      item.medicineId === medicineId ? { ...item, quantity: Math.max(1, Math.min(quantity, item.availableStock)) } : item
    ));
  };
  const clearCart = () => setCart([]);

  // =============================================
  // GENERATE BILL — Supabase insert sales + sale_items + update stock
  // =============================================
  const generateBill = async (paymentMethod = 'Cash', discountPercent = 0, taxPercent = 8, customerName = '', customerPhone = '') => {
    if (cart.length === 0) return null;

    const subtotal = cart.reduce((sum, item) => sum + (item.sellingPrice * item.quantity), 0);
    const discountVal = (subtotal * parseFloat(discountPercent)) / 100;
    const taxableAmount = subtotal - discountVal;
    const taxVal = (taxableAmount * parseFloat(taxPercent)) / 100;
    const totalVal = parseFloat((taxableAmount + taxVal).toFixed(2));

    const newTxnId = `TXN-${Math.floor(100000 + Math.random() * 900000)}`;
    const now = new Date().toISOString();
    const newTxn = {
      id: newTxnId, date: now,
      customerName: customerName || 'Walk-in Customer',
      customerPhone: customerPhone || '',
      items: cart.map(item => ({
        medicineId: item.medicineId, name: item.name,
        quantity: item.quantity, price: item.sellingPrice,
        subtotal: parseFloat((item.sellingPrice * item.quantity).toFixed(2))
      })),
      tax: parseFloat(taxVal.toFixed(2)),
      discount: parseFloat(discountVal.toFixed(2)),
      total: totalVal, paymentMethod,
      paymentStatus: 'Pending',
      cashier: user ? `${user.name} (${user.role === 'owner' ? 'Owner' : 'Staff'})` : 'Pharmacist'
    };

    // 1. Optimistic local update
    setSales(prev => [newTxn, ...prev]);

    // 2. Insert sale header into Supabase
    const { error: saleErr } = await supabase.from('sales').insert({
      id: newTxnId, date: now,
      customer_name: newTxn.customerName, customer_phone: newTxn.customerPhone,
      tax: newTxn.tax, discount: newTxn.discount, total: totalVal,
      payment_method: paymentMethod, payment_status: 'Pending',
      cashier: newTxn.cashier,
    });
    if (saleErr) {
      console.error('Failed to insert sale:', saleErr);
      addNotification(`❌ Bill save failed: ${saleErr.message}`, 'warning');
    }

    // 3. Insert sale items
    const saleItems = newTxn.items.map(item => ({
      sale_id: newTxnId, medicine_id: item.medicineId,
      name: item.name, quantity: item.quantity,
      price: item.price, subtotal: item.subtotal,
    }));
    const { error: itemsErr } = await supabase.from('sale_items').insert(saleItems);
    if (itemsErr) console.error('Failed to insert sale items:', itemsErr);

    // 4. Send low-stock SMS alerts if applicable
    for (const cartItem of cart) {
      const med = medicines.find(m => m.id === cartItem.medicineId);
      if (med) {
        const newStock = Math.max(0, med.stock - cartItem.quantity);
        if (newStock <= med.minStock && user) {
          sendSms(user.phone || '+91 98765 43210',
            SMS_TEMPLATES.lowStock(med.name, newStock, med.minStock), 'warning');
        }
      }
    }

    // Clear cart immediately ONLY for owners/staff (customer cart is cleared on payment success)
    if (user?.role !== 'customer') {
      setCart([]);
    }
    
    return newTxn;
  };

  // =============================================
  // MARK PAYMENT SUCCESS — Update Supabase + SMS
  // =============================================
  const markPaymentSuccess = async (txnId) => {
    // Optimistic update
    setSales(prev => prev.map(sale =>
      sale.id === txnId ? { ...sale, paymentStatus: 'Success' } : sale
    ));

    // Update in Supabase
    const { error } = await supabase.from('sales').update({ payment_status: 'Success' }).eq('id', txnId);
    if (error) {
      console.error('Failed to update payment status:', error);
    } else {
      // Sync fresh stock levels from Supabase (updated by DB triggers)
      const { data: freshMeds } = await supabase.from('medicines').select('*').order('id');
      if (freshMeds) {
        setMedicines(freshMeds.map(mapMedicineFromDB));
      }
    }

    // Clear cart for customers on payment success
    if (user?.role === 'customer') {
      setCart([]);
    }

    // Send SMS to customer
    const sale = sales.find(s => s.id === txnId);
    if (sale?.customerPhone) {
      sendSms(sale.customerPhone,
        SMS_TEMPLATES.paymentSuccess(sale.id, sale.total.toFixed(2)), 'success');
    }
  };

  const cancelPendingSale = async (saleId) => {
    // 1. Optimistic local update
    setSales(prev => prev.filter(s => s.id !== saleId));

    // 2. Delete from Supabase (sale_items will cascade delete automatically)
    const { error } = await supabase.from('sales').delete().eq('id', saleId);
    if (error) {
      console.error('Failed to delete pending sale:', error);
    }
  };

  // =============================================
  // PURCHASES — Supabase insert + stock update
  // =============================================
  const addPurchase = async (vendorId, purchaseItems) => {
    const vendor = vendors.find(v => v.id === vendorId);
    if (!vendor || purchaseItems.length === 0) return null;

    const itemsTotal = purchaseItems.reduce((sum, item) =>
      sum + (parseFloat(item.purchasePrice) * parseInt(item.quantity)), 0);

    const newPoId = `PO-${Math.floor(100000 + Math.random() * 900000)}`;
    const now = new Date().toISOString();

    const newPurchase = {
      id: newPoId, date: now, vendorId, vendorName: vendor.name,
      items: purchaseItems.map(item => {
        const med = medicines.find(m => m.id === item.medicineId);
        return {
          medicineId: item.medicineId, name: med ? med.name : 'Unknown',
          quantity: parseInt(item.quantity), purchasePrice: parseFloat(item.purchasePrice),
          subtotal: parseFloat((parseFloat(item.purchasePrice) * parseInt(item.quantity)).toFixed(2))
        };
      }),
      total: parseFloat(itemsTotal.toFixed(2))
    };

    // Optimistic update
    setPurchases(prev => [newPurchase, ...prev]);

    // 1. Insert purchase header
    const { error: poErr } = await supabase.from('purchases').insert({
      id: newPoId, date: now, vendor_id: vendorId,
      vendor_name: vendor.name, total: newPurchase.total,
    });
    if (poErr) console.error('Failed to insert purchase:', poErr);

    // 2. Insert purchase items
    const poItems = newPurchase.items.map(item => ({
      purchase_id: newPoId, medicine_id: item.medicineId,
      name: item.name, quantity: item.quantity,
      purchase_price: item.purchasePrice, subtotal: item.subtotal,
    }));
    const { error: piErr } = await supabase.from('purchase_items').insert(poItems);
    if (piErr) console.error('Failed to insert purchase items:', piErr);

    // 3. Update medicine stock + purchase price in Supabase
    for (const pItem of purchaseItems) {
      const med = medicines.find(m => m.id === pItem.medicineId);
      if (med) {
        const newStock = med.stock + parseInt(pItem.quantity);
        await supabase.from('medicines').update({
          stock: newStock,
          purchase_price: parseFloat(pItem.purchasePrice) || med.purchasePrice,
        }).eq('id', med.id);
      }
    }

    // Refresh medicines
    const { data: freshMeds } = await supabase.from('medicines').select('*').order('id');
    if (freshMeds) setMedicines(freshMeds.map(mapMedicineFromDB));

    addNotification(`✅ Purchase ${newPoId} recorded — ${newPurchase.items.length} items restocked`, 'success');
    return newPurchase;
  };

  // =============================================
  // VENDOR DUE REMINDER
  // =============================================
  const sendVendorDueReminder = (vendorId) => {
    const vendor = vendors.find(v => v.id === vendorId);
    if (!vendor || vendor.dueAmount <= 0) return;
    sendSms(vendor.contact,
      SMS_TEMPLATES.vendorDueReminder(vendor.contactPerson, vendor.dueAmount.toFixed(2)), 'warning');
  };

  // =============================================
  // AI CHAT (local — same as before)
  // =============================================
  const [aiMessages, setAiMessages] = useState([{
    id: 'ai-welcome', role: 'assistant',
    content: 'Hello! 👋 I\'m your Sai Chandrika AI Medical Assistant. I can help you with:\n\n• **Medicine information** — dosage, uses, side effects\n• **Stock queries** — check availability and pricing\n• **Health tips** — general wellness advice\n• **Order assistance** — help with prescriptions\n\nHow can I assist you today?',
    timestamp: new Date().toISOString()
  }]);

  const sendAiMessage = async (message) => {
    const userMsg = { id: `msg-${Date.now()}`, role: 'user', content: message, timestamp: new Date().toISOString() };
    setAiMessages(prev => [...prev, userMsg]);

    try {
      const apiBase = window.location.hostname === 'localhost' ? 'http://localhost:5000' : '';
      
      // Get conversation history (last 10 messages)
      const historyToSend = aiMessages
        .slice(-10)
        .map(m => ({ role: m.role, content: m.content }));

      // Prepare context data based on user role
      let payloadData = {};
      if (user?.role === 'owner') {
        payloadData = {
          userName: user.name,
          userEmail: user.email,
          medicines: medicines.map(m => ({
            name: m.name,
            genericName: m.genericName,
            category: m.category,
            dosageForm: m.dosageForm,
            packaging: m.packaging,
            stock: m.stock,
            minStock: m.minStock,
            sellingPrice: m.sellingPrice
          })),
          sales: sales.map(s => ({
            id: s.id,
            date: s.date,
            total: s.total,
            paymentMethod: s.paymentMethod,
            paymentStatus: s.paymentStatus
          })),
          vendors: vendors.map(v => ({
            name: v.name,
            dueAmount: v.dueAmount,
            status: v.status
          }))
        };
      } else {
        payloadData = {
          userName: user?.name || 'Customer',
          userEmail: user?.email || '',
          medicines: medicines.map(m => ({
            name: m.name,
            genericName: m.genericName,
            category: m.category,
            dosageForm: m.dosageForm,
            packaging: m.packaging,
            stock: m.stock,
            sellingPrice: m.sellingPrice
          })),
          customerOrders: sales.map(s => ({
            id: s.id,
            date: s.date,
            total: s.total,
            paymentStatus: s.paymentStatus
          }))
        };
      }

      const res = await fetch(`${apiBase}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message,
          history: historyToSend,
          role: user?.role || 'customer',
          data: payloadData
        })
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const resJson = await res.json();
      if (resJson.success && resJson.reply) {
        setAiMessages(prev => [
          ...prev,
          {
            id: `msg-${Date.now()}`,
            role: 'assistant',
            content: resJson.reply,
            timestamp: new Date().toISOString()
          }
        ]);
      } else {
        throw new Error(resJson.error || 'Failed to generate response.');
      }

    } catch (err) {
      console.error('AI chat failed:', err);
      setAiMessages(prev => [
        ...prev,
        {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: `⚠️ Sorry, I'm experiencing connectivity issues and couldn't process your request: **${err.message}**.\n\nPlease verify that your server is running and configured correctly.`,
          timestamp: new Date().toISOString()
        }
      ]);
    }
  };

  const bookAppointment = async (apptData) => {
    try {
      const { data, error } = await supabase.from('appointments').insert(apptData).select();
      if (error) throw error;
      
      setAppointments(prev => [...prev, apptData]);
      return { success: true, data: apptData };
    } catch (err) {
      console.warn("Failed to book appointment in Supabase (saving locally):", err.message);
      setAppointments(prev => [...prev, apptData]);
      return { success: true, data: apptData };
    }
  };

  const updateAppointmentStatus = async (apptId, status, rescheduleDate = null, rescheduleSlot = null) => {
    const updatePayload = { status };
    if (rescheduleDate && rescheduleSlot) {
      updatePayload.appointment_date = rescheduleDate;
      updatePayload.time_slot = rescheduleSlot;
    }
    
    try {
      const { error } = await supabase.from('appointments').update(updatePayload).eq('id', apptId);
      if (error) throw error;
      
      setAppointments(prev => prev.map(a => 
        a.id === apptId 
          ? { 
              ...a, 
              status, 
              ...(rescheduleDate && rescheduleSlot ? { appointment_date: rescheduleDate, time_slot: rescheduleSlot } : {})
            } 
          : a
      ));
      return { success: true };
    } catch (err) {
      console.warn("Failed to update appointment in Supabase (updating locally):", err.message);
      setAppointments(prev => prev.map(a => 
        a.id === apptId 
          ? { 
              ...a, 
              status, 
              ...(rescheduleDate && rescheduleSlot ? { appointment_date: rescheduleDate, time_slot: rescheduleSlot } : {})
            } 
          : a
      ));
      return { success: true };
    }
  };

  return (
    <AppContext.Provider value={{
      user, setUser, medicines, vendors, sales, purchases, cart, smsLogs,
      notifications, darkMode, aiMessages, twilioConfig, loading, dbError,
      toggleDarkMode, logout, customers, payments, appointments,
      checkOwnerEmail, sendOwnerOtp, verifyOwnerOtp, loginCustomerDirectly,
      addMedicine, updateMedicine, deleteMedicine,
      addVendor, updateVendor,
      addToCart, removeFromCart, updateCartQuantity, clearCart,
      generateBill, markPaymentSuccess, cancelPendingSale,
      addPurchase, sendVendorDueReminder,
      sendSms, addNotification, markNotificationRead, clearNotifications,
      sendAiMessage, updateTwilioConfig, getSheetDisplay, loadAllData,
      bookAppointment, updateAppointmentStatus,
    }}>
      {children}
    </AppContext.Provider>
  );
};
