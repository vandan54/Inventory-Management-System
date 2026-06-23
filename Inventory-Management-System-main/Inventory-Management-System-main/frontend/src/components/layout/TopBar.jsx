import { useUser } from "../../context/UserContext";
import { LogOut, User } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./topbar.css";

export default function TopBar({ toggleSidebar }) {
    const { user } = useUser();
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    // Click outside handler
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };

        if (showDropdown) {
            document.addEventListener("mousedown", handleClickOutside);
        } else {
            document.removeEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showDropdown]);

    const getInitial = () => {
        if (user?.userName) {
            return user.userName.charAt(0).toUpperCase();
        }
        return "U";
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        window.location.href = "/login";
    };

    return (
        <nav className="topbar">
            <div className="topbar-left">
                <button className="hamburger" onClick={toggleSidebar}>
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
            </div>

            <div className="topbar-center">
                <h2 className="business-name">{user?.businessName}</h2>
            </div>

            <div className="topbar-right">
                <div className="profile-wrapper" ref={dropdownRef}>
                    <span className="username">{user?.userName}</span>

                    <button
                        className="profile-circle"
                        onClick={() => setShowDropdown(!showDropdown)}
                    >
                        {getInitial()}
                    </button>

                    {showDropdown && (
                        <div className="profile-dropdown">
                            <button
                                className="dropdown-item profile-btn"
                                onClick={() => {
                                    setShowDropdown(false);
                                    navigate(`/${user.role}/profile`);
                                }}
                            >
                                <User size={16} />
                                Profile
                            </button>

                            <div className="dropdown-divider"></div>

                            <button className="dropdown-item logout-btn" onClick={handleLogout}>
                                <LogOut size={16} />
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </nav >
    );
}