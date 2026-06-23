// components/form/PhoneInput.jsx
import "./formInput.css";

export default function PhoneInput({
    value = '',
    onChange,
    label = '',
    error = '',
    required = false,
    name = ''
}) {
    const handleChange = (e) => {
        let val = e.target.value.replace(/\D/g, ''); // Remove non-digits
        if (val.length > 10) val = val.slice(0, 10);
        
        e.target.value = val;
        onChange(e);
    };

    return (
        <div className="input-group">
            <input
                type="tel"
                value={value}
                onChange={handleChange}
                name={name}
                className="input-field"
                required={required}
                placeholder=" "
                maxLength="10"
            />

            <label className="input-label">{label}</label>

            {error && <span className="error-message">{error}</span>}
        </div>
    );
}