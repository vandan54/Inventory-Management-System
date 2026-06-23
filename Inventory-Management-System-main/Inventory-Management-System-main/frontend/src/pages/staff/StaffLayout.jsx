import { Outlet, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

import TopBar from "../../components/layout/TopBar";
import Sidebar from "../../components/layout/SideBar";

import { useProgressBar } from "../../context/ProgressBarContext";

import "../../components/layout/Layout.css";

function StaffLayout() {
    const { complete } = useProgressBar();
    const location = useLocation();

    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);

    useEffect(() => {
        const timer = setTimeout(() => {
            complete();
        }, 100);
        return () => clearTimeout(timer);
    }, [location.pathname]);

    return <>
        <div className="layout-wrapper">
            <TopBar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <div className="layout-container">
                <Sidebar isOpen={sidebarOpen} closeSidebar={() => setSidebarOpen(false)} />
                <div className="layout-content">
                    <Outlet />
                </div>
            </div>
        </div>
    </>
}

export default StaffLayout;