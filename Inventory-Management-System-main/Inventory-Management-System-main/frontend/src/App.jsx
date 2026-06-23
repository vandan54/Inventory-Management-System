import { BrowserRouter } from "react-router-dom";
import { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";

import { ProgressBarProvider } from "./context/ProgressBarContext";
import { AlertProvider } from "./context/AlertContext";
import { UserProvider, useUser } from "./context/UserContext";

import ProgressBar from "./components/loader/ProgressBar";
import AppContent from "./AppContent";

function AppWithProviders() {
    const { login } = useUser();
    const [initialized, setInitialized] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');

        if (token) {
            try {
                const decoded = jwtDecode(token);

                if (decoded.exp > Date.now() / 1000) {
                    login({
                        id: decoded.userId,
                        userName: decoded.userName,
                        email: decoded.userEmail,
                        businessId: decoded.userbusinessId,
                        role: decoded.userRole,
                        businessName: decoded.businessName,
                        profileCompleted: decoded.isProfileCompleted,
                        mustChangePassword: decoded.mustChangePassword
                    });
                } else {
                    localStorage.removeItem('token');
                }
            } catch (err) {
                localStorage.removeItem('token');
            }
        }

        setInitialized(true);
    }, [login]);

    return (
        <>
            <ProgressBar />
            {initialized && <AppContent />}
        </>
    );
}

function App() {
    return (
        <BrowserRouter>
            <ProgressBarProvider>
                <AlertProvider>
                    <UserProvider>
                        <AppWithProviders />
                    </UserProvider>
                </AlertProvider>
            </ProgressBarProvider>
        </BrowserRouter>
    );
}

export default App;
