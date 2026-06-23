import "./auth.css";
import Input from "../../components/form/input";
import { useState } from "react";
import { useAlert } from "../../context/AlertContext";
import { authServices } from "../../services/api/authServices";
import { useNavigate } from "react-router-dom";

const EyeIcon = ({ isVisible }) => {
    if (isVisible) {
        // Eye icon (password visible)
        return (
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
        );
    }

    // Eye slash icon (password hidden)
    return (
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
        </svg>
    );
};

function SetupPassword() {
    const [form, setForm] = useState({
        password: "",
        confirmPassword: "",
    });

    const navigate = useNavigate();
    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const { showAlert } = useAlert();
    const [isLoading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm({ ...form, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        let newErrors = {};

        if (!form.password) newErrors.password = "Password is required";
        if (form.password !== form.confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match";
        }

        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
            const errorMessage = newErrors.confirmPassword
                ? 'Passwords do not match.'
                : 'Please provide password to continue.';

            showAlert(
                newErrors.confirmPassword ? 'Password Mismatch' : 'Missing Information',
                errorMessage,
                'error',
                true
            );
            return;
        }

        setLoading(true);

        try {
            // Placeholder for setupPassword service
            const { response, data } = await authServices.setupPassword(form.password);

            showAlert(data.alertTitle, data.message, data.alertType, data.autoClose);

            if (response.ok) {
                setForm({
                    password: "",
                    confirmPassword: ""
                });

                setTimeout(() => {
                    navigate('/login');
                }, 500);
            }
        } catch (err) {
            console.log(err);
            showAlert(
                'Connection Failed',
                'Unable to connect to the server. Please check your internet connection and try again.',
                'error',
                true
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-box">
            <h1 className="auth-title">Update Password</h1>
            <p className="auth-subtitle">
                Update your temporary password to continue to your dashboard.
            </p>

            <form className="auth-form" onSubmit={handleSubmit}>

                {/* Password Field */}
                <Input
                    type="password"
                    name="password"
                    label="New Password *"
                    value={form.password}
                    onChange={handleChange}
                    error={errors.password}
                    icon={
                        form.password ? <EyeIcon isVisible={showPassword} /> : null
                    }
                    onIconClick={() => setShowPassword((prev) => !prev)}
                />


                {/* Confirm Password Field */}

                <Input
                    type="password"
                    name="confirmPassword"
                    label="Confirm Password *"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    error={errors.confirmPassword}
                    icon={
                        form.confirmPassword ? (<EyeIcon isVisible={showConfirmPassword} />) : null
                    }
                    onIconClick={() => setShowConfirmPassword((prev) => !prev)}
                />
                <button type="submit" className="submit-button" disabled={isLoading}>
                    {isLoading ? 'Updating...' : 'Set Password'}
                </button>
            </form>
        </div>
    );
}

export default SetupPassword;