/**
 * Twilio SMS Service for Shekar Medicals
 * 
 * This module handles real SMS sending via Twilio REST API.
 * For production, route these calls through a Supabase Edge Function
 * or a backend proxy to protect your Auth Token.
 * 
 * Setup: Owner enters Twilio credentials in Profile > SMS Settings
 */

import { supabase } from '../lib/supabase';

const TWILIO_STORAGE_KEY = 'apollo_twilio_config';

// Load saved Twilio config from localStorage
export function getTwilioConfig() {
  try {
    const saved = localStorage.getItem(TWILIO_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.warn('Failed to load Twilio config:', e);
  }
  return {
    accountSid: '',
    authToken: '',
    fromNumber: '',
    enabled: false,
  };
}

// Save Twilio config to localStorage
export function saveTwilioConfig(config) {
  try {
    localStorage.setItem(TWILIO_STORAGE_KEY, JSON.stringify(config));
    return true;
  } catch (e) {
    console.error('Failed to save Twilio config:', e);
    return false;
  }
}

// Clear Twilio config
export function clearTwilioConfig() {
  localStorage.removeItem(TWILIO_STORAGE_KEY);
}

/**
 * Send SMS via Twilio REST API
 * 
 * NOTE: In production, use a backend proxy (Supabase Edge Function / Express API)
 * to avoid exposing your Auth Token in the browser.
 * 
 * @param {string} to - Recipient phone number (E.164 format: +91XXXXXXXXXX)
 * @param {string} body - SMS message body
 * @returns {Promise<{success: boolean, sid?: string, error?: string}>}
 */
export async function sendTwilioSms(to, body) {
  const config = getTwilioConfig();

  if (!config.enabled || !config.accountSid || !config.authToken || !config.fromNumber) {
    return {
      success: false,
      error: 'Twilio not configured. Go to Profile → SMS Settings to set up.',
      simulated: true,
    };
  }

  // Normalize phone number to E.164
  let normalizedTo = to.replace(/[\s\-()]/g, '');
  if (!normalizedTo.startsWith('+')) {
    normalizedTo = '+91' + normalizedTo.replace(/^0/, '');
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + btoa(`${config.accountSid}:${config.authToken}`),
      },
      body: new URLSearchParams({
        To: normalizedTo,
        From: config.fromNumber,
        Body: body,
      }).toString(),
    });

    const data = await response.json();

    if (response.ok) {
      return {
        success: true,
        sid: data.sid,
        status: data.status,
      };
    } else {
      return {
        success: false,
        error: data.message || `Twilio error: ${data.code}`,
        code: data.code,
      };
    }
  } catch (err) {
    // CORS error is expected when calling Twilio directly from browser
    // In production, route via Supabase Edge Function
    return {
      success: false,
      error: `Network error: ${err.message}. For production, use a backend proxy (Supabase Edge Function).`,
      corsBlocked: true,
    };
  }
}

/**
 * Send SMS with fallback — tries Twilio first, falls back to simulation
 * @param {string} to 
 * @param {string} body 
 * @returns {Promise<{success: boolean, method: 'twilio'|'simulated', sid?: string, error?: string}>}
 */
export async function sendSmsWithFallback(to, body) {
  // 1. First, try to send via the secure Supabase Edge Function 'send-sms'
  try {
    const { data, error } = await supabase.functions.invoke('send-sms', {
      body: { to, message: body }
    });
    if (!error && data?.success) {
      return { success: true, method: 'twilio', sid: data.sid };
    }
    if (error) {
      console.warn('Supabase Edge Function send-sms returned error:', error);
    }
  } catch (e) {
    console.warn('Failed to invoke send-sms Edge Function:', e.message);
  }

  // 2. Fallback to client-side direct Twilio call (if enabled/configured in local settings)
  const config = getTwilioConfig();
  if (config.enabled) {
    const result = await sendTwilioSms(to, body);
    if (result.success) {
      return { ...result, method: 'twilio' };
    }
    console.warn('Local Twilio SMS failed:', result.error);
    return {
      success: true,
      method: 'simulated',
      fallbackReason: result.error,
    };
  }

  // 3. Fallback to pure simulation
  return {
    success: true,
    method: 'simulated',
  };
}

// SMS Templates
export const SMS_TEMPLATES = {
  lowStock: (medicineName, currentStock, minStock, shopName = 'Shekar Medicals') =>
    `⚠️ LOW STOCK ALERT — ${shopName}\n\n${medicineName} has only ${currentStock} units left (minimum: ${minStock}).\n\nPlease restock immediately to avoid stockouts.\n\n— Shekar Medicals`,

  paymentSuccess: (invoiceId, amount, shopName = 'Shekar Medicals') =>
    `✅ Payment Received — ${shopName}\n\nYour payment of ₹${amount} for Invoice ${invoiceId} has been received successfully.\n\nThank you for shopping with us! Stay healthy! 🏥\n\n— Shekar Medicals`,

  paymentReminder: (invoiceId, amount) =>
    `📩 Payment Reminder\n\nYour invoice ${invoiceId} of ₹${amount} is pending.\n\nPlease complete the payment at Shekar Medicals.\n\n— Shekar Medicals`,

  vendorDueReminder: (vendorName, dueAmount) =>
    `📩 Payment Reminder\n\nDear ${vendorName}, you have an outstanding balance of ₹${dueAmount} with Shekar Medicals.\n\nKindly clear the dues at the earliest.\n\nThank you!`,

  expiryAlert: (medicineName, expiryDate) =>
    `⚠️ EXPIRY ALERT\n\n${medicineName} is expiring on ${expiryDate}.\n\nPlease review and take necessary action.\n\n— Shekar Medicals`,
};
