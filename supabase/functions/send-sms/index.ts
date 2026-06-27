import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID') ?? '';
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN') ?? '';
    const fromNumber = Deno.env.get('TWILIO_FROM_NUMBER') ?? '';

    if (!accountSid || !authToken || !fromNumber) {
      throw new Error("Missing Twilio configuration environment variables on Supabase.");
    }

    const { to, message } = await req.json();
    if (!to || !message) {
      return new Response(
        JSON.stringify({ error: "Parameters 'to' and 'message' are required." }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Normalize phone number to E.164 format
    let normalizedTo = to.replace(/[\s\-()]/g, '');
    if (!normalizedTo.startsWith('+')) {
      normalizedTo = '+91' + normalizedTo.replace(/^0/, '');
    }

    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    
    // Twilio REST API uses basic authorization
    const authString = btoa(`${accountSid}:${authToken}`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${authString}`,
      },
      body: new URLSearchParams({
        To: normalizedTo,
        From: fromNumber,
        Body: message,
      }).toString(),
    });

    const data = await response.json();

    if (response.ok) {
      return new Response(
        JSON.stringify({ success: true, sid: data.sid }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      console.error("Twilio error response:", data);
      return new Response(
        JSON.stringify({ error: data.message || `Twilio error: ${data.code}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

  } catch (err) {
    console.error("send-sms Edge Function error:", err.message);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
