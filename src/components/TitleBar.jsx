import React, { useState, useEffect } from 'react';
import { Minus, Square, X } from 'lucide-react';
import { useDB } from '../data/db';

const TitleBar = ({ user }) => {
  const db = useDB();
  const [timeState, setTimeState] = useState(new Date());
  const [ip, setIp] = useState('127.0.0.1');

  useEffect(() => {
    const timer = setInterval(() => setTimeState(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (window.electronAPI?.getLocalIP) {
      Promise.resolve(window.electronAPI.getLocalIP()).then(ipAddress => {
        setIp(ipAddress);
      });
    } else {
      // Fallback if not running inside Electron
      fetch('https://api.ipify.org?format=json')
        .then(res => res.json())
        .then(data => setIp(data.ip))
        .catch(() => setIp('127.0.0.1'));
    }
  }, []);

  const handleMinimize = () => {
    window.electronAPI?.minimize();
  };

  const handleMaximize = () => {
    window.electronAPI?.maximize();
  };

  const handleClose = () => {
    window.electronAPI?.closeApp();
  };

  const formattedTime = timeState.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  const formattedDate = timeState.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const formattedDay = timeState.toLocaleDateString('en-US', { weekday: 'long' });
  
  const companyName = db.companyProfile?.name || 'Pixivo Industrial';

  // Theme-aware styles using CSS Variables
  const titleBarClass = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '32px',
    background: 'var(--bg-card)',
    borderBottom: '1px solid var(--border)',
    color: 'var(--text-secondary)',
    fontSize: '0.75rem',
    userSelect: 'none',
    WebkitAppRegion: 'drag', // Exposes window dragging to Electron
    paddingLeft: '1rem',
  };

  const buttonStyle = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--text-secondary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '46px',
    height: '32px',
    WebkitAppRegion: 'no-drag',
    transition: 'all 0.1s ease',
  };

  return (
    <div style={titleBarClass}>
      {/* Left side: Software Title & Branding */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: 'var(--text-main)' }}>
        <div style={{
          width: '18px',
          height: '18px',
          borderRadius: '4px',
          background: 'var(--text-main)',
          color: 'var(--bg-card)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '11px',
          fontWeight: 900,
          flexShrink: 0
        }}>
          F
        </div>
        <span>Floway Stock - {companyName} <span style={{ fontWeight: 400, opacity: 0.6 }}>(v1.0.1)</span></span>
      </div>

      {/* Center: Metadata details */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', fontSize: '0.72rem', fontWeight: 500 }}>
        {user && (
          <span>
            User ID: <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>{user.username}</span>
          </span>
        )}
        {user && <span>|</span>}
        <span>Day: <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{formattedDay}</span></span>
        <span>|</span>
        <span>Date: <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{formattedDate}</span></span>
        <span>|</span>
        <span>Time: <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{formattedTime}</span></span>
        <span>|</span>
        <span>
          IP: <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{ip}</span>
        </span>
      </div>

      {/* Right side: Close panel (Minimize, Maximize, Close controls) */}
      <div style={{ display: 'flex', height: '100%' }}>
        {window.electronAPI ? (
          <>
            <button 
              type="button" 
              onClick={handleMinimize} 
              style={buttonStyle} 
              onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'none'}
              title="Minimize"
            >
              <Minus size={14} />
            </button>
            <button 
              type="button" 
              onClick={handleMaximize} 
              style={buttonStyle}
              onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'none'}
              title="Maximize"
            >
              <Square size={10} />
            </button>
            <button 
              type="button" 
              onClick={handleClose} 
              style={{
                ...buttonStyle,
                transition: 'background 0.15s ease, color 0.15s ease',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = '#e81123';
                e.currentTarget.style.color = 'white';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'none';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
              title="Close"
            >
              <X size={14} />
            </button>
          </>
        ) : (
          <div style={{ width: '46px' }} />
        )}
      </div>
    </div>
  );
};

export default TitleBar;
