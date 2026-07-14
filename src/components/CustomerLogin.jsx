import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import { Activity, Mail, Lock, Phone, User, AlertCircle, ArrowRight } from 'lucide-react';

export default function CustomerLogin() {
  const { user, setUser, addNotification } = useContext(AppContext);
  const navigate = useNavigate();

  // Redirect if already logged in as customer
  useEffect(() => {
    if (user && user.role === 'customer') {
      navigate('/customer-dashboard');
    }
  }, [user, navigate]);

  // Mode: 'signin' | 'signup'
  const [mode, setMode] = useState('signin');

  // Inputs
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');

  // Status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  // Handle Sign In
  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMsg('');

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      // 1. Authenticate using Supabase Auth
      const { data, error: authErr } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password
      });

      if (authErr) throw authErr;

      // 2. Fetch the corresponding profile from the database customers table
      const { data: profile, error: dbErr } = await supabase
        .from('customers')
        .select('*')
        .eq('email', email.trim().toLowerCase())
        .maybeSingle();

      if (dbErr) throw dbErr;

      const lastLogin = new Date().toISOString();
      let customerProfile = profile;

      if (!customerProfile) {
        // Fallback: Create customer profile if missing in database
        const { data: newCust, error: insertErr } = await supabase
          .from('customers')
          .insert({
            id: data.user.id,
            name: email.split('@')[0],
            email: email.trim().toLowerCase(),
            phone: '',
            created_at: new Date().toISOString()
          })
          .select()
          .single();
        if (insertErr) throw insertErr;
        customerProfile = newCust;
      }

      // 3. Update the login log
      await supabase
        .from('customers')
        .update({ last_login: lastLogin })
        .eq('id', customerProfile.id);

      const userData = {
        id: data.user.id,
        name: customerProfile.name,
        email: customerProfile.email,
        phone: customerProfile.phone || '',
        role: 'customer',
        createdAt: customerProfile.created_at,
        lastLogin: lastLogin
      };

      // 4. Update the client session state
      setUser(userData);
      localStorage.setItem('apollo_user', JSON.stringify(userData));
      addNotification("Logged in successfully!", "success");
      navigate('/customer-dashboard');
    } catch (err) {
      if (err.message?.toLowerCase().includes('email not confirmed')) {
        setError('Email not confirmed. Please check your inbox to verify your account, or disable email confirmation in your Supabase Auth settings.');
      } else {
        setError(err.message || 'Login failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Sign Up
  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMsg('');

    if (!name.trim() || !email || !password || !phone.trim()) {
      setError('All fields are required.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    const cleanPhone = phone.trim().replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setError('Phone number must be exactly 10 digits.');
      return;
    }

    setLoading(true);
    try {
      // 1. Create User in Supabase Auth
      const { data, error: authErr } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password
      });

      if (authErr) throw authErr;

      if (!data?.user) {
        throw new Error("Sign up completed but no user details were returned.");
      }

      // 2. Handle email confirmation workflow
      if (data.session) {
        // If email verification is off, create DB profile and log in directly
        const { error: dbErr } = await supabase
          .from('customers')
          .insert({
            id: data.user.id,
            name: name.trim(),
            email: email.trim().toLowerCase(),
            phone: cleanPhone,
            created_at: new Date().toISOString()
          });
        if (dbErr) throw dbErr;

        const lastLogin = new Date().toISOString();
        await supabase.from('customers').update({ last_login: lastLogin }).eq('id', data.user.id);

        const userData = {
          id: data.user.id,
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: cleanPhone,
          role: 'customer',
          createdAt: new Date().toISOString(),
          lastLogin: lastLogin
        };

        setUser(userData);
        localStorage.setItem('shekarmedicals_user', JSON.stringify(userData));
        addNotification("Account created & logged in successfully!", "success");
        navigate('/customer-dashboard');
      } else {
        // If email confirmation is required, transition to OTP verification mode!
        setMode('otp_verification');
        setOtp('');
        setInfoMsg("Account registered! We sent a 6-digit verification code to your email. Please enter it below to confirm your registration.");
      }
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP verification for Signup
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMsg('');

    if (!otp || otp.length < 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setLoading(true);
    try {
      const cleanPhone = phone.trim().replace(/\D/g, '');
      const normEmail = email.trim().toLowerCase();

      // 1. Verify OTP with Supabase Auth
      const { data, error: authErr } = await supabase.auth.verifyOtp({
        email: normEmail,
        token: otp.trim(),
        type: 'signup'
      });

      if (authErr) throw authErr;

      if (!data?.user) {
        throw new Error("Verification completed but no user details were returned.");
      }

      // 2. Insert new profile into customers table
      const { data: existingProfile } = await supabase
        .from('customers')
        .select('*')
        .eq('email', normEmail)
        .maybeSingle();

      let customerProfile = existingProfile;
      if (!customerProfile) {
        const { data: newCust, error: dbErr } = await supabase
          .from('customers')
          .insert({
            id: data.user.id,
            name: name.trim() || normEmail.split('@')[0],
            email: normEmail,
            phone: cleanPhone || '',
            created_at: new Date().toISOString()
          })
          .select()
          .single();
        if (dbErr) throw dbErr;
        customerProfile = newCust;
      } else {
        await supabase
          .from('customers')
          .update({
            id: data.user.id,
            name: name.trim() || customerProfile.name,
            phone: cleanPhone || customerProfile.phone
          })
          .eq('email', normEmail);
        customerProfile.name = name.trim() || customerProfile.name;
        customerProfile.phone = cleanPhone || customerProfile.phone;
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
      localStorage.setItem('shekarmedicals_user', JSON.stringify(userData));
      addNotification("Email verified and logged in successfully!", "success");
      navigate('/customer-dashboard');
    } catch (err) {
      setError(err.message || 'OTP verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="onboarding-container">
      {/* Left: Auth Card */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md onboarding-card animate-scale-in">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center shadow-lg"
                   style={{ background: 'linear-gradient(135deg, #2E7D32, #1B5E20)' }}>
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold gradient-text-dark">Shekar Medicals</h1>
                <p className="text-[11px] text-dark-muted tracking-wide">Customer Portal</p>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-dark-text mb-2">
              {mode === 'signin' ? 'Customer Sign In' : (mode === 'signup' ? 'Create Customer Account' : 'Verify Registration')}
            </h2>
            <p className="text-sm text-dark-muted">
              {mode === 'signin' 
                ? 'Sign in with your email and password to access the store.' 
                : (mode === 'signup' 
                  ? 'Sign up to check invoices, track orders, and browse medicine catalog.'
                  : `Enter the code sent to ${email} to complete your registration.`)}
            </p>
          </div>

          {infoMsg && (
            <div className="p-3.5 rounded-xl bg-primary-950/20 border border-primary-900/30 text-xs text-primary-400 mt-4 animate-slide-down">
              {infoMsg}
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-950/30 border border-red-900/40 text-xs text-red-400 mt-4 animate-slide-down">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={mode === 'signin' ? handleSignIn : (mode === 'signup' ? handleSignUp : handleVerifyOtp)} className="space-y-4 mt-6">
            {mode === 'signup' && (
              <div>
                <label className="input-label-dark">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-dark-muted">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input-dark pl-10"
                    required
                  />
                </div>
              </div>
            )}

            {mode !== 'otp_verification' && (
              <div>
                <label className="input-label-dark">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-dark-muted">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-dark pl-10"
                    required
                  />
                </div>
              </div>
            )}

            {mode === 'signup' && (
              <div>
                <label className="input-label-dark">Mobile Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-dark-muted">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    placeholder="10-digit mobile number"
                    maxLength="10"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="input-dark pl-10"
                    required
                  />
                </div>
              </div>
            )}

            {mode !== 'otp_verification' && (
              <div>
                <label className="input-label-dark">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-dark-muted">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    placeholder="Minimum 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-dark pl-10"
                    required
                  />
                </div>
              </div>
            )}

            {mode === 'otp_verification' && (
              <div>
                <label className="input-label-dark">Verification Code (OTP)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-dark-muted">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    pattern="[0-9]*"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="Enter 6-digit code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="input-dark pl-10"
                    required
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed text-white shadow-lg"
              style={{ background: 'linear-gradient(135deg, #2E7D32, #1B5E20)' }}
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>{mode === 'signin' ? 'Sign In' : (mode === 'signup' ? 'Create Account' : 'Verify & Log In')} <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs">
            {mode === 'otp_verification' ? (
              <p className="text-dark-muted">
                Didn't get the code?{' '}
                <button type="button" onClick={() => { setMode('signup'); setError(''); setInfoMsg(''); }} className="text-primary-400 font-semibold hover:underline">
                  Go Back
                </button>
              </p>
            ) : mode === 'signin' ? (
              <p className="text-dark-muted">
                New to Shekar Medicals?{' '}
                <button type="button" onClick={() => { setMode('signup'); setError(''); setInfoMsg(''); }} className="text-primary-400 font-semibold hover:underline">
                  Create an account
                </button>
              </p>
            ) : (
              <p className="text-dark-muted">
                Already have an account?{' '}
                <button type="button" onClick={() => { setMode('signin'); setError(''); setInfoMsg(''); }} className="text-primary-400 font-semibold hover:underline">
                  Sign In
                </button>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Right: Decorative Panel */}
      <div className="hidden lg:flex flex-1 bg-dark-card relative overflow-hidden items-center justify-center border-l border-dark-border">
        {/* Geometric Shapes */}
        <div className="absolute top-16 right-20 w-32 h-32 rounded-2xl opacity-20 animate-float"
             style={{ background: '#2E7D32', transform: 'rotate(12deg)' }} />
        <div className="absolute top-36 right-44 w-20 h-20 rounded-xl opacity-15"
             style={{ background: '#66BB6A', transform: 'rotate(-8deg)' }} />
        <div className="absolute bottom-32 left-16 w-40 h-28 rounded-2xl opacity-15 animate-float"
             style={{ background: '#1B5E20', transform: 'rotate(6deg)', animationDelay: '1s' }} />

        {/* Center Content */}
        <div className="relative z-10 text-center px-12">
          <div className="w-20 h-20 rounded-2xl mx-auto mb-8 flex items-center justify-center animate-glow animate-pulse"
               style={{ background: 'linear-gradient(135deg, #2E7D32, #1B5E20)' }}>
            <Activity className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-dark-text mb-3">Shekar Medicals</h2>
          <p className="text-dark-muted text-sm leading-relaxed max-w-xs mx-auto mb-10">
            Access purchase details, download medical billing records, and consult pharmacy catalog items.
          </p>
        </div>
      </div>
    </div>
  );
}
