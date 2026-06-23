// components/form/DateInput.jsx
import "./formInput.css";

export default function DateInput({
    value = '',
    onChange,
    label = '',
    error = '',
    required = false,
    name = '',
    min = '',
    max = ''
}) {
    return (
        <div className="input-group">
            <input
                type="date"
                value={value}
                onChange={onChange}
                name={name}
                className="input-field date-field"
                required={required}
                min={min}
                max={max}
            />

            <label className="input-label">{label}</label>

            {error && <span className="error-message">{error}</span>}
        </div>
    );
}