import { Outlet, useLocation } from "react-router-dom";
import "./auth.css";
import { useProgressBar } from "../../context/ProgressBarContext";
import { useEffect } from "react";

function AuthLayout() {
    const { complete } = useProgressBar();
    const location = useLocation();

    useEffect(() => {
        const timer = setTimeout(() => {
            complete();
        }, 100);
        return () => clearTimeout(timer);
    }, [location.pathname]);

    return (
        <div className="auth-container">
            <div className="auth-wrapper">
                <div className="auth-card auth-animate">
                    <Outlet />
                </div>
            </div>
        </div>
    );
}

export default AuthLayout;