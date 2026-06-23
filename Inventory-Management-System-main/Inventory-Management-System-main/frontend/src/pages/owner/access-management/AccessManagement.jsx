import { useState, useEffect } from "react";
import Table from "../../../components/table/Table";
import Select from "../../../components/form/Select";
import MultiSelectModal from "../../../components/modal/MultiSelectModal";
import { accessServices } from "../../../services/api/accessServices";
import { useAlert } from "../../../context/AlertContext";
import "./AccessManagement.css";

// --- Mock Data ---
// Mock data removed in favor of real API calls

export default function AccessManagement() {
    // --- State Management ---
    const [warehouses, setWarehouses] = useState([]);
    const [selectedWarehouseId, setSelectedWarehouseId] = useState(null);
    const [activeTab, setActiveTab] = useState("products");

    const [products, setProducts] = useState([]);
    const [users, setUsers] = useState([]);

    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Loading States
    const [isSidebarLoading, setIsSidebarLoading] = useState(true);
    const [isDataLoading, setIsDataLoading] = useState(true);
    const [actionLoadingId, setActionLoadingId] = useState(null); // Row-level removal loading
    const [isAssignLoading, setIsAssignLoading] = useState(false); // Modal assignment loading
    const [isModalLoading, setIsModalLoading] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);

    const { showAlert } = useAlert();

    // 1. Initial Load: Fetch Warehouses
    useEffect(() => {
        const fetchWarehouses = async () => {
            try {
                setIsSidebarLoading(true);
                const { response, data } = await accessServices.getMinimalWarehouses();
                if (response.ok && data.status) {
                    setWarehouses(data.data || []);
                    if (data.data && data.data.length > 0) {
                        setSelectedWarehouseId(data.data[0].id);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch warehouses", err);
            } finally {
                setIsSidebarLoading(false);
            }
        };
        fetchWarehouses();
    }, []);

    const selectedWarehouse = warehouses.find(wh => wh.id === selectedWarehouseId);

    const toggleProductActive = async (productId, currentStatus) => {
        const newStatus = currentStatus === 1 ? 0 : 1;

        // Optimistic Update
        setProducts(prev => prev.map(p => p.id === productId ? { ...p, is_active: newStatus } : p));

        try {
            const { response, data } = await accessServices.toggleProductStatus(selectedWarehouseId, productId, newStatus);
            if (response.ok && data.status) {
                showAlert(data.alertTitle, data.message, "success", true);
            } else {
                // Revert on failure
                setProducts(prev => prev.map(p => p.id === productId ? { ...p, is_active: currentStatus } : p));
                showAlert(data.alertTitle || "Error", data.message || "Failed to update status", "error", true);
            }
        } catch (err) {
            // Revert on connection failure
            setProducts(prev => prev.map(p => p.id === productId ? { ...p, is_active: currentStatus } : p));
            showAlert("Connection Error", "Unable to reach server. Status reset.", "error", true);
        }
    };



    const getProductColumns = () => [
        { key: "sku", label: "SKU" },
        { key: "name", label: "Product Name" },
        { key: "category", label: "Category" },
        {
            key: "is_active",
            label: "Status",
            render: (value, row) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label className="switch">
                        <input
                            type="checkbox"
                            checked={value === 1}
                            onChange={() => toggleProductActive(row.id, value)}
                        />
                        <span className="slider"></span>
                    </label>
                    <span className={`status-text ${value === 1 ? "active" : "inactive"}`}>
                        {value === 1 ? "Active" : "Paused"}
                    </span>
                </div>
            ),
        },
        {
            key: "action",
            label: "Action",
            render: (_, row) => (
                <button
                    className="btn-danger"
                    onClick={() => handleRemoveProduct(row)}
                    disabled={actionLoadingId === row.id}
                    style={{ 
                        opacity: actionLoadingId === row.id ? 0.6 : 1,
                        padding: '0.4rem 0.8rem',
                        fontSize: '0.85rem'
                    }}
                >
                    {actionLoadingId === row.id ? "Removing..." : "Remove"}
                </button>
            )
        }
    ];

    const getUserColumns = () => [
        { key: "name", label: "Name" },
        { key: "email", label: "Email" },
        {
            key: "role",
            label: "Role",
            render: (value) => (
                <span className={`role-badge role-${value}`}>
                    {value}
                </span>
            ),
        },
        {
            key: "action",
            label: "Action",
            render: (_, row) => (
                <button
                    className="btn-danger"
                    onClick={() => handleRemoveUser(row)}
                    disabled={actionLoadingId === row.id}
                    style={{ 
                        opacity: actionLoadingId === row.id ? 0.6 : 1,
                        padding: '0.4rem 0.8rem',
                        fontSize: '0.85rem'
                    }}
                >
                    {actionLoadingId === row.id ? "Removing..." : "Remove"}
                </button>
            )
        }
    ];



    // 2. Fetch Assigned Data (Products/Users)
    const fetchAssignedData = async () => {
        if (!selectedWarehouseId) return;

        try {
            // Set loading immediately to show the loader without delay
            setIsDataLoading(true);

            let result;
            if (activeTab === "products") {
                result = await accessServices.getAssignedProducts(selectedWarehouseId, currentPage, 10, searchTerm);
            } else {
                result = await accessServices.getAssignedUsers(selectedWarehouseId, currentPage, 10, searchTerm);
            }

            const { response, data } = result;
            if (response.ok && data.status) {
                if (activeTab === "products") {
                    setProducts(data.data || []);
                } else {
                    setUsers(data.data || []);
                }
                setTotalPages(data.pagination?.totalPages || 1);
            }
        } catch (err) {
            console.error("Failed to fetch assigned data", err);
        } finally {
            setIsDataLoading(false);
        }
    };

    // Trigger fetch on tab/warehouse/search change (Debounced search)
    useEffect(() => {
        // Set loading to true immediately so the loader shows up instantly
        if (selectedWarehouseId) {
            setIsDataLoading(true);

            const timer = setTimeout(() => {
                fetchAssignedData();
            }, 500); // 500ms delay to stop multiple api calls
            return () => clearTimeout(timer);
        }
    }, [selectedWarehouseId, activeTab, searchTerm, currentPage]);

    // 3. Fetch Unassigned Data for Modal
    const [unassignedItems, setUnassignedItems] = useState([]);
    const fetchUnassignedData = async (search = "") => {
        if (!selectedWarehouseId) return;
        try {
            setIsModalLoading(true);
            let result;
            if (activeTab === "products") {
                result = await accessServices.getUnassignedProducts(selectedWarehouseId, search);
            } else {
                result = await accessServices.getUnassignedUsers(selectedWarehouseId, search);
            }
            const { response, data } = result;
            if (response.ok && data.status) {
                // Map the data to the format expected by MultiSelectModal: { id, title, subtitle, badge }
                const mappedItems = activeTab === "products"
                    ? (data.data || []).map(p => ({
                        id: p.id,
                        title: p.name,
                        subtitle: `SKU: ${p.sku} | Category: ${p.category}`
                    }))
                    : (data.data || []).map(u => ({
                        id: u.id,
                        title: u.name,
                        subtitle: u.email,
                        badge: u.role
                    }));
                setUnassignedItems(mappedItems);
            }
        } catch (err) {
            console.error("Failed to fetch unassigned data", err);
        } finally {
            setIsModalLoading(false);
        }
    };

    const handleRemoveProduct = async (item) => {
        try {
            setActionLoadingId(item.id);
            const { response, data } = await accessServices.removeAssignedProduct(selectedWarehouseId, item.id);
            if (response.ok && data.status) {
                fetchAssignedData();
                showAlert(data.alertTitle, data.message, "success", true);
            } else {
                showAlert(data.alertTitle, data.message, "error", true);
            }
        } catch (err) {
            showAlert("Error", "Could not remove product. Please try again.", "error", true);
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleRemoveUser = async (item) => {
        try {
            setActionLoadingId(item.id);
            const { response, data } = await accessServices.removeAssignedUser(selectedWarehouseId, item.id);
            if (response.ok && data.status) {
                fetchAssignedData();
                showAlert(data.alertTitle, data.message, "success", true);
            } else {
                showAlert(data.alertTitle, data.message, "error", true);
            }
        } catch (err) {
            showAlert("Error", "Could not remove user. Please try again.", "error", true);
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleConfirmAssign = async (selectedIds) => {
        if (!selectedWarehouseId || selectedIds.length === 0) return;

        try {
            setIsAssignLoading(true);
            let result;
            if (activeTab === "products") {
                result = await accessServices.assignProducts(selectedWarehouseId, selectedIds);
            } else {
                result = await accessServices.assignUsers(selectedWarehouseId, selectedIds);
            }

            const { response, data } = result;
            if (response.ok && data.status) {
                handleCloseModal();
                fetchAssignedData();
                showAlert(data.alertTitle, data.message, "success", true);
            } else {
                showAlert(data.alertTitle, data.message, "error", true);
            }
        } catch (err) {
            showAlert("Error", "Failed to assign items. Please try again.", "error", true);
        } finally {
            setIsAssignLoading(false);
        }
    };

    const handleCloseModal = () => {
        setShowAssignModal(false);
        setUnassignedItems([]);
    };



    // Determine warehouse dropdown options for Mobile
    const warehouseOptions = warehouses.map(wh => ({
        label: `${wh.name} (${wh.city})`,
        value: wh.id
    }));

    return (
        <div className="access-wrapper">
            <div className="access-header">
                <h1 className="access-title">Access Management</h1>
            </div>

            <div className="access-content">

                {/* Mobile Warehouse Selection Dropdown */}
                <div className="mobile-wh-select">
                    <Select
                        label="Select Warehouse"
                        name="warehouse_select"
                        options={warehouseOptions}
                        value={selectedWarehouseId || ""}
                        onChange={(e) => {
                            setSelectedWarehouseId(Number(e.target.value));
                            setCurrentPage(1);
                        }}
                    />
                </div>

                <div className="access-layout">

                    {/* Desktop Sidebar */}
                    <div className="access-sidebar-container">
                        <div className="access-sidebar">
                            <h3 className="access-sidebar-title">Warehouses</h3>
                            <div className="wh-nav-list">
                                {isSidebarLoading ? (
                                    <div style={{ padding: '1rem', color: '#6b7280', fontSize: '0.9rem' }}>Loading...</div>
                                ) : (
                                    warehouses.map(wh => (
                                        <button
                                            key={wh.id}
                                            className={`wh-nav-item ${selectedWarehouseId === wh.id ? 'active' : ''}`}
                                            onClick={() => {
                                                setSelectedWarehouseId(wh.id);
                                                setCurrentPage(1);
                                            }}
                                        >
                                            <span className="wh-nav-item-name">{wh.name}</span>
                                            <span className="wh-nav-item-loc">{wh.city}, {wh.state}</span>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="access-main">
                        <div className="access-tabs">
                            <button
                                className={`access-tab ${activeTab === "products" ? "active" : ""}`}
                                onClick={() => {
                                    setActiveTab("products");
                                    setCurrentPage(1);
                                    setSearchTerm("");
                                }}
                            >
                                Product Access
                            </button>
                            <button
                                className={`access-tab ${activeTab === "users" ? "active" : ""}`}
                                onClick={() => {
                                    setActiveTab("users");
                                    setCurrentPage(1);
                                    setSearchTerm("");
                                }}
                            >
                                User Access
                            </button>
                        </div>

                        <div className="access-toolbar">
                            <input
                                className="search-input"
                                placeholder={`Search ${activeTab === "products" ? "products" : "users"}...`}
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                            />
                            <button
                                className="btn-primary"
                                onClick={() => {
                                    setIsModalLoading(true);
                                    setShowAssignModal(true);
                                }}
                                disabled={!selectedWarehouseId}
                            >
                                + {activeTab === "products" ? "Assign Product" : "Assign User"}
                            </button>
                        </div>

                        <Table
                            data={activeTab === "products" ? products : users}
                            columns={activeTab === "products" ? getProductColumns() : getUserColumns()}
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPrevPage={() => setCurrentPage(p => Math.max(1, p - 1))}
                            onNextPage={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            isLoading={isDataLoading}
                        />
                    </div>
                </div>
            </div>

            {showAssignModal && (
                <MultiSelectModal
                    title={`Assign ${activeTab === "products" ? "Products" : "Users"} to ${selectedWarehouse?.name}`}
                    items={unassignedItems}
                    searchPlaceholder={activeTab === "products" ? "Search by product name or category..." : "Search by name or email..."}
                    onConfirm={handleConfirmAssign}
                    onCancel={handleCloseModal}
                    confirmText="Assign Selected"
                    isLoading={isModalLoading || isAssignLoading}
                    onSearch={fetchUnassignedData}
                    onSearchStart={() => setIsModalLoading(true)}
                />
            )}
        </div>
    );
}