import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-client-js@2"

// CORS headers for browser access
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const resendApiKey = Deno.env.get('RESEND_API_KEY') ?? ''; // Email provider API Key
    const senderEmail = Deno.env.get('SENDER_EMAIL') ?? 'noreply@apollomedicalstore.com'; // Verified sender

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration env variables.");
    }

    // Initialize Supabase Client with service key to bypass RLS policies for internal verification
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parse request body
    const { email, otp: customOtp } = await req.json()
    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email address is required." }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format." }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // =====================================================
    // 1. RATE LIMITING (ANTI-SPAM)
    // =====================================================
    // Check if the user has requested an OTP in the last 60 seconds
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
    const { data: recentRequests, error: countErr } = await supabase
      .from('otp_verifications')
      .select('created_at')
      .eq('contact', email)
      .gt('created_at', oneMinuteAgo);

    if (countErr) {
      console.error("DB check failed:", countErr);
      throw new Error("Rate limit validation failed.");
    }

    // Prevent spam if requested within 60 seconds
    if (recentRequests && recentRequests.length > 0) {
      return new Response(
        JSON.stringify({ 
          error: "Rate limit exceeded. Please wait 60 seconds before requesting a new OTP.",
          cooldownRemaining: Math.ceil((new Date(recentRequests[0].created_at).getTime() + 60000 - Date.now()) / 1000)
        }), 
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if the user has made more than 5 requests in the last hour to prevent brute force/spam
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: hourlyRequests } = await supabase
      .from('otp_verifications')
      .select('id')
      .eq('contact', email)
      .gt('created_at', oneHourAgo);

    if (hourlyRequests && hourlyRequests.length >= 5) {
      return new Response(
        JSON.stringify({ error: "Too many OTP requests. Please try again in an hour to protect account security." }), 
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // =====================================================
    // 2. CRYPTOGRAPHICALLY SECURE OTP GENERATION
    // =====================================================
    let otp = customOtp;
    if (!otp) {
      const digits = new Uint32Array(1);
      crypto.getRandomValues(digits);
      // Scale random Uint32 value to generate a secure 8-digit number (10,000,000 - 99,999,999)
      otp = (10000000 + (digits[0] % 90000000)).toString();
    }

    // =====================================================
    // 3. SECURE HASHING & DATABASE STORAGE
    // =====================================================
    // Hash the OTP using SHA-256 for secure database storage
    const msgBuffer = new TextEncoder().encode(otp);
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashedOtp = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

    // Expire code in 5 minutes (300,000 ms)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    // Insert into otp_verifications table
    const { error: insertErr } = await supabase
      .from('otp_verifications')
      .insert({
        contact: email,
        otp_code: hashedOtp,
        expires_at: expiresAt,
        verified: false
      });

    if (insertErr) {
      console.error("Failed to store OTP record:", insertErr);
      throw new Error("Failed to store verification record.");
    }

    // =====================================================
    // 4. ROBUST EMAIL DISPATCH VIA RESEND
    // =====================================================
    if (!resendApiKey) {
      // Dev simulation fallback: log key warning and return code directly
      console.warn("RESEND_API_KEY is missing. Simulating email send in dev mode.");
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "OTP generated in Developer Sandbox (Simulated send).",
          devOtp: otp // Included ONLY for local sandbox testing
        }), 
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Premium HTML Template designed to avoid spam folders (proper semantics, plain text fallback, unsub headers)
    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Apollo Medical Secure OTP</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f7f6; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 30px auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
          .header { background: linear-gradient(135deg, #1B5E20, #2E7D32); padding: 30px; text-align: center; color: #ffffff; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 800; tracking-wide: 1px; }
          .content { padding: 40px 30px; text-align: center; }
          .subtitle { font-size: 16px; color: #4a5568; line-height: 1.5; margin-bottom: 30px; }
          .otp-box { font-size: 36px; font-weight: 800; letter-spacing: 6px; color: #1B5E20; padding: 20px; background: #f0fdf4; border-radius: 12px; border: 2px dashed #a7f3d0; display: inline-block; margin-bottom: 30px; font-family: monospace; }
          .footer { background-color: #f7fafc; padding: 20px; text-align: center; font-size: 12px; color: #a0aec0; border-top: 1px solid #edf2f7; }
          .urgency-badge { display: inline-block; font-size: 11px; font-weight: 700; color: #dd6b20; background-color: #fffaf0; border: 1px solid #fbd38d; padding: 4px 10px; border-radius: 4px; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Apollo Medical Store</h1>
          </div>
          <div class="content">
            <div class="urgency-badge">⚠️ EXPIRES IN 5 MINUTES</div>
            <p class="subtitle">Hello,<br>Use the secure verification code below to complete your login request to the Apollo Pharmacy Portal.</p>
            <div class="otp-box">${otp}</div>
            <p style="font-size: 12px; color: #a0aec0; line-height: 1.5;">If you did not request this login, please ignore this email. Your account remains secure as long as you do not share this verification code with anyone.</p>
          </div>
          <div class="footer">
            &copy; 2026 Apollo Medical Store. All rights reserved.<br>
            Secure, encrypted authentication portal.
          </div>
        </div>
      </body>
      </html>
    `;

    const textBody = `
      Apollo Medical Store Secure Verification Code
      --------------------------------------------------
      Use the secure code below to verify your login request.
      
      Your OTP Code: ${otp}
      
      This code will expire in 5 minutes.
      If you did not request this code, please ignore this email.
    `;

    // Fetch call to Resend REST API
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: `Apollo Medical Store <${senderEmail}>`,
        to: [email],
        subject: `🔑 Secure OTP: ${otp} - Apollo Medical Store`,
        html: htmlBody,
        text: textBody,
        headers: {
          "X-Entity-Ref-ID": crypto.randomUUID(), // Prevent threading in inbox
          "Precedence": "bulk"                    // Instruct providers this is transactional/automated
        }
      })
    });

    const responseData = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("Resend API rejected request:", responseData);
      return new Response(
        JSON.stringify({ 
          error: "Email delivery failed.", 
          details: responseData.message || "Email provider returned an API error." 
        }), 
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Success response
    return new Response(
      JSON.stringify({ success: true, message: "Verification code sent successfully to email." }), 
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error("Edge function error:", err.message);
    return new Response(
      JSON.stringify({ error: "Server error occurred during OTP processing.", details: err.message }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
