const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Razorpay = require('razorpay');
const { supabase } = require('../lib/supabaseClient.cjs');

// Initialize Razorpay Client helper (checks if keys are configured)
const isRazorpayConfigured = () => {
  return !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
};

const getRazorpayClient = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  
  if (!keyId || !keySecret) {
    throw new Error('Razorpay API keys (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET) are not configured.');
  }
  
  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
};

/**
 * POST /create-order
 * Accepts { amount, receipt, notes }
 * Creates a Razorpay order
 */
router.post('/create-order', async (req, res) => {
  try {
    const { amount, receipt, notes } = req.body;

    if (!amount) {
      return res.status(400).json({ success: false, error: 'Amount is required.' });
    }

    const amountInPaise = Math.round(parseFloat(amount) * 100);

    if (!isRazorpayConfigured()) {
      console.warn('Razorpay keys not configured. Returning mock order details for testing.');
      return res.status(200).json({
        success: true,
        order_id: `order_mock_${Date.now()}`,
        amount: amountInPaise,
        currency: 'INR',
        key_id: 'rzp_test_mockKeyId12345',
        is_mock: true
      });
    }

    const razorpay = getRazorpayClient();
    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: receipt || `rcpt_${Date.now()}`,
      notes: notes || {}
    };

    const order = await razorpay.orders.create(options);

    return res.status(200).json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: process.env.RAZORPAY_KEY_ID
    });

  } catch (err) {
    console.error('Error creating Razorpay order:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Failed to create payment order.',
      details: err.message
    });
  }
});

/**
 * POST /verify-payment
 * Accepts { order_id, payment_id, signature, user_id, sale_id, amount }
 * Verifies signature and records payment in Supabase
 */
router.post('/verify-payment', async (req, res) => {
  try {
    const { order_id, payment_id, signature, user_id, sale_id, amount } = req.body;

    if (!order_id || !payment_id || !signature) {
      return res.status(400).json({ success: false, error: 'Missing payment verification fields.' });
    }

    // Check if mock payment
    if (order_id.startsWith('order_mock_') || signature === 'mock_signature') {
      console.log('Verifying mock payment for order:', order_id);
      
      const amountVal = amount ? parseInt(amount) : 0;

      // Check if payment already exists to prevent duplicate UTRs
      if (payment_id) {
        const { data: existingPayment, error: queryErr } = await supabase
          .from('payments')
          .select('id')
          .eq('payment_id', payment_id)
          .maybeSingle();

        if (queryErr) {
          console.error('Database query error checking UTR uniqueness:', queryErr);
        }

        if (existingPayment) {
          return res.status(400).json({ success: false, error: 'This transaction (UTR) has already been processed.' });
        }
      }

      // Log payment in Supabase
      await supabase.from('payments').insert({
        user_id: user_id || null,
        order_id: order_id,
        payment_id: payment_id || `pay_mock_${Date.now()}`,
        amount: amountVal,
        status: 'success',
        created_at: new Date().toISOString()
      });

      // Update sale payment status
      if (sale_id) {
        await supabase
          .from('sales')
          .update({ payment_status: 'Success' })
          .eq('id', sale_id);
      }

      return res.status(200).json({
        success: true,
        message: 'Mock payment verified and logged successfully.'
      });
    }

    // 1. Signature Verification
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return res.status(500).json({ success: false, error: 'Razorpay secret key not configured on server.' });
    }

    const generatedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(order_id + '|' + payment_id)
      .digest('hex');

    if (generatedSignature !== signature) {
      console.warn('Signature verification mismatch.');
      return res.status(400).json({ success: false, error: 'Payment verification failed (invalid signature).' });
    }

    // 2. Insert payment details into Supabase
    // If amount is not passed, default to 0 or try to fetch it
    const amountVal = amount ? parseInt(amount) : 0;
    
    // Check if payment already exists to prevent duplicates
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('id')
      .eq('payment_id', payment_id)
      .maybeSingle();

    if (!existingPayment) {
      const { error: payErr } = await supabase.from('payments').insert({
        user_id: user_id || null,
        order_id: order_id,
        payment_id: payment_id,
        amount: amountVal,
        status: 'success',
        created_at: new Date().toISOString()
      });

      if (payErr) {
        console.error('Failed to log payment in database:', payErr.message);
      }
    }

    // 3. Update sale payment status to Success
    if (sale_id) {
      const { error: saleErr } = await supabase
        .from('sales')
        .update({ payment_status: 'Success' })
        .eq('id', sale_id);

      if (saleErr) {
        console.error('Failed to update sale status in database:', saleErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Payment verified and logged successfully.'
    });

  } catch (err) {
    console.error('Error verifying payment:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Internal server error during verification.',
      details: err.message
    });
  }
});

/**
 * POST /webhook
 * Handles incoming webhooks from Razorpay
 */
router.post('/webhook', async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!signature || !webhookSecret) {
      console.warn('Webhook received but signature or secret is missing.');
      return res.status(400).json({ success: false, error: 'Missing validation details.' });
    }

    // Validate signature
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(req.rawBody)
      .digest('hex');

    if (expectedSignature !== signature) {
      console.warn('Webhook signature mismatch.');
      return res.status(400).json({ success: false, error: 'Invalid webhook signature.' });
    }

    const event = req.body.event;
    console.log(`📩 Webhook received: ${event}`);

    if (event === 'payment.captured') {
      const payment = req.body.payload.payment.entity;
      const order_id = payment.order_id;
      const payment_id = payment.id;
      const amount = payment.amount;
      const notes = payment.notes || {};
      const sale_id = notes.sale_id;
      const user_id = notes.user_id;

      // Check if payment already logged
      const { data: existing } = await supabase
        .from('payments')
        .select('id')
        .eq('payment_id', payment_id)
        .maybeSingle();

      if (!existing) {
        // Insert payment log
        const { error: payErr } = await supabase.from('payments').insert({
          user_id: user_id || null,
          order_id: order_id || '',
          payment_id: payment_id,
          amount: amount,
          status: 'success',
          created_at: new Date().toISOString()
        });

        if (payErr) console.error('Webhook: failed to insert payment record:', payErr.message);
      }

      // Update sale status
      if (sale_id) {
        const { error: saleErr } = await supabase
          .from('sales')
          .update({ payment_status: 'Success' })
          .eq('id', sale_id);

        if (saleErr) console.error('Webhook: failed to update sale status:', saleErr.message);
      }
    }

    // Always return 200 OK to Razorpay to acknowledge receipt
    return res.status(200).json({ status: 'ok' });

  } catch (err) {
    console.error('Webhook error:', err.message);
    return res.status(500).json({ success: false, error: 'Internal webhook error.' });
  }
});

module.exports = router;
