import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users,
    Package,
    AlertTriangle,
    ChevronRight,
    ArrowDownCircle,
    ArrowUpCircle,
    ShieldAlert,
    BarChart2,
    Home,
    AlertCircle
} from 'lucide-react';
import { authServices } from '../../../services/api/authServices';
import { dashboardServices } from '../../../services/api/dashboardServices';
import { useAlert } from '../../../context/AlertContext';
import { useUser } from '../../../context/UserContext';
import './Dashboard.css';

// Manager sees ONLY their assigned warehouses (user_warehouse_access table)
// inventory_transactions scoped to those warehouse IDs
// items.reorder_level vs inventory.quantity within those warehouses

// Utility for relative time formatting
const formatRelativeTime = (dateString) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffInMs = now - past;
    const diffInMins = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMins < 1) return 'Just now';
    if (diffInMins < 60) return `${diffInMins}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays === 1) return 'Yesterday';
    return `${diffInDays} days ago`;
};

const getLogIcon = (type) => {
    switch (type) {
        case 'IN': return { icon: ArrowDownCircle, bg: '#d1fae5', color: '#059669' };
        case 'OUT': return { icon: ArrowUpCircle, bg: '#fee2e2', color: '#ef4444' };
        default: return { icon: Home, bg: '#fef3c7', color: '#d97706' };
    }
};

const ManagerDashboard = () => {
    const navigate = useNavigate();
    const { showAlert } = useAlert();
    const { logout } = useUser();

    const [hasAccess, setHasAccess] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [assignedWarehouses, setAssignedWarehouses] = useState([]);
    const [dashboardData, setDashboardData] = useState({
        stats: { myWarehouses: 0, myStaff: 0, itemsInStock: 0, lowStock: 0 },
        logs: [],
        alerts: []
    });

    useEffect(() => {
        const init = async () => {
            try {
                // 1. Initial Access Check
                const { data: accessRes } = await authServices.checkAccess();
                if (accessRes.code === 'TOKEN_EXPIRED') {
                    showAlert(accessRes.alertTitle, accessRes.message, accessRes.alertType, accessRes.autoClose);
                    setTimeout(() => { localStorage.removeItem('token'); logout(); navigate('/login'); }, 1500);
                    return;
                }

                if (!accessRes.hasAccess) {
                    setHasAccess(false);
                    setIsLoading(false);
                    return;
                }

                setHasAccess(true);

                // 2. Fetch Live Dashboard Data
                const { data: dashRes } = await dashboardServices.getManagerDashboard();
                if (dashRes.status) {
                    setDashboardData(dashRes.data);
                    setAssignedWarehouses(dashRes.data.assignedWarehouses || []);
                }
            } catch (err) {
                console.error("Dashboard initialization failed", err);
                setHasAccess(false);
            } finally {
                setIsLoading(false);
            }
        };
        init();
    }, []);

    if (isLoading) {
        return (
            <div className="dashboard-wrapper">
                <div className="dashboard-header">
                    <h1 className="dashboard-title">Dashboard</h1>
                </div>
                <div className="dashboard-body">
                    <div className="stock-loading">Loading dashboard analytics...</div>
                </div>
            </div>
        );
    }

    if (hasAccess === false) {
        return (
            <div className="dashboard-wrapper">
                <div className="dashboard-header">
                    <h1 className="dashboard-title">Dashboard</h1>
                </div>
                <div className="dashboard-body">
                    <div className="no-access-box">
                        <div className="no-access-icon">
                            <AlertCircle size={36} />
                        </div>
                        <h2>Access Restricted</h2>
                        <p>You currently do not have management permissions for any warehouse. Please contact the business owner to grant you access before you can manage operations.</p>
                    </div>
                </div>
            </div>
        );
    }

    const stats = [
        { label: 'My Warehouses', value: dashboardData.stats.myWarehouses.toString(), icon: Home, color: '#4f63d2', path: '/manager/staff' },
        { label: 'My Staff', value: dashboardData.stats.myStaff.toString(), icon: Users, color: '#10b981', path: '/manager/staff' },
        { label: 'Items In Stock', value: dashboardData.stats.itemsInStock.toString(), icon: Package, color: '#0ea5e9', path: '/manager/inventory' },
        { label: 'Reorder Needed', value: dashboardData.stats.lowStock.toString(), icon: AlertTriangle, color: '#ef4444', path: '/manager/inventory' }
    ];

    return (
        <div className="dashboard-wrapper">
            <div className="dashboard-header">
                <h1 className="dashboard-title">Dashboard</h1>
            </div>

            <div className="dashboard-body">
                {/* Manager's scope stats — only for their assigned warehouses */}
                <div className="dashboard-stats-row">
                    {stats.map((s, i) => (
                        <div key={i} className="stat-tile" onClick={() => navigate(s.path)}>
                            <span className="stat-tile-label">
                                <s.icon size={13} color={s.color} />
                                {s.label}
                            </span>
                            <span className="stat-tile-value">{s.value}</span>
                            <span className="stat-tile-link" style={{ fontSize: '10.5px', color: s.color, marginTop: '8px', fontWeight: '500' }}>View All →</span>
                        </div>
                    ))}
                </div>

                <div className="dashboard-grid">
                    {/* Left: Scrollable Activity — inventory_transactions for assigned WHs */}
                    <div className="dash-section">
                        <div className="dash-section-head">
                            <span className="dash-section-title">Warehouse Activity</span>
                            <button className="dash-link-btn" onClick={() => navigate('/manager/reports')}>Full Report →</button>
                        </div>
                        <div className="activity-list activity-list--scroll">
                            {dashboardData.logs.length > 0 ? dashboardData.logs.map((log, idx) => {
                                const config = getLogIcon(log.type);
                                return (
                                    <div key={idx} className="activity-item" onClick={() => navigate('/manager/inventory')}>
                                        <div className="activity-icon" style={{ background: config.bg }}>
                                            <config.icon size={16} color={config.color} />
                                        </div>
                                        <div className="activity-text">
                                            <div className="activity-main">{log.text}</div>
                                            <div className="activity-meta">{log.meta} · {formatRelativeTime(log.created_at)}</div>
                                        </div>
                                        <ChevronRight size={16} className="activity-arrow" />
                                    </div>
                                );
                            }) : (
                                <div className="no-data-notice" style={{ padding: '2rem', textAlign: 'center', color: '#8a94b2' }}>
                                    No recent activity found.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Reorder Alerts + Quick Actions (same pattern as owner) */}
                    <div className="dash-section">
                        <div className="dash-section-head">
                            <span className="dash-section-title">
                                <AlertTriangle size={15} color="#ef4444" />
                                Reorder Alerts
                            </span>
                            <button className="dash-link-btn" onClick={() => navigate('/manager/inventory')}>View All →</button>
                        </div>
                        <div className="notice-panel">
                            {dashboardData.alerts.length > 0 ? dashboardData.alerts.map((a, i) => (
                                <div key={i} className="notice-row" onClick={() => navigate('/manager/inventory')}>
                                    <div>
                                        <div className="notice-label">{a.name}</div>
                                        <div className="notice-sub">{a.warehouse} · Stock: {a.stock} / Min: {a.reorder}</div>
                                    </div>
                                    <span className={`notice-badge ${a.badge}`}>
                                        {a.badge === 'red' ? 'Critical' : 'Low'}
                                    </span>
                                </div>
                            )) : (
                                <div className="no-data-notice" style={{ padding: '2rem', textAlign: 'center', color: '#8a94b2' }}>
                                    All inventory levels are healthy.
                                </div>
                            )}
                        </div>

                        {/* Same button structure as owner, but with manager-scoped destinations */}
                        <div className="quick-actions">
                            <button className="quick-action-btn" onClick={() => navigate('/manager/staff')}>
                                <Users size={16} color="#4f63d2" /> Manage Staff
                            </button>
                            <button className="quick-action-btn" onClick={() => navigate('/manager/inventory')}>
                                <Package size={16} color="#0ea5e9" /> Manage Inventory
                            </button>
                            <button className="quick-action-btn" onClick={() => navigate('/manager/reports')}>
                                <BarChart2 size={16} color="#10b981" /> Generate Report
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManagerDashboard;
