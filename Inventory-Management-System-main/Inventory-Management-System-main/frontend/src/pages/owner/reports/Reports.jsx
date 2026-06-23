import React, { useState, useEffect } from 'react';
import SharedReportsView from '../../../components/reports/SharedReportsView';
import { reportServices } from '../../../services/api/reportServices';
import './Reports.css';

const Reports = () => {
    const [warehouses, setWarehouses] = useState([]);
    const [selectedWarehouses, setSelectedWarehouses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchWarehouses = async () => {
            setIsLoading(true);
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
                }
            } catch (err) {
                console.error("Failed to fetch warehouses for reports:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchWarehouses();
    }, []);

    return (
        <div className="reports-wrapper">
            <div className="reports-header">
                <h1 className="reports-title">Business Reports</h1>
            </div>

            <div className="reports-content">
                {isLoading ? (
                    <div className="reports-loading">Loading report engine...</div>
                ) : (
                    <SharedReportsView
                        role="owner"
                        warehouses={warehouses}
                        selectedWarehouses={selectedWarehouses}
                        onWarehouseChange={(vals) => setSelectedWarehouses(vals)}
                    />
                )}
            </div>
        </div>
    );
};

export default Reports;
