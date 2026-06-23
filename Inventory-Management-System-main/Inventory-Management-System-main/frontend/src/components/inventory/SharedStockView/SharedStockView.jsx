import React, { useState, useEffect } from 'react';
import {
    Package,
    AlertTriangle,
    Clock
} from 'lucide-react';
import Table from '../../table/Table';
import Select from '../../form/Select';
import MultiSelect from '../../form/MultiSelect';
import StockDetailsModal from '../StockDetailsModal/StockDetailsModal';
import './SharedStockView.css';

import { inventoryViewServices } from '../../../services/api/inventoryViewServices';

export default function SharedStockView({ role, selectedWarehouses = [], warehouses = [], onWarehouseChange }) {
    // Table State
    const [stockData, setStockData] = useState([]);
    const [isDataLoading, setIsDataLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Modal State
    const [selectedItem, setSelectedItem] = useState(null);

    // Filters State - Using arrays for MultiSelect consistency
    const [searchTerm, setSearchTerm] = useState('');
    const [trackingFilter, setTrackingFilter] = useState([]);
    const [alertFilter, setAlertFilter] = useState([]);
    const [kpis, setKpis] = useState({ totalProducts: 0, lowStockAlerts: 0, expiringSoon: 0 });

    // --- LIVE API FETCH ---
    const fetchStockData = async () => {
        setIsDataLoading(true);
        try {
            // Fetch List & KPIs in parallel, both applying the same filters
            const filters = { search: searchTerm, trackingTypes: trackingFilter, statuses: alertFilter };
            
            inventoryViewServices.getInventoryKPIs(selectedWarehouses, filters).then(res => {
                if (res.data?.status) setKpis(res.data.data);
            }).catch(console.error);

            // Fetch Main List
            const { data } = await inventoryViewServices.getInventoryList(selectedWarehouses, filters, currentPage, 10);

            if (data?.status) {
                setStockData(data.data);
                setTotalPages(data.pagination.totalPages || 1);
            }
        } catch (err) {
            console.error("Failed to load stock data:", err);
            setStockData([]);
        } finally {
            setIsDataLoading(false);
        }
    };

    useEffect(() => {
        setIsDataLoading(true);
        const timer = setTimeout(() => {
            fetchStockData();
        }, 500);
        return () => clearTimeout(timer);
    }, [currentPage, trackingFilter, alertFilter, searchTerm, selectedWarehouses]);

    // --- TABLE COLUMNS CONFIG ---
    const getColumns = () => [
        {
            key: 'name',
            label: 'Product Info',
            render: (value, row) => (
                <div>
                    <span className="qty-impact" style={{ display: 'block' }}>{value}</span>
                    <span className="qty-unit" style={{ marginLeft: 0 }}>{row.sku}</span>
                </div>
            )
        },
        { key: 'category', label: 'Category' },
        {
            key: 'tracking_type',
            label: 'Tracking Mode',
            render: (value) => {
                switch (value) {
                    case 'SERIAL': return <span className="track-badge serial">Serial No.</span>;
                    case 'BATCH': return <span className="track-badge batch">Batch</span>;
                    case 'BATCH_EXPIRY': return <span className="track-badge expiry">Batch + Expiry</span>;
                    default: return <span className="track-badge qty">Standard Qty</span>;
                }
            }
        },
        {
            key: 'total_qty',
            label: 'Total Quantity',
            render: (value, row) => (
                <span className="qty-impact">
                    {value} <span className="qty-unit">{row.unit}</span>
                </span>
            )
        },
        {
            key: 'status',
            label: 'Status',
            render: (_, row) => {
                const alerts = [];
                if (row.total_qty <= row.reorder_level) {
                    alerts.push(
                        <span key="low" className="status-alert alert-danger" style={{ display: 'flex', marginBottom: '0.2rem' }}>
                            <AlertTriangle size={14} /> Low Stock
                        </span>
                    );
                }
                
                // Expiry determined explicitly by backend
                if (row.is_expiring === 1) {
                    alerts.push(
                        <span key="exp" className="status-alert alert-warning" style={{ display: 'flex' }}>
                            <Clock size={14} /> Expiring Soon
                        </span>
                    );
                }
                return alerts.length > 0 ? <div>{alerts}</div> : <span className="status-alert alert-safe">Normal</span>;
            }
        }
    ];

    const getActions = () => {
        return [
            {
                key: 'view',
                label: 'View Details',
                type: 'edit',
                handler: async (row) => {
                    // Set optimistic item so modal opens indicating loading state
                    setSelectedItem({ ...row, details: [], breakdown: [], isLoadingData: true });
                    try {
                        const { data } = await inventoryViewServices.getItemDetails(row.id, selectedWarehouses);
                        if (data?.status && data.data) {
                            setSelectedItem({ ...row, breakdown: data.data.breakdown || [], details: data.data.details || [], isLoadingData: false });
                        }
                    } catch (err) {
                        console.error("Failed fetching item details", err);
                        setSelectedItem({ ...row, breakdown: [], details: [], isLoadingData: false, error: true });
                    }
                },
                showIf: (row) => row.tracking_type !== 'QTY' || (isMultiLocation && row.breakdown && row.breakdown.length > 0)
            }
        ];
    };

    // --- RENDER ---
    const isMultiLocation = selectedWarehouses.length > 1 || selectedWarehouses.length === 0;

    return (
        <div className="shared-stock-component">

            {/* 1. KPIs */}
            <div className="inventory-kpi-grid">
                <div className="kpi-card">
                    <div className="kpi-title"><Package size={16} /> Total Products</div>
                    <div className="kpi-value">{kpis.totalProducts.toLocaleString()}</div>
                </div>
                <div className="kpi-card alert-red">
                    <div className="kpi-title"><AlertTriangle size={16} /> Low Stock Alerts</div>
                    <div className="kpi-value">{kpis.lowStockAlerts.toLocaleString()}</div>
                </div>
                <div className="kpi-card alert-amber">
                    <div className="kpi-title"><Clock size={16} /> {"Expiring < 7 Days"}</div>
                    <div className="kpi-value">{kpis.expiringSoon.toLocaleString()}</div>
                </div>
            </div>

            {/* 2. List Search & Filters (Premium Control Panel Layout) */}
            <div className="stock-tools-container">
                <div className="search-bar-wrapper">
                    <input
                        type="text"
                        placeholder="Search by product name or SKU..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input full-width-search"
                    />
                </div>

                <div className="filters-grid">
                    {role !== 'staff' && warehouses.length > 0 && (
                        <MultiSelect
                            options={warehouses}
                            selectedValues={selectedWarehouses}
                            onChange={(vals) => onWarehouseChange(vals)}
                            placeholder="Select Warehouses"
                            allSelectedLabel="All Warehouses"
                        />
                    )}

                    <MultiSelect
                        options={[
                            { label: "Standard Qty", value: "QTY" },
                            { label: "Serial Tracked", value: "SERIAL" },
                            { label: "Batch Tracked", value: "BATCH" },
                            { label: "Perishable (Expiry)", value: "BATCH_EXPIRY" }
                        ]}
                        selectedValues={trackingFilter}
                        onChange={(vals) => setTrackingFilter(vals)}
                        placeholder="Stock Types"
                        allSelectedLabel="All Stock Types"
                    />

                    <MultiSelect
                        options={[
                            { label: "Low Stock Alert", value: "LOW_STOCK" },
                            { label: "Expiring Soon", value: "EXPIRING" }
                        ]}
                        selectedValues={alertFilter}
                        onChange={(vals) => setAlertFilter(vals)}
                        placeholder="All Statuses"
                        allSelectedLabel="All Statuses"
                    />
                </div>
            </div>

            {/* 3. The Standard Table Component */}
            <Table
                data={stockData}
                columns={getColumns()}
                actions={getActions()}
                currentPage={currentPage}
                totalPages={totalPages}
                onPrevPage={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                onNextPage={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                isLoading={isDataLoading}
            />

            {/* 4. Isolated View Details Modal */}
            {selectedItem && (
                <StockDetailsModal
                    item={selectedItem}
                    onClose={() => setSelectedItem(null)}
                    showLocation={isMultiLocation}
                />
            )}
        </div>
    );
}
