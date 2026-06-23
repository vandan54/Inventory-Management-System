import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    AlertCircle,
    Warehouse as WarehouseIcon,
    MapPin
} from 'lucide-react';
import Table from '../../../components/table/Table';
import { authServices } from '../../../services/api/authServices';
import { inventoryServices } from '../../../services/api/inventoryServices';
import { useAlert } from '../../../context/AlertContext';
import { useUser } from '../../../context/UserContext';
import './RecentLogs.css';

const RecentLogs = () => {
    const { showAlert } = useAlert();
    const { logout } = useUser();
    const navigate = useNavigate();

    // --- State ---
    const [hasAccess, setHasAccess] = useState(null); // null = checking, true/false = resolved
    const [warehouse, setWarehouse] = useState(null);
    const [isPageLoading, setIsPageLoading] = useState(true);
    const [isDataLoading, setIsDataLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Demo data for now
    const [logs, setLogs] = useState([]);

    // ===== 1. DATA FETCHING =====
    const fetchLogs = async (page = 1) => {
        setIsDataLoading(true);
        try {
            const { data } = await inventoryServices.getStaffRecentLogs(page, 15);
            if (data.status && data.data) {
                const formattedLogs = data.data.map(log => {
                    const dt = new Date(Number(log.created_at));
                    return {
                        ...log,
                        date: dt.toLocaleDateString('en-GB'),
                        time: dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
                        tracking_value: log.batch_number || log.serial_number || null
                    };
                });
                setLogs(formattedLogs);
                if (data.pagination) {
                    setTotalPages(data.pagination.totalPages || 1);
                }
            }
        } catch (err) {
            console.error('Fetch Logs Error:', err);
            showAlert('Error', 'Could not load your recent activity.', 'error', true);
        } finally {
            setIsDataLoading(false);
        }
    };

    // ===== 2. INITIALIZE & CHECK ACCESS =====
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
                    setHasAccess(true);

                    // Get staff warehouse to show in header
                    const { data: whData } = await inventoryServices.getStaffWarehouse();
                    if (whData.hasAccess && whData.data) {
                        setWarehouse(whData.data);
                    }
                }
            } catch (err) {
                console.error('Logs Init Error:', err);
                showAlert('Connection Failed', 'Unable to connect to the server.', 'error', true);
            } finally {
                setIsPageLoading(false);
            }
        };

        initialize();
    }, []);

    useEffect(() => {
        if (hasAccess) {
            fetchLogs(currentPage);
        }
    }, [currentPage, hasAccess]);

    // ===== 3. TABLE CONFIG =====
    const columns = [
        {
            key: 'date',
            label: 'Date & Time',
            render: (value, row) => (
                <div>
                    <span className="date-primary">{row.date}</span>
                    <span className="date-secondary">{row.time}</span>
                </div>
            )
        },
        {
            key: 'product_name',
            label: 'Product Info',
            render: (value, row) => (
                <div>
                    <span className="date-primary">{value}</span>
                    <span className="date-secondary">{row.sku}</span>
                </div>
            )
        },
        {
            key: 'type',
            label: 'Action',
            render: (value) => (
                <span className={`move-text ${value.toLowerCase()}`}>
                    Stock {value.toLowerCase()}
                </span>
            )
        },
        {
            key: 'tracking_value',
            label: 'Tracking',
            render: (value) => {
                const displayValue = value?.toString().trim();
                if (!displayValue || displayValue === 'null') return <span className="date-secondary">N/A</span>;
                return (
                    <span className="tracking-text">
                        {displayValue}
                    </span>
                );
            }
        },
        {
            key: 'quantity',
            label: 'Quantity',
            render: (value, row) => (
                <span className={`qty-impact ${row.type.toLowerCase()}`}>
                    {row.type === 'IN' ? '+ ' : '- '}
                    {value}
                    <span className="qty-unit">{row.unit || 'units'}</span>
                </span>
            )
        },
        {
            key: 'reason',
            label: 'Reason',
            render: (value) => <span className="date-secondary">{value}</span>
        }
    ];

    // ===== RENDER LOGIC =====
    if (isPageLoading) {
        return (
            <div className="logs-wrapper">
                <div className="logs-header">
                    <h1 className="logs-title">Recent Logs</h1>
                </div>
                <div className="logs-content">
                    <div className="stock-loading">Loading logs...</div>
                </div>
            </div>
        );
    }

    if (hasAccess === false) {
        return (
            <div className="logs-wrapper">
                <div className="logs-header">
                    <h1 className="logs-title">Recent Logs</h1>
                </div>
                <div className="logs-content">
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
        <div className="logs-wrapper">
            <div className="logs-header">
                <div className="logs-title-group">
                    <h1 className="logs-title">Recent Logs</h1>
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

            <div className="logs-content">
                <Table
                    data={logs}
                    columns={columns}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPrevPage={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    onNextPage={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    isLoading={isDataLoading}
                />
            </div>
        </div>
    );
};

export default RecentLogs;
