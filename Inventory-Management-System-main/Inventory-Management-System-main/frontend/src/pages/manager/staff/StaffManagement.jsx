import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle } from 'lucide-react';
import Table from "../../../components/table/Table";
import Select from "../../../components/form/Select";
import { useAlert } from "../../../context/AlertContext";
import { useUser } from "../../../context/UserContext";
import { authServices } from "../../../services/api/authServices";
import { managerServices } from "../../../services/api/managerServices";
import "./StaffManagement.css";

/* ================= COMPONENT ================= */

export default function StaffManagement() {
    const navigate = useNavigate();
    const { showAlert } = useAlert();
    const { logout } = useUser();

    // --- Access & Loading ---
    const [hasAccess, setHasAccess] = useState(null);
    const [isPageLoading, setIsPageLoading] = useState(true);

    // --- State ---
    const [warehouses, setWarehouses] = useState([]);
    const [selectedWarehouseId, setSelectedWarehouseId] = useState(null);
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [isSidebarLoading, setIsSidebarLoading] = useState(true);
    const [isDataLoading, setIsDataLoading] = useState(true);

    /* ================= INITIALIZE & CHECK ACCESS ================= */

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
                    fetchWarehouses();
                }
            } catch (err) {
                console.error('Core Init Error:', err);
                showAlert('Connection Failed', 'Unable to connect to the server.', 'error', true);
            } finally {
                setIsPageLoading(false);
            }
        };

        initialize();
    }, []);

    /* ================= LOAD WAREHOUSES ================= */

    const fetchWarehouses = async () => {
        setIsSidebarLoading(true);
        try {
            const { data } = await managerServices.getManagerWarehouses();
            if (data.status && data.data.length > 0) {
                setWarehouses(data.data);
                setSelectedWarehouseId(data.data[0].id);
            } else {
                setHasAccess(false);
            }
        } catch (err) {
            console.error("Failed to fetch warehouses:", err);
            showAlert("Error", "Could not load warehouses.", "error", true);
        } finally {
            setIsSidebarLoading(false);
        }
    };

    /* ================= TOGGLE STATUS ================= */

    const toggleUserStatus = async (userId, currentStatus) => {
        const newStatus = currentStatus === 1 ? 0 : 1;

        try {
            const { data } = await managerServices.toggleStaffStatus(selectedWarehouseId, userId, newStatus === 1);

            if (data.status) {
                setUsers(prev =>
                    prev.map(u => u.id === userId ? { ...u, is_active: newStatus } : u)
                );
                showAlert("Success", data.message || "Status updated", "success", true);
            } else {
                showAlert(data.alertTitle || "Error", data.message || "Update failed", data.alertType || "error", true);
            }
        } catch (err) {
            console.error("Status update error:", err);
            showAlert("Error", "Failed to update status. Please try again.", "error", true);
        }
    };

    /* ================= TABLE COLUMNS ================= */

    const getUserColumns = () => [
        { key: "name", label: "Name" },
        { key: "email", label: "Email" },
        { key: "contact", label: "Contact Number" },
        {
            key: "action",
            label: "Status",
            render: (_, row) => (
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <label className="switch">
                        <input
                            type="checkbox"
                            checked={row.is_active === 1}
                            onChange={() =>
                                toggleUserStatus(row.id, row.is_active)
                            }
                        />
                        <span className="slider"></span>
                    </label>

                    <span
                        className={`status-text ${row.is_active === 1 ? "active" : "inactive"
                            }`}
                    >
                        {row.is_active === 1 ? "Active" : "Inactive"}
                    </span>
                </div>
            ),
        },
    ];

    /* ================= FETCH USERS ================= */

    const fetchUsers = async () => {
        if (!selectedWarehouseId) return;

        setIsDataLoading(true);
        try {
            const { data } = await managerServices.getWarehouseStaff(selectedWarehouseId, currentPage, 10, searchTerm);

            if (data.status) {
                setUsers(data.data);
                setTotalPages(data.pagination.totalPages);
            }
        } catch (err) {
            console.error("Fetch staff error:", err);
            showAlert("Error", "Could not fetch staff members.", "error", true);
        } finally {
            setIsDataLoading(false);
        }
    };

    useEffect(() => {
        if (selectedWarehouseId) {
            const timer = setTimeout(fetchUsers, 300);
            return () => clearTimeout(timer);
        }
    }, [selectedWarehouseId, searchTerm, currentPage]);

    /* ================= OPTIONS ================= */

    const warehouseOptions = warehouses.map((w) => ({
        label: `${w.name} (${w.city})`,
        value: w.id,
    }));

    /* ================= RENDER LOGIC ================= */

    if (isPageLoading) {
        return (
            <div className="access-wrapper">
                <div className="access-header">
                    <h1 className="access-title">Staff Management</h1>
                </div>
                <div className="access-content">
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '50px', color: '#64748b' }}>
                        Loading staff management...
                    </div>
                </div>
            </div>
        );
    }

    if (hasAccess === false) {
        return (
            <div className="access-wrapper">
                <div className="access-header">
                    <h1 className="access-title">Staff Management</h1>
                </div>
                <div className="access-content">
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
        <div className="access-wrapper">
            <div className="access-header">
                <h1 className="access-title">Staff Management</h1>
            </div>

            <div className="access-content">
                {/* Mobile Dropdown */}
                <div className="mobile-wh-select">
                    <Select
                        label="Select Warehouse"
                        options={warehouseOptions}
                        value={selectedWarehouseId || ""}
                        onChange={(e) => {
                            setSelectedWarehouseId(Number(e.target.value));
                            setCurrentPage(1);
                            setIsDataLoading(true);
                        }}
                    />
                </div>

                <div className="access-layout">
                    {/* Sidebar */}
                    <div className="access-sidebar-container">
                        <div className="access-sidebar">
                            <h3 className="access-sidebar-title">
                                Warehouses
                            </h3>

                            {isSidebarLoading ? (
                                <div style={{ padding: '10px', color: '#94a3b8', fontSize: '0.9rem' }}>Loading...</div>
                            ) : (
                                warehouses.map((w) => (
                                    <button
                                        key={w.id}
                                        className={`wh-nav-item ${selectedWarehouseId === w.id
                                            ? "active"
                                            : ""
                                            }`}
                                        onClick={() => {
                                            setSelectedWarehouseId(w.id);
                                            setCurrentPage(1);
                                            setIsDataLoading(true);
                                        }}
                                    >
                                        <span className="wh-nav-item-name">
                                            {w.name}
                                        </span>
                                        <span className="wh-nav-item-loc">
                                            {w.city}, {w.state}
                                        </span>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Main */}
                    <div className="access-main">
                        <div className="access-toolbar">
                            <input
                                className="search-input"
                                placeholder="Search users..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                    setIsDataLoading(true);
                                }}
                            />
                        </div>

                        <Table
                            data={users}
                            columns={getUserColumns()}
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPrevPage={() =>
                                setCurrentPage((p) => Math.max(1, p - 1))
                            }
                            onNextPage={() =>
                                setCurrentPage((p) =>
                                    Math.min(totalPages, p + 1)
                                )
                            }
                            isLoading={isDataLoading}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}