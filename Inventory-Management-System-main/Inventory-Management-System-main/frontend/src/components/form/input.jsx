import { useState } from 'react';
import "./formInput.css";

export default function Input({
    type = 'text',
    value = '',
    onChange,
    label = '',
    error = '',
    required = false,
    name = '',
    icon = null,
    disabled = false,
    // parent can control visibility; if undefined we'll manage local state
    showPassword,
    onIconClick = null
}) {
    // local state used when parent doesn't supply showPassword
    const [internalShow, setInternalShow] = useState(false);
    const isVisible = typeof showPassword === 'boolean' ? showPassword : internalShow;

    const inputType = type === 'password' && isVisible ? 'text' : type;

    const handleIconClick = (e) => {
        if (onIconClick) {
            onIconClick(e);
        }
        // only toggle internal state when uncontrolled
        if (typeof showPassword !== 'boolean') {
            setInternalShow((prev) => !prev);
        }
    };

    return (
        <div className="input-group">
            <input
                type={inputType}
                value={value}
                onChange={onChange}
                name={name}
                className={`input-field ${disabled ? 'disabled' : ''}`}
                required={required}
                disabled={disabled}
                placeholder=""
            />

            <label className="input-label">
                {label}
                {required && <span className="required-star"> *</span>}
            </label>

            {icon && type === 'password' && (
                <button
                    type="button"
                    className="password-toggle"
                    onClick={handleIconClick}
                    tabIndex={-1}
                >
                    {icon}
                </button>
            )}

            {error && <span className="error-message">{error}</span>}
            
        </div>
    );
}