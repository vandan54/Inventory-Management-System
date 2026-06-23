import './auth.css';
import Input from '../../components/form/input';
import { useState } from 'react';
import { useAlert } from '../../context/AlertContext';
import { authServices } from '../../services/api/authServices';

function ForgotPassword() {

    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setLoading] = useState(false);
    const {showAlert} = useAlert();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email) {
            setError("Email is required");
            showAlert(
                'Missing Information',
                'Please provide both email and password to continue.',
                'error',
                true
            );
            return;
        }

        setError("");
        
        setLoading(true);

        try {
            const {response, data} = await authServices.forgotPassword(email);

            showAlert(data.alertTitle, data.message, data.alertType, data.autoClose);

            if(response.ok) {
                setEmail("");
            }
        } catch(err) {
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
        <>
            <h1 className="auth-title">Password Reset</h1>

            <p className="auth-subtitle">
                Provide the email address associated with your account to recover your password.
            </p>

            <form className="auth-form" onSubmit={handleSubmit}>

                <Input
                    type="email"
                    name="email"
                    label="Email*"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    error={error}
                    placeholder="name@example.com"
                />

                <button type="submit" className="submit-button" disabled={isLoading}>
                    {isLoading ? 'Sending Reset Mail...' : 'Reset Password'}
                </button>

            </form>
        </>
    );
}

export default ForgotPassword;