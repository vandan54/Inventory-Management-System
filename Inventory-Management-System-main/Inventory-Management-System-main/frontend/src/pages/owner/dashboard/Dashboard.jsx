import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Home,
    Users,
    Package,
    AlertTriangle,
    ChevronRight,
    ArrowDownCircle,
    ArrowUpCircle,
    UserPlus,
    BarChart2,
    Warehouse,
    Settings
} from 'lucide-react';
import { dashboardServices } from '../../../services/api/dashboardServices';
import { useAlert } from '../../../context/AlertContext';
import { useUser } from '../../../context/UserContext';
import './Dashboard.css';

// Based on DB: activity_logs table — action + entity_type + metadata + created_at
// Owner sees all warehouses, all employees, all product/inventory movements
// Utility for relative time formatting
const formatRelativeTime = (dateString) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffInMs = now - past;
    const diffInMins = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(past - now); // wait, past-now is wrong
    // Let's use simple logic
    const diffM = Math.floor(diffInMs / 60000);
    const diffH = Math.floor(diffM / 60);
    const diffD = Math.floor(diffH / 24);

    if (diffM < 1) return 'Just now';
    if (diffM < 60) return `${diffM}m ago`;
    if (diffH < 24) return `${diffH}h ago`;
    if (diffD === 1) return 'Yesterday';
    return `${diffD} days ago`;
};

const getLogIcon = (log) => {
    if (log.source === 'inventory') {
        return log.type === 'IN'
            ? { icon: ArrowDownCircle, bg: '#d1fae5', color: '#059669' }
            : { icon: ArrowUpCircle, bg: '#fee2e2', color: '#ef4444' };
    }
    // Activity source
    return { icon: Home, bg: '#fef3c7', color: '#d97706' };
};

const OwnerDashboard = () => {
    const navigate = useNavigate();
    const { showAlert } = useAlert();
    const { logout } = useUser();

    const [isLoading, setIsLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState({
        stats: { warehouses: 0, employees: 0, products: 0, lowStock: 0 },
        logs: [],
        alerts: []
    });

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const { response, data } = await dashboardServices.getOwnerDashboard();
                if (response.status === 401 || response.status === 403) {
                    showAlert("Session Expired", "Please login again", "warning");
                    setTimeout(() => { localStorage.removeItem('token'); logout(); navigate('/login'); }, 1500);
                    return;
                }
                if (data.status) {
                    setDashboardData(data.data);
                }
            } catch (err) {
                console.error("Failed to fetch dashboard data", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchDashboard();
    }, []);

    if (isLoading) {
        return (
            <div className="dashboard-wrapper">
                <div className="dashboard-header">
                    <h1 className="dashboard-title">Dashboard</h1>
                </div>
                <div style={{ padding: '4rem', textAlign: 'center', color: '#8a94b2' }}>
                    Loading dashboard analytics...
                </div>
            </div>
        );
    }

    const statsConfig = [
        { label: 'Warehouses', value: dashboardData.stats.warehouses.toString(), icon: Home, color: '#4f63d2', path: '/owner/warehouses' },
        { label: 'Employees', value: dashboardData.stats.employees.toString(), icon: Users, color: '#10b981', path: '/owner/employees' },
        { label: 'Products', value: dashboardData.stats.products.toString(), icon: Package, color: '#0ea5e9', path: '/owner/products' },
        { label: 'Low Stock', value: dashboardData.stats.lowStock.toString(), icon: AlertTriangle, color: '#ef4444', path: '/owner/inventory' }
    ];

    return (
        <div className="dashboard-wrapper">
            <div className="dashboard-header">
                <h1 className="dashboard-title">Dashboard</h1>
            </div>

            <div className="dashboard-body">
                {/* Stats — clicking takes owner to the relevant management page */}
                <div className="dashboard-stats-row">
                    {statsConfig.map((s, i) => (
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
                    {/* Left: Scrollable Activity Feed (activity_logs table) */}
                    <div className="dash-section">
                        <div className="dash-section-head">
                            <span className="dash-section-title">Recent Activity</span>
                            <button className="dash-link-btn" onClick={() => navigate('/owner/reports')}>Full Report →</button>
                        </div>
                        <div className="activity-list activity-list--scroll">
                            {dashboardData.logs.length > 0 ? dashboardData.logs.map((log, idx) => {
                                const config = getLogIcon(log);
                                return (
                                    <div key={idx} className="activity-item" onClick={() => navigate(log.source === 'inventory' ? '/owner/inventory' : '/owner/reports')}>
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

                    {/* Right: Reorder Alerts + Quick Management Actions */}
                    <div className="dash-section">
                        <div className="dash-section-head">
                            <span className="dash-section-title">
                                <AlertTriangle size={15} color="#ef4444" />
                                Reorder Alerts
                            </span>
                            <button className="dash-link-btn" onClick={() => navigate('/owner/inventory')}>View All →</button>
                        </div>
                        <div className="notice-panel">
                            {dashboardData.alerts.length > 0 ? dashboardData.alerts.map((a, i) => (
                                <div key={i} className="notice-row" onClick={() => navigate('/owner/inventory')}>
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

                        {/* Quick Actions — owner can jump to all mgmt areas */}
                        <div className="quick-actions">
                            <button className="quick-action-btn" onClick={() => navigate('/owner/employees')}>
                                <Users size={16} color="#4f63d2" /> Manage Employees
                            </button>
                            <button className="quick-action-btn" onClick={() => navigate('/owner/warehouses')}>
                                <Warehouse size={16} color="#0ea5e9" /> Manage Warehouses
                            </button>
                            <button className="quick-action-btn" onClick={() => navigate('/owner/reports')}>
                                <BarChart2 size={16} color="#10b981" /> Generate Report
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OwnerDashboard;
