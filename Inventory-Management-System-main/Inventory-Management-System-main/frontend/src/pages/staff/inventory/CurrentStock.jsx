import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Warehouse as WarehouseIcon, MapPin } from 'lucide-react';
import SharedStockView from '../../../components/inventory/SharedStockView/SharedStockView';
import { authServices } from '../../../services/api/authServices';
import { inventoryViewServices } from '../../../services/api/inventoryViewServices';
import { useAlert } from '../../../context/AlertContext';
import { useUser } from '../../../context/UserContext';
import './CurrentStock.css';

const CurrentStock = () => {
    const { showAlert } = useAlert();
    const { logout } = useUser();
    const navigate = useNavigate();

    // --- State ---
    const [hasAccess, setHasAccess] = useState(null);
    const [warehouse, setWarehouse] = useState(null);
    const [isPageLoading, setIsPageLoading] = useState(true);

    useEffect(() => {
        const initialize = async () => {
            setIsPageLoading(true);
            try {
                const { data } = await authServices.checkAccess();

                if (data.code === 'TOKEN_EXPIRED') {
                    showAlert(data.alertTitle, data.message, data.alertType, data.autoClose);
                    setTimeout(() => {
                        localStorage.removeItem('token');
                        logout();
                        navigate('/login');
                    }, 1500);
                    return;
                }

                if (!data.hasAccess) {
                    setHasAccess(false);
                } else {
                    const { data: whData } = await inventoryViewServices.getWarehouses();
                    if (whData.status && whData.data && whData.data.length > 0) {
                        const w = whData.data[0];
                        setWarehouse({ id: w.value, name: w.label, city: w.location });
                    } else {
                        // If the array is empty, they have no assigned warehouse
                        setHasAccess(false);
                    }
                }
            } catch (err) {
                console.error('Init Error:', err);
                showAlert('Connection Failed', 'Unable to connect to the server.', 'error', true);
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
                    <h1 className="inventory-title">Current Stock</h1>
                </div>
                <div className="inventory-content">
                    <div className="stock-loading">Loading logs...</div>
                </div>
            </div>
        );
    }

    if (hasAccess === false) {
        return (
            <div className="inventory-wrapper">
                <div className="inventory-header">
                    <h1 className="inventory-title">Current Stock</h1>
                </div>
                <div className="inventory-content">
                    <div className="no-access-box">
                        <div className="no-access-icon">
                            <AlertCircle size={36} />
                        </div>
                        <h2>Warehouse Assignment Required</h2>
                        <p>You currently don't have access to any warehouse records. Please contact your manager to view your movement history.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="inventory-wrapper">
            <div className="inventory-header">
                <div className="inventory-title-group">
                    <h1 className="inventory-title">Current Stock</h1>
                </div>
                
                {warehouse && (
                    <div className="warehouse-info-badge">
                        <WarehouseIcon size={16} />
                        <span className="warehouse-info-name">{warehouse.name}</span>
                        {(warehouse.city || warehouse.state) && (
                            <span className="warehouse-info-location">
                                <MapPin size={12} />
                                {[warehouse.city, warehouse.state].filter(Boolean).join(', ')}
                            </span>
                        )}
                    </div>
                )}
            </div>

            <div className="inventory-content">
                <SharedStockView 
                    role="staff" 
                    selectedWarehouses={warehouse ? [warehouse.id.toString()] : []}
                />
            </div>
        </div>
    );
};

export default CurrentStock;
