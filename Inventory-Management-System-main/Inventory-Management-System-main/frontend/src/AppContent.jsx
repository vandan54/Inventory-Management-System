import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";

import { useAlert } from "./context/AlertContext";
import { useProgressBar } from "./context/ProgressBarContext";

import Alert from "./components/alerts/Alert";
import ProtectedRoute from "./components/routes/protectedRoute";
import ProfileRoute from "./components/routes/ProfileRoute";
import SetupRoute from "./components/routes/SetupRoute";

// Auth Pages
import AuthLayout from "./pages/auth/authLayout";
import LoginPage from "./pages/auth/loginPage";
import RegisterPage from "./pages/auth/registerPage";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import SetupPassword from "./pages/auth/SetupPassword";
import UpdatePassword from "./pages/auth/UpdatePassword"; // ✅ ADDED

// Owner Pages
import OwnerLayout from "./pages/owner/OwnerLayout";
import OwnerDashboard from "./pages/owner/dashboard/Dashboard";
import OwnerTeam from "./pages/owner/employees/ManageEmployees";
import OwnerInventory from "./pages/owner/inventory/Inventory";
import OwnerWarehouse from "./pages/owner/warehouses/WarehouseLayout";
import OnwerProducts from "./pages/owner/products/ProductsLayout";
import OwnerAccessManagement from "./pages/owner/access-management/AccessManagement";
import OwnerReports from "./pages/owner/reports/Reports";
import OwnerAuditLogs from "./pages/owner/audit-logs/AuditLogs";
import OwnerProfileSetup from "./pages/owner/OwnerProfileSetup";

// Manager Pages
import ManagerLayout from "./pages/manager/ManagerLayout";
import ManagerDashboard from "./pages/manager/dashboard/Dashboard";
import ManagerStaff from "./pages/manager/staff/StaffManagement";
import ManagerInventory from "./pages/manager/inventory/Inventory";
import ManagerReports from "./pages/manager/reports/Reports";

// Staff Pages
import StaffLayout from "./pages/staff/StaffLayout";
import StaffStockMovement from "./pages/staff/stock-movement/StockMovement";
import StaffCurrentStock from "./pages/staff/inventory/CurrentStock";
import StaffRecentLogs from "./pages/staff/history/RecentLogs";

import Profile from "./pages/common/Profile";
import NotFound from "./pages/common/NotFound";

export default function AppContent() {
    const { alert, closeAlert } = useAlert();
    const { start } = useProgressBar();
    const location = useLocation();

    useEffect(() => {
        start();
    }, [location, start]);

    return (
        <>
            {alert && (
                <Alert
                    title={alert.title}
                    message={alert.message}
                    type={alert.type}
                    autoClose={alert.autoClose}
                    onClose={closeAlert}
                />
            )}

            <Routes>
                <Route path="/" element={<Navigate to="/login" />} />

                {/* ================= AUTH ================= */}
                <Route element={<AuthLayout />}>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPasswordPage />} />
                    <Route
                        path="/setup-password"
                        element={
                            <SetupRoute>
                                <SetupPassword />
                            </SetupRoute>
                        }
                    />
                </Route>

                {/* ================= OWNER ================= */}
                <Route
                    element={
                        <ProtectedRoute requiredRole="owner">
                            <OwnerLayout />
                        </ProtectedRoute>
                    }
                >
                    <Route path="/owner" element={<Navigate to="/owner/dashboard" />} />
                    <Route path="/owner/dashboard" element={<OwnerDashboard />} />
                    <Route path="/owner/employees" element={<OwnerTeam />} />
                    <Route path="/owner/inventory" element={<OwnerInventory />} />
                    <Route path="/owner/products" element={<OnwerProducts />} />
                    <Route path="/owner/warehouses" element={<OwnerWarehouse />} />
                    <Route path="/owner/access-management" element={<OwnerAccessManagement />} />
                    <Route path="/owner/reports" element={<OwnerReports />} />
                    <Route path="/owner/audit-logs" element={<OwnerAuditLogs />} />
                    <Route path="/owner/profile" element={<Profile />} />

                    {/* ✅ UPDATE PASSWORD */}
                    <Route path="/owner/update-password" element={<UpdatePassword />} />
                </Route>

                {/* OWNER PROFILE SETUP */}
                <Route
                    element={
                        <ProfileRoute>
                            <OwnerProfileSetup />
                        </ProfileRoute>
                    }
                >
                    <Route path="/owner/profile-complete" element={<OwnerProfileSetup />} />
                </Route>

                {/* ================= MANAGER ================= */}
                <Route
                    element={
                        <ProtectedRoute requiredRole="manager">
                            <ManagerLayout />
                        </ProtectedRoute>
                    }
                >
                    <Route path="/manager" element={<Navigate to="/manager/dashboard" />} />
                    <Route path="/manager/dashboard" element={<ManagerDashboard />} />
                    <Route path="/manager/staff" element={<ManagerStaff />} />
                    <Route path="/manager/inventory" element={<ManagerInventory />} />
                    <Route path="/manager/reports" element={<ManagerReports />} />
                    <Route path="/manager/profile" element={<Profile />} />

                    {/* ✅ UPDATE PASSWORD */}
                    <Route path="/manager/update-password" element={<UpdatePassword />} />
                </Route>

                {/* ================= STAFF ================= */}
                <Route
                    element={
                        <ProtectedRoute requiredRole="staff">
                            <StaffLayout />
                        </ProtectedRoute>
                    }
                >
                    <Route path="/staff" element={<Navigate to="/staff/stock-movement" />} />
                    <Route path="/staff/stock-movement" element={<StaffStockMovement />} />
                    <Route path="/staff/inventory" element={<StaffCurrentStock />} />
                    <Route path="/staff/history" element={<StaffRecentLogs />} />
                    <Route path="/staff/profile" element={<Profile />} />

                    {/* ✅ UPDATE PASSWORD */}
                    <Route path="/staff/update-password" element={<UpdatePassword />} />
                </Route>

                {/* ================= FALLBACK ================= */}
                <Route path="*" element={<NotFound />} />
            </Routes>
        </>
    );
}