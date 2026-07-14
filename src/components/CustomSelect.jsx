import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export default function CustomSelect({
  options = [],
  value = '',
  onChange,
  placeholder = 'Select option',
  disabled = false,
  required = false,
  style = {},
  className = ''
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleOutsideClick(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const selectedOption = options.find(opt => String(opt.value) === String(value));

  const handleSelect = (val) => {
    if (disabled) return;
    if (onChange) {
      onChange({ target: { value: val } });
    }
    setIsOpen(false);
  };

  return (
    <div 
      ref={containerRef}
      style={{ position: 'relative', width: '100%', outline: 'none', ...style }}
      className={`custom-select-container ${disabled ? 'disabled' : ''} ${className}`}
    >
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className="input-field custom-select-trigger"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: disabled ? 'not-allowed' : 'pointer',
          paddingRight: '1rem',
          userSelect: 'none',
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <span style={{ 
          overflow: 'hidden', 
          textOverflow: 'ellipsis', 
          whiteSpace: 'nowrap',
          color: selectedOption ? 'var(--text-main)' : 'var(--text-secondary)'
        }}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown 
          size={14} 
          style={{ 
            transition: 'transform 0.2s', 
            transform: isOpen ? 'rotate(180deg)' : 'none',
            color: 'var(--text-secondary)',
            flexShrink: 0
          }} 
        />
      </div>

      {isOpen && (
        <div 
          className="custom-select-dropdown"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            width: '100%',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
            zIndex: 9999,
            maxHeight: '220px',
            overflowY: 'auto',
            animation: 'slideDown 0.15s ease-out',
          }}
        >
          {required && placeholder && !selectedOption && (
            <div
              onClick={() => handleSelect('')}
              className="custom-select-option"
              style={{
                padding: '0.6rem 0.8rem',
                cursor: 'pointer',
                color: 'var(--text-secondary)',
                fontSize: '0.8rem',
                transition: 'background-color 0.15s',
              }}
            >
              {placeholder}
            </div>
          )}
          {options.map((opt) => (
            <div
              key={opt.value}
              onClick={() => handleSelect(opt.value)}
              className={`custom-select-option ${String(opt.value) === String(value) ? 'selected' : ''}`}
              style={{
                padding: '0.6rem 0.8rem',
                cursor: 'pointer',
                fontSize: '0.8rem',
                backgroundColor: String(opt.value) === String(value) ? 'var(--bg-hover)' : 'transparent',
                color: String(opt.value) === String(value) ? 'var(--primary)' : 'var(--text-main)',
                transition: 'all 0.15s',
              }}
            >
              {opt.label}
            </div>
          ))}
          {options.length === 0 && (
            <div style={{ padding: '0.6rem 0.8rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
              No options available
            </div>
          )}
        </div>
      )}
    </div>
  );
}
