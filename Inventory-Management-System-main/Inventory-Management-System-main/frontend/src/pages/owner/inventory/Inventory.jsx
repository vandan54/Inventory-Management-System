import { useState, useEffect } from 'react';
import SharedStockView from '../../../components/inventory/SharedStockView/SharedStockView';
import { inventoryViewServices } from '../../../services/api/inventoryViewServices';
import { useAlert } from '../../../context/AlertContext';
import './Inventory.css';

const Inventory = () => {
    const { showAlert } = useAlert();

    const [isPageLoading, setIsPageLoading] = useState(true);
    const [warehouses, setWarehouses] = useState([]);
    const [selectedWarehouses, setSelectedWarehouses] = useState([]);

    useEffect(() => {
        const initialize = async () => {
            setIsPageLoading(true);
            try {
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
                    console.error('Warehouse API not ready. Using mock data.', whErr);
                }

                setWarehouses(whOptions);
                setSelectedWarehouses(whOptions.map(w => w.value));
            } catch (err) {
                console.error('Init Error:', err);
                showAlert('Connection Failed', 'Unable to connect to the server.', 'error', true);
            } finally {
                setIsPageLoading(false);
            }
        };

        initialize();
    }, []);

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

    return (
        <div className="inventory-wrapper">
            <div className="inventory-header">
                <h1 className="inventory-title">Inventory</h1>
            </div>

            <div className="inventory-content">
                <SharedStockView
                    role="owner"
                    selectedWarehouses={selectedWarehouses}
                    warehouses={warehouses}
                    onWarehouseChange={(vals) => setSelectedWarehouses(vals)}
                />
            </div>
        </div>
    );
};

export default Inventory;
