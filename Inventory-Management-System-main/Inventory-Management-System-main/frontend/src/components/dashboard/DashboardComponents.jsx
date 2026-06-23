import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export const StatCard = ({ label, value, icon: Icon, color, trend, trendValue }) => {
    return (
        <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ backgroundColor: `${color}15`, color: color }}>
                <Icon size={24} />
            </div>
            <div className="stat-info">
                <div className="stat-label">{label}</div>
                <div className="stat-value">{value}</div>
                {trend && (
                    <div className={`stat-trend ${trend}`}>
                        {trend === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        <span>{trendValue}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export const DashboardCard = ({ title, children, viewAllLink, onViewAll }) => {
    return (
        <div className="dashboard-card">
            <div className="card-header">
                <h3 className="card-title">{title}</h3>
                {onViewAll && (
                    <button className="view-all-btn" onClick={onViewAll}>
                        View Details
                    </button>
                )}
            </div>
            <div className="card-content">
                {children}
            </div>
        </div>
    );
};
