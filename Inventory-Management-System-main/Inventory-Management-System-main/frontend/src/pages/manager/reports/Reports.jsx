import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import SharedReportsView from '../../../components/reports/SharedReportsView';
import { authServices } from '../../../services/api/authServices';
import { inventoryServices } from '../../../services/api/inventoryServices';
import { reportServices } from '../../../services/api/reportServices';
import { useAlert } from '../../../context/AlertContext';
import { useUser } from '../../../context/UserContext';
import './Reports.css';

const Reports = () => {
    const { showAlert } = useAlert();
    const { logout } = useUser();
    const navigate = useNavigate();

    // --- Access & Loading ---
    const [hasAccess, setHasAccess] = useState(null);
    const [isPageLoading, setIsPageLoading] = useState(true);

    // --- State ---
    const [warehouses, setWarehouses] = useState([]);
    const [selectedWarehouses, setSelectedWarehouses] = useState([]);

    useEffect(() => {
        const initialize = async () => {
            setIsPageLoading(true);
            try {
                // 1. Check Manager's Access State
                const { data: accessData } = await authServices.checkAccess();

                if (accessData.code === 'TOKEN_EXPIRED') {
                    showAlert(accessData.alertTitle, accessData.message, accessData.alertType, accessData.autoClose);
                    setTimeout(() => {
                        localStorage.removeItem('token');
                        logout();
                        navigate('/login');
                    }, 1500);
                    return;
                }

                if (!accessData.hasAccess) {
                    setHasAccess(false);
                } else {
                    setHasAccess(true);

                    // 2. Fetch assigned warehouses
                    try {
                        const { data: whData } = await reportServices.getReportWarehouses();
                        if (whData && whData.status && whData.data && whData.data.length > 0) {
                            const whOptions = whData.data.map(wh => ({
                                label: wh.label,
                                value: wh.value.toString(),
                                location: wh.location
                            }));
                            setWarehouses(whOptions);
                            setSelectedWarehouses(whOptions.map(w => w.value));
                        } else {
                            // If user truly has no warehouses, they get the hasAccess=false state
                            setHasAccess(false);
                        }
                    } catch (whErr) {
                        console.error("Error fetching warehouses for reports:", whErr);
                        showAlert('Error', 'Unable to fetch warehouse list.', 'error', true);
                    }
                }
            } catch (err) {
                console.error('Initialization Error:', err);
                showAlert('Connection Failed', 'Unable to reach the server.', 'error', true);
            } finally {
                setIsPageLoading(false);
            }
        };

        initialize();
    }, []);

    if (isPageLoading) {
        return (
            <div className="reports-wrapper">
                <div className="reports-header">
                    <h1 className="reports-title">Management Reports</h1>
                </div>
                <div className="reports-content">
                    <div className="reports-loading">Loading report engine...</div>
                </div>
            </div>
        );
    }

    if (hasAccess === false) {
        return (
            <div className="reports-wrapper">
                <div className="reports-header">
                    <h1 className="reports-title">Management Reports</h1>
                </div>
                <div className="reports-content">
                    <div className="no-access-box">
                        <div className="no-access-icon">
                            <AlertCircle size={36} />
                        </div>
                        <h2>Access Restricted</h2>
                        <p>You do not have management permissions for any warehouse. Reports are only available for authorized locations.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="reports-wrapper">
            <div className="reports-header">
                <h1 className="reports-title">Management Reports</h1>
            </div>

            <div className="reports-content">
                <SharedReportsView
                    role="manager"
                    warehouses={warehouses}
                    selectedWarehouses={selectedWarehouses}
                    onWarehouseChange={(vals) => setSelectedWarehouses(vals)}
                />
            </div>
        </div>
    );
};

export default Reports;
