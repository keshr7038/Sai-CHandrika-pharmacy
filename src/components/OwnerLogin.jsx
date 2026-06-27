import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { Activity, Mail, Timer, Check, RotateCcw, AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react';

export default function OwnerLogin() {
  const {
    checkOwnerEmail,
    sendOwnerOtp,
    verifyOwnerOtp,
    user
  } = useContext(AppContext);

  const navigate = useNavigate();

  // Redirect if already logged in as owner
  useEffect(() => {
    if (user && user.role === 'owner') {
      navigate('/owner-dashboard');
    }
  }, [user, navigate]);

  // Steps: 'email_input' | 'otp_verification'
  const [step, setStep] = useState('email_input');
  
  // Inputs
  const [email, setEmail] = useState('');
  const [otpArray, setOtpArray] = useState(['', '', '', '', '', '', '', '']);
  const otpInputsRef = useRef([]);

  // Timers
  const [timer, setTimer] = useState(300); // 5 minutes
  const [resendCooldown, setResendCooldown] = useState(30); // 30 seconds cooldown
  const [timerActive, setTimerActive] = useState(false);
  const [cooldownActive, setCooldownActive] = useState(false);

  // Status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Timers handler
  const startOtpTimers = () => {
    setTimer(300);
    setResendCooldown(30);
    setTimerActive(true);
    setCooldownActive(true);
    setOtpArray(['', '', '', '', '', '', '', '']);
    setTimeout(() => {
      if (otpInputsRef.current[0]) otpInputsRef.current[0].focus();
    }, 100);
  };

  useEffect(() => {
    let interval = null;
    if (timerActive && timer > 0) {
      interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setTimerActive(false);
      setError('OTP has expired. Please request a new code.');
    }
    return () => clearInterval(interval);
  }, [timerActive, timer]);

  useEffect(() => {
    let interval = null;
    if (cooldownActive && resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown(prev => prev - 1);
      }, 1000);
    } else if (resendCooldown === 0) {
      setCooldownActive(false);
    }
    return () => clearInterval(interval);
  }, [cooldownActive, resendCooldown]);

  // Handle owner email submission
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const isOwner = await checkOwnerEmail(email);
      if (isOwner) {
        const res = await sendOwnerOtp(email);
        if (res.success) {
          setSuccessMsg(`An 8-digit verification code was sent to ${email}`);
          startOtpTimers();
          setStep('otp_verification');
        } else {
          setError(res.error || 'Failed to send verification code.');
        }
      } else {
        setError('Access denied. You are not authorized as an owner.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP digit changes
  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otpArray];
    newOtp[index] = value.substring(value.length - 1);
    setOtpArray(newOtp);

    // Focus next input
    if (value && index < 7) {
      otpInputsRef.current[index + 1].focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpArray[index] && index > 0) {
      otpInputsRef.current[index - 1].focus();
    }
  };

  // Handle pasting full 8-digit OTP code
  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').trim();
    if (!/^\d{8}$/.test(pastedData)) return; // Only allow exactly 8 digits
    
    const newOtp = pastedData.split('');
    setOtpArray(newOtp);
    
    // Focus the last input box
    if (otpInputsRef.current[7]) {
      otpInputsRef.current[7].focus();
    }
  };

  // Handle OTP verification submission
  const handleOtpVerify = async (e) => {
    e.preventDefault();
    setError('');
    
    const otpCode = otpArray.join('');
    if (otpCode.length < 8) {
      setError('Please enter all 8 digits of the OTP.');
      return;
    }

    setLoading(true);
    try {
      const res = await verifyOwnerOtp(email, otpCode);
      if (res.success) {
        navigate('/owner-dashboard');
      } else {
        setError(res.error || 'Invalid OTP code.');
      }
    } catch (err) {
      setError(err.message || 'OTP verification failed.');
    } finally {
      setLoading(false);
    }
  };

  // Handle resend OTP
  const handleResendOtp = async () => {
    if (cooldownActive) return;
    setError('');
    setSuccessMsg('');
    setLoading(true);
    try {
      const res = await sendOwnerOtp(email);
      if (res.success) {
        setSuccessMsg('A new OTP has been sent.');
        startOtpTimers();
      } else {
        setError(res.error || 'Failed to resend OTP.');
      }
    } catch (err) {
      setError(err.message || 'Error resending OTP.');
    } finally {
      setLoading(false);
    }
  };

  // Format timer display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const resetFlow = () => {
    setStep('email_input');
    setError('');
    setSuccessMsg('');
    setTimerActive(false);
    setCooldownActive(false);
  };

  // ── STEP 1: Owner Email input ──
  const renderEmailInput = () => (
    <div className="animate-fade-in space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shadow-lg"
               style={{ background: 'linear-gradient(135deg, #2E7D32, #1B5E20)' }}>
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold gradient-text-dark">Induja Medical Store</h1>
            <p className="text-[11px] text-dark-muted tracking-wide">Pharmacy Management System</p>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-dark-text mb-2">Owner Portal Login</h2>
        <p className="text-sm text-dark-muted">Enter your registered email address to request an 8-digit security OTP.</p>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-950/30 border border-red-900/40 text-xs text-red-400 animate-slide-down">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleEmailSubmit} className="space-y-4">
        <div>
          <label className="input-label-dark">Email Address</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-dark-muted">
              <Mail className="w-4 h-4" />
            </div>
            <input
              type="email"
              placeholder="owner@apollomedicalstore.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-dark pl-10"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed text-white shadow-lg"
          style={{ background: 'linear-gradient(135deg, #2E7D32, #1B5E20)' }}
        >
          {loading ? (
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>Get Verification Code <ArrowRight className="w-4 h-4" /></>
          )}
        </button>
      </form>

      <div className="text-center bg-dark-surface rounded-xl p-3.5 border border-dark-border">
        <span className="text-[10px] font-bold text-primary-400 uppercase tracking-wider">Security Notice</span>
        <p className="text-[11px] text-dark-muted mt-1 leading-relaxed">
          Access is strictly restricted to authorized owner profiles. Customer access is only available via scanning the store QR Code.
        </p>
      </div>
    </div>
  );

  // ── STEP 2: OTP Verification ──
  const renderOtpVerification = () => (
    <div className="animate-fade-in space-y-6">
      <button onClick={resetFlow} className="flex items-center gap-1.5 text-xs text-dark-muted hover:text-dark-text transition-colors cursor-pointer">
        <ArrowLeft className="w-3.5 h-3.5" /> Back
      </button>

      <div>
        <h2 className="text-2xl font-bold text-dark-text mb-2">Verify OTP</h2>
        <p className="text-sm text-dark-muted">
          We have sent an 8-digit verification code to your email: <strong className="text-dark-text">{email}</strong>.
        </p>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-primary-950/20 border border-primary-900/30 text-xs text-primary-400">
          {successMsg}
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-950/30 border border-red-900/40 text-xs text-red-400">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleOtpVerify} className="space-y-6">
        {/* OTP Input Grid */}
        <div className="flex justify-between gap-2" onPaste={handleOtpPaste}>
          {otpArray.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (otpInputsRef.current[index] = el)}
              type="text"
              pattern="[0-9]*"
              inputMode="numeric"
              maxLength="1"
              value={digit}
              onChange={(e) => handleOtpChange(index, e.target.value)}
              onKeyDown={(e) => handleOtpKeyDown(index, e)}
              className="w-10 sm:w-12 h-14 text-center text-xl font-bold bg-dark-surface border border-dark-border text-dark-text rounded-xl focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none transition-all"
            />
          ))}
        </div>

        {/* Expiry Timer & Resend Option */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-dark-muted">
            <Timer className="w-4 h-4 text-primary-400" />
            <span>Expires in <strong className="text-dark-text">{formatTime(timer)}</strong></span>
          </div>

          <button
            type="button"
            onClick={handleResendOtp}
            disabled={cooldownActive || loading}
            className={`flex items-center gap-1.5 font-semibold transition-colors cursor-pointer ${
              cooldownActive
                ? 'text-dark-muted cursor-not-allowed'
                : 'text-primary-400 hover:text-primary-300'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {cooldownActive ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
          </button>
        </div>

        <button
          type="submit"
          disabled={loading || timer === 0}
          className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed text-white shadow-lg"
          style={{ background: 'linear-gradient(135deg, #2E7D32, #1B5E20)' }}
        >
          {loading ? (
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>Verify and Login <Check className="w-4 h-4" /></>
          )}
        </button>
      </form>
    </div>
  );

  return (
    <div className="onboarding-container">
      {/* Left: Auth Card */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md onboarding-card animate-scale-in">
          {step === 'email_input' ? renderEmailInput() : renderOtpVerification()}
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
          <h2 className="text-3xl font-bold text-dark-text mb-3">Induja Medical Store</h2>
          <p className="text-dark-muted text-sm leading-relaxed max-w-xs mx-auto mb-10">
            Secure double-factor authentication dashboard for Owner Administration.
          </p>
        </div>
      </div>
    </div>
  );
}
