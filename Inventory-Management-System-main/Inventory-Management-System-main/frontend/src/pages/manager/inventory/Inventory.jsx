import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import SharedStockView from '../../../components/inventory/SharedStockView/SharedStockView';
import { authServices } from '../../../services/api/authServices';
import { inventoryViewServices } from '../../../services/api/inventoryViewServices';
import { useAlert } from '../../../context/AlertContext';
import { useUser } from '../../../context/UserContext';
import './Inventory.css';

const Inventory = () => {
    const { showAlert } = useAlert();
    const { logout } = useUser();
    const navigate = useNavigate();

    // --- Access & Loading ---
    const [hasAccess, setHasAccess] = useState(null);
    const [isPageLoading, setIsPageLoading] = useState(true);

    // --- Manager State: Warehouse Selection ---
    const [warehouses, setWarehouses] = useState([]);
    const [selectedWarehouses, setSelectedWarehouses] = useState([]);

    // ===== INITIALIZE & CHECK ACCESS =====
    useEffect(() => {
        const initialize = async () => {
            setIsPageLoading(true);
            try {
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

                    let whOptions = [];
                    try {
                        const { data: whData } = await inventoryViewServices.getWarehouses();
                        if (whData && whData.status && whData.data.length > 0) {
                            whOptions = whData.data.map(wh => ({
                                label: wh.label,
                                value: wh.value.toString(),
                                location: wh.location || ''
                            }));
                        }
                    } catch (whErr) {
                         console.error('Failed to load warehouses:', whErr);
                    }
                    
                    setWarehouses(whOptions);
                    setSelectedWarehouses(whOptions.map(w => w.value)); // Default to selecting all
                }
            } catch (err) {
                console.error('Core Init Error:', err);
                showAlert('Connection Failed', 'Unable to connect to the core server.', 'error', true);
            } finally {
                setIsPageLoading(false);
            }
        };

        initialize();
    }, []);

    // ===== RENDER LOGIC =====
    if (isPageLoading) {
        return (
            <div className="inventory-wrapper">
                <div className="inventory-header">
                    <h1 className="inventory-title">Inventory</h1>
                </div>
                <div className="inventory-content">
                    <div className="stock-loading">Loading inventory system...</div>
                </div>
            </div>
        );
    }

    if (hasAccess === false) {
        return (
            <div className="inventory-wrapper">
                <div className="inventory-header">
                    <h1 className="inventory-title">Inventory</h1>
                </div>
                <div className="inventory-content">
                    <div className="no-access-box">
                        <div className="no-access-icon">
                            <AlertCircle size={36} />
                        </div>
                        <h2>Access Restricted</h2>
                        <p>You currently do not have management permissions for any warehouse. Please contact the business owner.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="inventory-wrapper">
            <div className="inventory-header">
                <h1 className="inventory-title">Inventory</h1>
            </div>

            <div className="inventory-content">
                {/* The Shared Component now handles BOTH the Warehouse selector and Filters in one row for the Manager */}
                <SharedStockView
                    role="manager"
                    selectedWarehouses={selectedWarehouses}
                    warehouses={warehouses}
                    onWarehouseChange={(vals) => setSelectedWarehouses(vals)}
                />
            </div>
        </div>
    );
};

export default Inventory;
