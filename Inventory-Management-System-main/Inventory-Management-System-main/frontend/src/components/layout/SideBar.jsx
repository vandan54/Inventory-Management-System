import { useUser } from "../../context/UserContext";
import { useNavigate, useLocation } from "react-router-dom";
import {
    LayoutDashboard,
    Package,
    Users,
    Building2,
    BarChart3,
    Tag,
    Lock,
    ClipboardList,
    History
} from "lucide-react";
import { GoGitCompare } from "react-icons/go";
import "./sidebar.css";

const menuConfig = {
    owner: [
        { label: "Dashboard", icon: LayoutDashboard, path: "/owner/dashboard" },
        { label: "Warehouses", icon: Building2, path: "/owner/warehouses" },
        { label: "Products", icon: Tag, path: "/owner/products" },
        { label: "Employees", icon: Users, path: "/owner/employees" },
        { label: "Access Management", icon: Lock, path: "/owner/access-management" },
        { label: "Inventory", icon: Package, path: "/owner/inventory" },
        { label: "Reports", icon: BarChart3, path: "/owner/reports" },
        // { label: "Audit Logs", icon: ClipboardList, path: "/owner/audit-logs" }
    ],
    manager: [
        { label: "Dashboard", icon: LayoutDashboard, path: "/manager/dashboard" },
        { label: "Staff Management", icon: Users, path: "/manager/staff" },
        { label: "Inventory", icon: Package, path: "/manager/inventory" },
        { label: "Reports", icon: BarChart3, path: "/manager/reports" }
    ],
    staff: [
        { label: "Stock Movement", icon: GoGitCompare, path: "/staff/stock-movement" },
        { label: "Current Stock", icon: Package, path: "/staff/inventory" },
        { label: "Recent Logs", icon: History, path: "/staff/history" }
    ]
};

export default function Sidebar({ isOpen, closeSidebar }) {
    const { user } = useUser();
    const navigate = useNavigate();
    const location = useLocation();

    const menuItems = menuConfig[user?.role] || [];

    const handleNavigate = (path) => {
        navigate(path);
        if (window.innerWidth <= 768) {
            closeSidebar();
        }
    };

    const isActive = (path) => location.pathname === path;

    return (
        <>
            {isOpen && <div className="sidebar-overlay" onClick={closeSidebar}></div>}

            <aside className={`sidebar ${isOpen ? "open" : ""}`}>
                <div className="sidebar-nav">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <button
                                key={item.path}
                                className={`nav-item ${isActive(item.path) ? "active" : ""}`}
                                onClick={() => { if (location.pathname !== item.path) { handleNavigate(item.path) } }}
                                title={item.label}
                            >
                                <Icon size={20} className="nav-icon" />
                                <span className="nav-label">{item.label}</span>
                            </button>
                        );
                    })}
                </div>
            </aside>
        </>
    );
}