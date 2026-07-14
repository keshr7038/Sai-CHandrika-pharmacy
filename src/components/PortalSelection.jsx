import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import {
  Activity, Mail, Lock, Phone, User, AlertCircle, ArrowRight, ArrowLeft, Key
} from 'lucide-react';

export default function UnifiedLogin() {
  const { user, setUser, addNotification, checkOwnerEmail, sendOwnerOtp } = useContext(AppContext);
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      if (user.role === 'owner') {
        navigate('/owner-dashboard');
      } else if (user.role === 'customer') {
        navigate('/customer-dashboard');
      }
    }
  }, [user, navigate]);

  // Steps: 'email_input' | 'password_input' | 'otp_verification' | 'signup'
  const [step, setStep] = useState('email_input');
  
  // Mode: 'signin' | 'signup'
  const [mode, setMode] = useState('signin');
  
  // Role of the logging-in user
  const [role, setRole] = useState('customer'); // 'owner' | 'customer'

  // Inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');

  // Status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  // 1. Handle Email Submission
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMsg('');

    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    // If mode is signup, go directly to signup form
    if (mode === 'signup') {
      setRole('customer');
      setStep('signup');
      setInfoMsg('');
      return;
    }

    // Otherwise, signin mode - check if owner or customer
    setLoading(true);
    try {
      const isOwner = await checkOwnerEmail(email);
      if (isOwner) {
        setRole('owner');
        const res = await sendOwnerOtp(email);
        if (res.success) {
          setStep('otp_verification');
          setInfoMsg(`Owner verification initiated! We sent a code/login link to ${email}.`);
        } else {
          setError(res.error || 'Failed to send owner login code.');
        }
      } else {
        setRole('customer');
        setStep('password_input');
      }
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Handle Password Sign In (Customer)
  const handlePasswordSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMsg('');

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      // Sign in with password via Supabase
      const { data, error: authErr } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password
      });

      if (authErr) throw authErr;

      if (!data?.user) {
        throw new Error("Login completed but no user details were returned.");
      }

      // Fetch customer profile
      const { data: profile, error: dbErr } = await supabase
        .from('customers')
        .select('*')
        .eq('email', email.trim().toLowerCase())
        .maybeSingle();

      if (dbErr) throw dbErr;

      const lastLogin = new Date().toISOString();
      let customerProfile = profile;

      if (!customerProfile) {
        // Fallback profile creation
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
      addNotification("Logged in successfully!", "success");
      navigate('/customer-dashboard');
    } catch (err) {
      if (err.message?.toLowerCase().includes('email not confirmed')) {
        setError('Email not confirmed. Please check your inbox or verify using OTP.');
      } else {
        setError(err.message || 'Login failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  // 3. Handle Customer Signup Submission with OTP
  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMsg('');

    if (!name.trim() || !email.trim() || !phone.trim() || !password) {
      setError('All fields are required.');
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
      const normEmail = email.trim().toLowerCase();
      
      // Send OTP to email for verification (user will be created on verification)
      const { error: otpErr } = await supabase.auth.signInWithOtp({
        email: normEmail,
        options: { shouldCreateUser: true }
      });

      if (otpErr) throw otpErr;

      // Transition to OTP verification
      setStep('otp_verification');
      setOtp('');
      setInfoMsg("We sent a 6-digit OTP code to your email. Enter it below to verify your account and complete registration.");
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // 4. Handle OTP verification (Owner Login OR Customer Signup Confirmation)
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMsg('');

    if (!otp || otp.length < 8) {
      setError('Please enter the 8-digit verification code.');
      return;
    }

    setLoading(true);
    try {
      const cleanPhone = phone.trim().replace(/\D/g, '');
      const normEmail = email.trim().toLowerCase();

      // Verify OTP with Supabase
      const { data, error: authErr } = await supabase.auth.verifyOtp({
        email: normEmail,
        token: otp.trim(),
        type: 'email'
      });

      if (authErr) throw authErr;

      if (!data?.user) {
        throw new Error("Verification completed but no user details were returned.");
      }

      if (role === 'owner') {
        // Log Owner Login
        // Insert log in owner_logs
        await supabase.from('owner_logs').insert({
          email: normEmail,
          login_time: new Date().toISOString()
        });

        // Insert log in owner_login_logs
        let ip = 'Unknown';
        try {
          const res = await fetch('https://api.ipify.org?format=json');
          const data = await res.json();
          ip = data.ip;
        } catch (e) {
          console.warn("Failed to fetch IP:", e.message);
        }
        await supabase.from('owner_login_logs').insert({
          phone_number: normEmail,
          ip_address: ip,
          device_info: navigator.userAgent
        });

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
        navigate('/owner-dashboard');
      } else {
        // Customer Profile Insert/Sync
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
        localStorage.setItem('saichandrika_user', JSON.stringify(userData));
        addNotification("Email verified and logged in successfully!", "success");
        navigate('/customer-dashboard');
      }
    } catch (err) {
      setError(err.message || 'OTP verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToEmail = () => {
    setStep('email_input');
    setMode('signin');
    setError('');
    setInfoMsg('');
    setPassword('');
    setOtp('');
    setName('');
    setPhone('');
  };

  return (
    <div className="onboarding-container">
      {/* Left Panel: Auth Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 z-10">
        <div className="w-full max-w-md onboarding-card animate-scale-in">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shadow-lg"
                 style={{ background: 'linear-gradient(135deg, #2E7D32, #1B5E20)' }}>
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold gradient-text-dark">Sai Chandrika Pharmacy</h1>
              <p className="text-[11px] text-dark-muted tracking-wide">Pharmacy Portal</p>
            </div>
          </div>

          {/* Title & Description */}
          <div className="mb-6 relative">
            {step !== 'email_input' && (
              <button 
                type="button" 
                onClick={handleBackToEmail}
                className="absolute -top-1 left-0 flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300 font-semibold cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
            )}
            <div className="flex items-center justify-between">
              <h2 className={`text-2xl font-bold text-dark-text ${step !== 'email_input' ? 'pt-6' : ''}`}>
                {step === 'email_input' && (mode === 'signin' ? 'Sign In' : 'Create Account')}
                {step === 'password_input' && 'Enter Password'}
                {step === 'otp_verification' && 'Verify Code'}
                {step === 'signup' && 'Create Customer Account'}
              </h2>
              {step === 'email_input' && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setMode('signin'); setError(''); setInfoMsg(''); setEmail(''); }}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      mode === 'signin' 
                        ? 'bg-primary-600/20 text-primary-400 border border-primary-500/30' 
                        : 'text-dark-muted hover:text-dark-text border border-transparent hover:border-dark-border'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMode('signup'); setError(''); setInfoMsg(''); setEmail(''); }}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      mode === 'signup' 
                        ? 'bg-primary-600/20 text-primary-400 border border-primary-500/30' 
                        : 'text-dark-muted hover:text-dark-text border border-transparent hover:border-dark-border'
                    }`}
                  >
                    Sign Up
                  </button>
                </div>
              )}
            </div>
            <p className="text-sm text-dark-muted mt-1.5">
              {step === 'email_input' && (mode === 'signin' ? 'Enter your email address to log in to the system.' : 'Enter your email address to create a new account.')}
              {step === 'password_input' && `Welcome back! Please enter the password for ${email}.`}
              {step === 'otp_verification' && `Enter the 8-digit OTP code sent to ${email}.`}
              {step === 'signup' && `Please fill in details to register account for ${email}.`}
            </p>
          </div>

          {/* Status Messages */}
          {infoMsg && (
            <div className="p-3.5 rounded-xl bg-primary-950/20 border border-primary-900/30 text-xs text-primary-400 mb-4 animate-slide-down">
              {infoMsg}
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-950/30 border border-red-900/40 text-xs text-red-400 mb-4 animate-slide-down">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Forms */}
          <form 
            onSubmit={
              step === 'email_input' ? handleEmailSubmit :
              step === 'password_input' ? handlePasswordSignIn :
              step === 'signup' ? handleSignUp : handleVerifyOtp
            } 
            className="space-y-4"
          >
            {/* Email Field (Visible in Email Input step) */}
            {step === 'email_input' && (
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

            {/* Password Field (Visible in Password Input step) */}
            {step === 'password_input' && (
              <div>
                <label className="input-label-dark">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-dark-muted">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-dark pl-10"
                    required
                    autoFocus
                  />
                </div>
              </div>
            )}

            {/* Signup Fields (Visible in Signup step) */}
            {step === 'signup' && (
              <>
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

                <div>
                  <label className="input-label-dark">Create Password</label>
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
              </>
            )}

            {/* OTP Field (Visible in OTP Verification step) */}
            {step === 'otp_verification' && (
              <div>
                <label className="input-label-dark">Verification Code (OTP)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-dark-muted">
                    <Key className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    pattern="[0-9]*"
                    inputMode="numeric"
                    maxLength={8}
                    placeholder="Enter 8-digit code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="input-dark pl-10"
                    required
                    autoFocus
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed text-white shadow-lg"
              style={{ background: 'linear-gradient(135deg, #2E7D32, #1B5E20)' }}
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {step === 'email_input' && 'Continue'}
                  {step === 'password_input' && 'Sign In'}
                  {step === 'signup' && 'Create Account'}
                  {step === 'otp_verification' && 'Verify & Log In'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Toggle / Secondary Actions */}
          <div className="mt-6 text-center text-xs text-dark-muted">
            {step === 'password_input' && (
              <p>
                Don't have an account?{' '}
                <button type="button" onClick={() => { setStep('signup'); setError(''); setInfoMsg(''); }} className="text-primary-400 font-semibold hover:underline cursor-pointer">
                  Register here
                </button>
              </p>
            )}
            {step === 'signup' && (
              <p>
                Already have an account?{' '}
                <button type="button" onClick={() => { setStep('password_input'); setError(''); setInfoMsg(''); }} className="text-primary-400 font-semibold hover:underline cursor-pointer">
                  Sign in
                </button>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Right Panel: Premium Decorative Banner */}
      <div className="hidden lg:flex flex-1 bg-dark-card relative overflow-hidden items-center justify-center border-l border-dark-border">
        {/* Animated Background shapes */}
        <div className="absolute top-16 right-20 w-32 h-32 rounded-2xl opacity-20 animate-float"
             style={{ background: '#2E7D32', transform: 'rotate(12deg)' }} />
        <div className="absolute top-36 right-44 w-20 h-20 rounded-xl opacity-15"
             style={{ background: '#66BB6A', transform: 'rotate(-8deg)' }} />
        <div className="absolute bottom-32 left-16 w-40 h-28 rounded-2xl opacity-15 animate-float"
             style={{ background: '#1B5E20', transform: 'rotate(6deg)', animationDelay: '1s' }} />

        <div className="relative z-10 text-center px-12">
          <div className="w-20 h-20 rounded-2xl mx-auto mb-8 flex items-center justify-center animate-glow animate-pulse"
               style={{ background: 'linear-gradient(135deg, #2E7D32, #1B5E20)' }}>
            <Activity className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-dark-text mb-3">Sai Chandrika Pharmacy</h2>
          <p className="text-dark-muted text-sm leading-relaxed max-w-xs mx-auto mb-10">
            Pharmacy management, real-time POS sales operations, restock audits, and patient invoicing.
          </p>
        </div>
      </div>
    </div>
  );
}
