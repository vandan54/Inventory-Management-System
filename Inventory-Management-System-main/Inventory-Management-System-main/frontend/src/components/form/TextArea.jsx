// components/form/TextArea.jsx
import "./formInput.css";

export default function TextArea({
    value = '',
    onChange,
    label = '',
    error = '',
    required = false,
    name = '',
    rows = 4
}) {
    return (
        <div className="input-group textarea-group">
            <textarea
                value={value}
                onChange={onChange}
                name={name}
                className="input-field textarea-field"
                required={required}
                placeholder=" "
                rows={rows}
            />

            <label className="input-label">{label}</label>

            {error && <span className="error-message">{error}</span>}
        </div>
    );
}