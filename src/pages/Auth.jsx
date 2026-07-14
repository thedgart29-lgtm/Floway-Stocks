import React, { useState, useEffect } from 'react';
import { firebaseLogin, firebaseRegister } from '../data/db';

/* ── Floating-card design with Tab Switching for Login & First-time Registration ── */
const loginStyles = `
  html, body, #root, #app {
    background: transparent !important;
    background-color: transparent !important;
    margin: 0 !important;
    padding: 0 !important;
  }
  @keyframes loginFadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes loginCardSlide {
    from { transform: translateY(24px); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
  }
  .login-overlay {
    animation: loginFadeIn 0.3s ease-out;
    height: 100vh;
    width: 100vw;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    position: fixed;
    top: 0; left: 0;
    z-index: 9999;
    overflow: hidden;
    box-sizing: border-box;
    padding: 24px;
    font-family: 'Inter', sans-serif;
  }
  .login-card {
    animation: loginCardSlide 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    background: #ffffff;
    border: 1px solid rgba(255,255,255,0.8);
    box-shadow: 0 25px 50px -12px rgba(0,0,0,0.55);
    border-radius: 20px;
    width: 440px;
    padding: 36px;
    box-sizing: border-box;
  }
  .login-tab-header {
    display: flex;
    border-bottom: 2px solid #f1f5f9;
    margin-bottom: 24px;
    gap: 16px;
  }
  .login-tab-btn {
    flex: 1;
    background: none;
    border: none;
    padding: 10px 0;
    font-size: 14px;
    font-weight: 700;
    color: #94a3b8;
    cursor: pointer;
    position: relative;
    transition: all 0.2s ease;
  }
  .login-tab-btn.active {
    color: #111827;
  }
  .login-tab-btn.active::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 0;
    width: 100%;
    height: 2px;
    background: #6366f1;
  }
  .login-input-field {
    width: 100%;
    padding: 12px 16px;
    border: 1.5px solid #cbd5e1;
    border-radius: 8px;
    font-size: 14px;
    transition: all 0.2s ease;
    outline: none;
    background: #f8fafc;
    color: #0f172a;
    font-weight: 500;
    box-sizing: border-box;
    font-family: 'Inter', sans-serif;
  }
  .login-input-field:focus {
    border-color: #6366f1;
    background: #ffffff;
    box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
  }
  .login-label {
    display: block;
    margin-bottom: 6px;
    font-weight: 600;
    font-size: 12px;
    color: #475569;
  }
  .login-btn-primary {
    width: 100%;
    height: 50px;
    background: #111827;
    color: #ffffff;
    font-size: 15px;
    font-weight: 700;
    border-radius: 8px;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 4px 12px rgba(17,24,39,0.15);
    font-family: 'Inter', sans-serif;
  }
  .login-btn-primary:hover:not(:disabled) {
    background: #000000;
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(17,24,39,0.25);
  }
  .login-btn-primary:active:not(:disabled) {
    transform: translateY(0);
  }
  .login-btn-primary:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
  .login-btn-secondary {
    background: #6366f1;
    color: #ffffff;
    font-size: 13px;
    font-weight: 600;
    padding: 8px 14px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .login-btn-secondary:hover:not(:disabled) {
    background: #4f46e5;
  }
  .login-error-box {
    background: #fff2f2;
    color: #dc2626;
    border: 1px solid #fecaca;
    border-radius: 8px;
    padding: 10px 14px;
    font-size: 13px;
    font-weight: 500;
    margin-bottom: 18px;
  }
  .login-success-box {
    background: #f0fdf4;
    color: #16a34a;
    border: 1px solid #bbf7d0;
    border-radius: 8px;
    padding: 10px 14px;
    font-size: 13px;
    font-weight: 500;
    margin-bottom: 18px;
  }
`;

const Auth = ({ onLogin }) => {
  const [activeTab, setActiveTab] = useState('login'); // 'login' or 'register'
  
  // Login State
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  
  // Registration State
  const [registerData, setRegisterData] = useState({
    email: '',
    companyName: '',
    username: '',
    password: '',
    otpInput: ''
  });
  
  // OTP logic properties
  const [sentOtp, setSentOtp] = useState('');
  const [otpSentStatus, setOtpSentStatus] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Handle inputs
  const handleLoginInput = (e) => setLoginData({ ...loginData, [e.target.name]: e.target.value });
  const handleRegisterInput = (e) => setRegisterData({ ...registerData, [e.target.name]: e.target.value });

  useEffect(() => {
    // Reset messages when switching tabs
    setError('');
    setSuccess('');
    setLoading(false);
  }, [activeTab]);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById('root');
    const app  = document.getElementById('app');

    const prev = {
      html: html.style.background,
      body: body.style.background,
      root: root ? root.style.background : '',
      app:  app  ? app.style.background  : '',
    };

    html.style.setProperty('background', 'transparent', 'important');
    html.style.setProperty('background-color', 'transparent', 'important');
    body.style.setProperty('background', 'transparent', 'important');
    body.style.setProperty('background-color', 'transparent', 'important');
    if (root) { root.style.setProperty('background', 'transparent', 'important'); root.style.setProperty('background-color', 'transparent', 'important'); }
    if (app)  { app.style.setProperty('background',  'transparent', 'important'); app.style.setProperty('background-color',  'transparent', 'important'); }

    return () => {
      html.style.background = prev.html;
      body.style.background = prev.body;
      if (root) root.style.background = prev.root;
      if (app)  app.style.background  = prev.app;
    };
  }, []);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') window.electronAPI?.closeApp();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  // Send Email OTP
  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    const emailClean = registerData.email.trim();
    if (!emailClean) {
      setError('Please provide a valid email ID first.');
      return;
    }

    setLoading(true);
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit random code

    console.log(`Generated OTP code for ${emailClean}: ${generatedOtp}`);

    try {
      if (window.electronAPI?.sendOTPEmail) {
        // Send email via Electron SMTP (Nodemailer using local profile credentials)
        const response = await window.electronAPI.sendOTPEmail(emailClean, generatedOtp);
        if (response.success) {
          setSentOtp(generatedOtp);
          setOtpSentStatus(true);
          setSuccess(`OTP has been successfully sent to ${emailClean}. Please verify code.`);
        } else {
          // Failure setup, check message details
          setError(`Send failed: ${response.error || 'Check SMTP configuration'}`);
          console.warn("Falling back to simulated OTP due to SMTP error...");
          setSentOtp(generatedOtp);
          setOtpSentStatus(true);
          alert(`SMTP Error: code fallback. SIMULATED OTP IS: ${generatedOtp}`);
        }
      } else {
        // Web preview fallback simulation
        setSentOtp(generatedOtp);
        setOtpSentStatus(true);
        setSuccess(`[Simulated Web Mode] OTP sent. Enter code: ${generatedOtp} (See console)`);
        console.log(`%c[SIMULATION OTP] Code is: ${generatedOtp}`, "color: #6366f1; font-weight: bold; font-size: 16px;");
      }
    } catch (err) {
      setError(`OTP delivery error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP Code
  const handleVerifyOTP = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (registerData.otpInput.trim() === sentOtp) {
      setOtpVerified(true);
      setSuccess('OTP successfully verified! Please complete setup credentials.');
    } else {
      setError('Incorrect OTP. Please enter the correct code.');
    }
  };

  // Register Company & Admin credentials
  const handleRegisterSetup = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const { email, companyName, username, password } = registerData;

    if (!email || !companyName || !username || !password) {
      setError('All fields are requested.');
      return;
    }

    setLoading(true);
    try {
      const newUser = await firebaseRegister(email.trim(), companyName.trim(), username.trim(), password);
      setSuccess('Registration completed successfully! Signing you in...');
      setTimeout(() => {
        sessionStorage.setItem('auth_token', 'online-auth-token-' + newUser.id);
        sessionStorage.setItem('user', JSON.stringify(newUser));
        localStorage.setItem('auth_token', 'online-auth-token-' + newUser.id);
        localStorage.setItem('auth_user', JSON.stringify(newUser));
        
        if (window.electronAPI?.loginSuccess) {
          window.electronAPI.loginSuccess();
        } else {
          onLogin(newUser);
        }
      }, 1000);
    } catch (err) {
      setError(err.message || 'Setup error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Sign In Process
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { username, password } = loginData;

    if (!username.trim() || !password) {
      setError('Please fill in username and password.');
      setLoading(false);
      return;
    }

    try {
      const loggedUser = await firebaseLogin(username.trim(), password);
      
      sessionStorage.setItem('auth_token', 'online-auth-token-' + loggedUser.id);
      sessionStorage.setItem('user', JSON.stringify(loggedUser));
      localStorage.setItem('auth_token', 'online-auth-token-' + loggedUser.id);
      localStorage.setItem('auth_user', JSON.stringify(loggedUser));

      if (window.electronAPI?.loginSuccess) {
        window.electronAPI.loginSuccess();
      } else {
        onLogin(loggedUser);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{loginStyles}</style>
      <div className="login-overlay">
        <div className="login-card">

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              background: '#111827',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              fontWeight: 900,
              margin: '0 auto 12px',
              boxShadow: '0 8px 24px rgba(17,24,39,0.3)'
            }}>
              F
            </div>
            <h2 style={{
              fontSize: '26px',
              fontWeight: 900,
              color: '#111827',
              letterSpacing: '-0.03em',
              margin: 0
            }}>
              <span style={{ color: '#6366f1' }}>Floway</span> Stock
            </h2>
            <p style={{ color: '#6b7280', fontSize: '13px', marginTop: '4px' }}>
              Industrial Stock Management Suite
            </p>
          </div>

          {/* Tab switching */}
          <div className="login-tab-header">
            <button 
              className={`login-tab-btn ${activeTab === 'login' ? 'active' : ''}`}
              onClick={() => setActiveTab('login')}
            >
              Sign In
            </button>
            <button 
              className={`login-tab-btn ${activeTab === 'register' ? 'active' : ''}`}
              onClick={() => setActiveTab('register')}
            >
              First Time Setup
            </button>
          </div>

          {/* Messages */}
          {error && <div className="login-error-box">{error}</div>}
          {success && <div className="login-success-box">{success}</div>}

          {/* 1. SIGN IN VIEW */}
          {activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label className="login-label">Username</label>
                <input
                  type="text"
                  name="username"
                  className="login-input-field"
                  placeholder="Enter username"
                  required
                  autoFocus
                  value={loginData.username}
                  onChange={handleLoginInput}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label className="login-label">Password</label>
                <input
                  type="password"
                  name="password"
                  className="login-input-field"
                  placeholder="••••••••"
                  required
                  value={loginData.password}
                  onChange={handleLoginInput}
                />
              </div>

              <button
                type="submit"
                className="login-btn-primary"
                disabled={loading}
              >
                {loading ? 'Verifying...' : 'Sign In'}
              </button>
            </form>
          )}

          {/* 2. REGISTRATION / FIRST-TIME SETUP VIEW */}
          {activeTab === 'register' && (
            <div>
              {/* Step 1: Send OTP to Email */}
              {!otpSentStatus && (
                <form onSubmit={handleRequestOTP}>
                  <div style={{ marginBottom: '20px' }}>
                    <label className="login-label">Verify Admin Email Address</label>
                    <p style={{ fontSize: '11px', color: '#64748b', margin: '-4px 0 8px 0' }}>
                      An OTP code will be sent to confirm registration.
                    </p>
                    <input
                      type="email"
                      name="email"
                      className="login-input-field"
                      placeholder="name@company.com"
                      required
                      value={registerData.email}
                      onChange={handleRegisterInput}
                    />
                  </div>
                  <button
                    type="submit"
                    className="login-btn-primary"
                    disabled={loading}
                  >
                    {loading ? 'Sending OTP...' : 'Send Verification OTP'}
                  </button>
                </form>
              )}

              {/* Step 2: Input & Check OTP */}
              {otpSentStatus && !otpVerified && (
                <form onSubmit={handleVerifyOTP}>
                  <div style={{ marginBottom: '20px' }}>
                    <label className="login-label">Enter 6-Digit OTP Code</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        name="otpInput"
                        maxLength="6"
                        className="login-input-field"
                        placeholder="######"
                        required
                        style={{ textAlign: 'center', letterSpacing: '8px', fontSize: '16px' }}
                        value={registerData.otpInput}
                        onChange={handleRegisterInput}
                      />
                      <button 
                        type="button" 
                        className="login-btn-secondary" 
                        onClick={handleRequestOTP} 
                        disabled={loading}
                      >
                        Resend
                      </button>
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="login-btn-primary"
                    disabled={loading}
                  >
                    Verify Code
                  </button>
                </form>
              )}

              {/* Step 3: Enter Company Profile and Admin Credentials */}
              {otpVerified && (
                <form onSubmit={handleRegisterSetup}>
                  <div style={{ marginBottom: '14px' }}>
                    <label className="login-label">Company Name</label>
                    <input
                      type="text"
                      name="companyName"
                      className="login-input-field"
                      placeholder="e.g. Apex Industrial"
                      required
                      value={registerData.companyName}
                      onChange={handleRegisterInput}
                    />
                  </div>

                  <div style={{ marginBottom: '14px' }}>
                    <label className="login-label">Admin Username</label>
                    <input
                      type="text"
                      name="username"
                      className="login-input-field"
                      placeholder="Pick admin username"
                      required
                      value={registerData.username}
                      onChange={handleRegisterInput}
                    />
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label className="login-label">Admin Password</label>
                    <input
                      type="password"
                      name="password"
                      className="login-input-field"
                      placeholder="Set access password"
                      required
                      value={registerData.password}
                      onChange={handleRegisterInput}
                    />
                  </div>

                  <button
                    type="submit"
                    className="login-btn-primary"
                    disabled={loading}
                  >
                    {loading ? 'Creating Account...' : 'Complete Registry Setup'}
                  </button>
                </form>
              )}
            </div>
          )}

        </div>
      </div>
    </>
  );
};

export default Auth;
