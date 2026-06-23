import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import Input from "../../components/form/input";
import "./auth.css";
import { authServices } from "../../services/api/authServices";
import { useAlert } from "../../context/AlertContext";

export default function UpdatePassword() {
    const navigate = useNavigate();
    const { logout } = useUser();
    const { showAlert } = useAlert();

    const [isLoading, setIsLoading] = useState(false);

    const [form, setForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });

    const [error, setError] = useState("");

    // ✅ REMOVE SCROLL ONLY FOR THIS PAGE
    useEffect(() => {
        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = "auto";
        };
    }, []);

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
        setError("");
    };

    const handleSubmit = async () => {
        if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
            return setError("All fields are required");
        }

        if (form.newPassword !== form.confirmPassword) {
            return setError("Passwords do not match");
        }

        setIsLoading(true);
        try {
            const res = await authServices.changePassword(form.currentPassword, form.newPassword, form.confirmPassword);
            
            if (res.response.ok && res.data.status) {
                showAlert(res.data.alertTitle, res.data.message, res.data.alertType, res.data.autoClose);
                logout();
                navigate("/login");
            } else {
                if (res.data.alertTitle) {
                    showAlert(res.data.alertTitle, res.data.message, res.data.alertType, res.data.autoClose);
                } else {
                    setError(res.data.message || "Failed to update password.");
                }
            }
        } catch (err) {
            showAlert("Server Error", "An unexpected error occurred.", "error", true);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="update-password-page">

            <div className="password-card">
                <h2>Update Password</h2>

                <div className="card-body">

                    <Input
                        label="Current Password"
                        type="password"
                        name="currentPassword"
                        value={form.currentPassword}
                        onChange={handleChange}
                    />

                    <Input
                        label="New Password"
                        type="password"
                        name="newPassword"
                        value={form.newPassword}
                        onChange={handleChange}
                    />

                    <Input
                        label="Confirm Password"
                        type="password"
                        name="confirmPassword"
                        value={form.confirmPassword}
                        onChange={handleChange}
                    />

                    {error && <p className="error">{error}</p>}

                    <button className="submit-button" onClick={handleSubmit} disabled={isLoading}>
                        {isLoading ? "Updating..." : "Update Password"}
                    </button>

                </div>
            </div>

        </div>
    );
}