import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useProgressBar } from "../../context/ProgressBarContext";
import { useUser } from "../../context/UserContext";
import { useAlert } from "../../context/AlertContext";

import OrganizationForm from "./components/OrganizationForm";
import UserForm from "./components/UserForm";

import { ownerServices } from "../../services/api/ownerService";

import "./OwnerProfileSetup.css";

export default function OwnerProfileSetup() {

    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const { complete } = useProgressBar();
    const { showAlert } = useAlert();
    const { logout } = useUser();
    const navigate = useNavigate();
    const location = useLocation();

    const [organizationData, setOrganizationData] = useState(null);
    const [userData, setUserData] = useState(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            complete();
        }, 100);
        return () => clearTimeout(timer);
    }, [location.pathname]);

    const handleOrganizationSubmit = (formData) => {
        setOrganizationData(formData);
        setStep(2);
    };

    const handleUserSubmit = async (formData) => {
        setUserData(formData);
        setIsLoading(true);

        try {
            const {response, data} = await ownerServices.completeProfile(organizationData, formData);

            showAlert(data.alertTitle, data.message, data.alertType, data.autoClose);

            if (data.code === 'TOKEN_EXPIRED') {
                setTimeout(() => {
                    localStorage.removeItem('token');
                    logout();
                    navigate('/login');
                }, 1500);
                return;
            }

            if (data.code === 'ACCESS_DENIED') {
                setIsLoading(false);
                return;
            }

            if(response.ok) {
                localStorage.removeItem('token');

                setTimeout(() => {
                    navigate('/login');
                }, 500);
            }
        } catch (err) {
            console.log(err);
            showAlert(
                'Connection Failed',
                'Unable to connect to the server. Please try again.',
                'error',
                true
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="profile-container">

        <h1 className="main-title">Complete Your Profile</h1>
        <p className="subtitle">
            Please fill in the required information
        </p>

        <div className="stepper">

            <div className={`step ${step === 1 ? "active" : ""}`}>1</div>
            <span>Organization</span>

            <div className="line"></div>

            <div className={`step ${step === 2 ? "active" : ""}`}>2</div>
            <span>Personal</span>

        </div>

        <div className="form-card">

            {step === 1 && <OrganizationForm onSubmit={handleOrganizationSubmit} />}

            {step === 2 && <UserForm onSubmit={handleUserSubmit} isLoading={isLoading}/>}

        </div>

        </div>
    );
}