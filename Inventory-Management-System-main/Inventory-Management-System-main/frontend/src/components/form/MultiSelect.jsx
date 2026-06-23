import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import './formInput.css';
import './MultiSelect.css';

export default function MultiSelect({ label, options = [], selectedValues = [], onChange, placeholder = "Select options", allSelectedLabel = "", disabled = false }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleOption = (value) => {
        if (selectedValues.includes(value)) {
            onChange(selectedValues.filter(v => v !== value));
        } else {
            onChange([...selectedValues, value]);
        }
    };

    const toggleAll = () => {
        if (selectedValues.length === options.length) {
            onChange([]); // Deselect all
        } else {
            onChange(options.map(opt => opt.value)); // Select all
        }
    };

    const getDisplayText = () => {
        const total = options.length;
        const selected = selectedValues.length;

        if (selected === 0 || selected === total) {
            return allSelectedLabel || placeholder;
        }

        if (selected === 1) {
            const opt = options.find(o => o.value === selectedValues[0]);
            return opt ? opt.label : "";
        }
        return `${selected} Selected`;
    };

    const hasValue = selectedValues.length > 0;

    return (
        <div className="input-group multi-select-wrapper" ref={dropdownRef}>
            <div
                className={`input-field multi-select-header ${disabled ? 'disabled' : ''} ${isOpen ? 'open' : ''} ${hasValue ? 'has-value' : ''}`}
                onClick={() => !disabled && setIsOpen(!isOpen)}
            >
                <span className="multi-select-text">
                    {getDisplayText()}
                </span>
                <ChevronDown size={18} className="multi-select-icon" />
            </div>

            {label && (
                <label className={`input-label ${isOpen || hasValue ? 'active' : ''}`}>
                    {label}
                </label>
            )}

            {isOpen && (
                <div className="multi-select-dropdown">
                    <div className="multi-select-option select-all" onClick={toggleAll}>
                        <div className={`checkbox ${selectedValues.length === options.length && options.length > 0 ? 'checked' : ''}`}>
                            {selectedValues.length === options.length && options.length > 0 && <Check size={14} />}
                        </div>
                        <span>Select All</span>
                    </div>
                    {options.map((option) => (
                        <div
                            key={option.value}
                            className={`multi-select-option ${selectedValues.includes(option.value) ? 'selected' : ''}`}
                            onClick={() => toggleOption(option.value)}
                        >
                            <div className={`checkbox ${selectedValues.includes(option.value) ? 'checked' : ''}`}>
                                {selectedValues.includes(option.value) && <Check size={14} />}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ color: '#1e293b', fontWeight: '600' }}>{option.label}</span>
                                {option.location && (
                                    <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '1px' }}>
                                        {option.location}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
