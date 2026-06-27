const express = require('express');
const router = express.Router();
const { supabase } = require('../lib/supabaseClient.cjs');

/**
 * POST /send-otp
 * Accept { email } in request body
 * Call supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } })
 * Return success message if OTP sent, error message if failed
 */
router.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body;

    // Validation
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email address is required.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, error: 'Invalid email address format.' });
    }

    // Call Supabase Auth signInWithOtp
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true
      }
    });

    if (error) {
      console.error('Supabase signInWithOtp error:', error.message);
      return res.status(error.status || 400).json({ success: false, error: error.message });
    }

    return res.status(200).json({ 
      success: true, 
      message: 'OTP verification code sent successfully.',
      data 
    });

  } catch (err) {
    console.error('Error in /send-otp route:', err);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error occurred during OTP dispatch.', 
      details: err.message 
    });
  }
});

/**
 * POST /verify-otp
 * Accept { email, token } in request body
 * Call supabase.auth.verifyOtp({ email, token, type: "email" })
 * On success return the session (access_token, refresh_token, user)
 * On failure return error message
 */
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, token } = req.body;

    // Validation
    if (!email || !token) {
      return res.status(400).json({ success: false, error: 'Email and OTP token are required.' });
    }

    // Call Supabase Auth verifyOtp
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email'
    });

    if (error) {
      console.error('Supabase verifyOtp error:', error.message);
      return res.status(error.status || 400).json({ success: false, error: error.message });
    }

    const session = data?.session;
    const user = data?.user;

    if (!session) {
      return res.status(400).json({ 
        success: false, 
        error: 'OTP is valid, but failed to establish session. Please try again.' 
      });
    }

    // Return the session tokens and user profiles
    return res.status(200).json({
      success: true,
      message: 'OTP verified successfully.',
      session: {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          created_at: user.created_at,
          last_sign_in_at: user.last_sign_in_at
        }
      }
    });

  } catch (err) {
    console.error('Error in /verify-otp route:', err);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error occurred during verification.', 
      details: err.message 
    });
  }
});

module.exports = router;
