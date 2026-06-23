import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import "./formInput.css";
import "./MultiSelect.css"; // Reuse for consistent dropdown look

export default function Select({
  value = "",
  onChange,
  label = "",
  error = "",
  required = false,
  name = "",
  options = [],
  placeholder = "Select an option"
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (optionValue) => {
    if (onChange) {
      onChange({ target: { name, value: optionValue } });
    }
    setIsOpen(false);
  };

  const selectedOption = options.find(opt => {
    const optVal = typeof opt === "object" ? opt.value : opt;
    return optVal === value;
  });

  const displayText = selectedOption 
    ? (typeof selectedOption === "object" ? selectedOption.label : selectedOption)
    : "";

  const hasValue = value !== "" && value !== undefined && value !== null;

  return (
    <div className="input-group" ref={dropdownRef}>
      <div 
        className={`input-field select-field multi-select-header ${isOpen ? 'open' : ''} ${hasValue ? 'has-value' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <span className="multi-select-text" style={{ color: hasValue ? '#2d3a8c' : '#8a94b2' }}>
           {displayText || (!isOpen && placeholder)}
        </span>
        <ChevronDown size={18} className={`multi-select-icon ${isOpen ? 'rotate' : ''}`} style={{ transition: 'transform 0.2s' }} />
      </div>

      {label && (
        <label className={`input-label ${isOpen || hasValue ? 'active' : ''}`}>
          {label}
        </label>
      )}

      {isOpen && (
        <div className="multi-select-dropdown">
           {options.length === 0 ? (
             <div className="multi-select-option" style={{ color: '#94a3b8', cursor: 'default' }}>No options</div>
           ) : (
            options.map((option, index) => {
              const optValue = typeof option === "object" ? option.value : option;
              const optLabel = typeof option === "object" ? option.label : option;
              const isSelected = optValue === value;

              return (
                <div 
                  key={index} 
                  className={`multi-select-option ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleSelect(optValue)}
                >
                  <span style={{ color: isSelected ? '#4f63d2' : '#1e293b', fontWeight: isSelected ? '700' : '500' }}>
                    {optLabel}
                  </span>
                </div>
              );
            })
           )}
        </div>
      )}

      {error && <span className="error-message">{error}</span>}
    </div>
  );
}