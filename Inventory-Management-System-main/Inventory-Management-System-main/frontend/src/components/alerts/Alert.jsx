import "./alert.css";
import { useEffect, useState } from "react";

export default function Alert({ title, message, type, onClose, autoClose = true }) {
    const [isClosing, setIsClosing] = useState(false);
    
    useEffect(() => {
        if(autoClose) {
            const timer = setTimeout(() => {
                setIsClosing(true);
                setTimeout(onClose, 300);
            }, 5000);
            return () => clearTimeout(timer);
        } 
    }, [autoClose, onClose, title, message, type]);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(onClose, 300);
    };

    const getIcon = () => {
        switch(type) {
            case 'success':
                return (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                );
            case 'error':
                return (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="15" y1="9" x2="9" y2="15"></line>
                        <line x1="9" y1="9" x2="15" y2="15"></line>
                    </svg>
                );
            case 'warning':
                return (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3.05h16.94a2 2 0 0 0 1.71-3.05L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                        <line x1="12" y1="9" x2="12" y2="13"></line>
                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                );
            case 'info':
            default:
                return (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="16" x2="12" y2="12"></line>
                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                );
        }
    };

    return (
        <div className={`alert alert-${type} ${isClosing ? 'alert-closing' : ''}`}>
            <div className="alert-content">
                <div className="alert-icon">
                    {getIcon()}
                </div>
                <div className="alert-text">
                    {title && <div className="alert-title">{title}</div>}
                    <div className="alert-message">{message}</div>
                </div>
            </div>
            <button 
                className="alert-close" 
                onClick={onClose}
                aria-label="Close alert"
            >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        </div>
    );
}