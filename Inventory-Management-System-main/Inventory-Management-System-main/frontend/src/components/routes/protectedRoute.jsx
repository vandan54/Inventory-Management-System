import { useEffect, useState } from "react";
import { useAlert } from "../../context/AlertContext";
import { useUser } from "../../context/UserContext";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, requiredRole }) => {
    const { user } = useUser();
    const { showAlert } = useAlert();
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        if (!user) {
            showAlert(
                'Login Required',
                'You need to login first to access this page.',
                'error',
                true
            );
            setIsChecking(false);
            return;
        }

        if (user.role !== requiredRole) {
            showAlert(
                'Access Denied',
                `You don't have permission to access this page.`,
                'error',
                true
            );
            setIsChecking(false);
            return;
        }

        if (user.mustChangePassword === 1) {
            showAlert(
                'Security Action Required',
                'Please update your temporary password to continue.',
                'warning',
                true
            );
            setIsChecking(false);
            return;
        }

        if (user.profileCompleted === 0) {
            showAlert(
                'Profile Incomplete',
                'Please complete your profile first.',
                'error',
                true
            );
            setIsChecking(false);
            return;
        }

        setIsChecking(false);
    }, [user, requiredRole, showAlert]);

    if (isChecking) {
        return null;
    }

    if (!user) {
        return <Navigate to="/login" />;
    }

    if (user.role !== requiredRole) {
        return null;
    }

    if (user.mustChangePassword === 1) {
        return <Navigate to="/setup-password" />;
    }

    if (user.profileCompleted === 0) {
        return <Navigate to={`/${user.role}/profile-complete`} />;
    }

    return children;
};

export default ProtectedRoute;