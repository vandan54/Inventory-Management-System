import React, { useState } from 'react';
import { X } from 'lucide-react';
import Table from '../../table/Table';
import './StockDetailsModal.css';

export default function StockDetailsModal({ item, onClose, showLocation }) {
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 7; // Slightly fewer items per page so the modal doesn't feel cramped

    // Helper to mock the physical address based on the warehouse name
    const getPhysicalLocation = (whName) => {
        if (whName.includes('Mumbai')) return 'Andheri East, Mumbai, MH';
        if (whName.includes('Pune')) return 'Hinjewadi IT Park, Pune, MH';
        return 'Ring Road, Surat, GJ';
    };

    // Table Columns Config - Strictly using the theme metrics
    const getColumns = () => {
        if (item.tracking_type === 'QTY') {
            return [
                {
                    key: 'location',
                    label: 'Warehouse',
                    render: (val) => (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: '700', color: '#1e293b' }}>{val}</span>
                            <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '1px' }}>{getPhysicalLocation(val)}</span>
                        </div>
                    )
                },
                {
                    key: 'qty',
                    label: 'Qty in Stock',
                    render: (val) => <span className="qty-impact">{val} <span className="qty-unit">{item.unit}</span></span>
                }
            ];
        }

        if (item.tracking_type === 'SERIAL') {
            const cols = [
                {
                    key: 'serial',
                    label: 'Serial Number',
                    render: (val) => <span style={{ fontFamily: 'monospace', color: '#4f63d2', fontWeight: '600' }}>{val}</span>
                }
            ];

            if (showLocation) {
                cols.push({
                    key: 'location',
                    label: 'Warehouse',
                    render: (val) => (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: '700', color: '#1e293b' }}>{val || 'Unknown'}</span>
                            <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '1px' }}>{val ? getPhysicalLocation(val) : ''}</span>
                        </div>
                    )
                });
            }
            return cols;
        }

        const cols = [
            {
                key: 'batch',
                label: 'Batch #',
                render: (val) => <span style={{ fontWeight: '700', color: '#1e293b' }}>{val}</span>
            }
        ];

        if (showLocation) {
            cols.push({
                key: 'location',
                label: 'Warehouse',
                render: (val) => (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: '700', color: '#1e293b' }}>{val || 'Unknown'}</span>
                            <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '1px' }}>{val ? getPhysicalLocation(val) : ''}</span>
                        </div>
                )
            });
        }

        cols.push({
            key: 'qty',
            label: 'Qty in Stock',
            render: (val) => <span className="qty-impact">{val} <span className="qty-unit">{item.unit}</span></span>
        });

        if (item.tracking_type === 'BATCH_EXPIRY') {
            cols.push({
                key: 'expiry',
                label: 'Expiry Date',
                render: (val) => {
                    const isExpiring = val && new Date(val) < new Date(Date.now() + 7 * 86400000);
                    return (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span className={isExpiring ? 'qty-impact' : ''} style={isExpiring ? { color: '#ef4444' } : { color: '#64748b' }}>
                                {val || 'N/A'}
                            </span>
                            {isExpiring && <span style={{ fontSize: '0.65rem', color: '#ef4444', fontWeight: '700' }}>Expiring Soon</span>}
                        </div>
                    );
                }
            });
        }
        return cols;
    };

    // Pagination logic for the nested data
    const dataSource = item.tracking_type === 'QTY' ? (item.breakdown || []) : (item.details || []);
    const totalPages = Math.ceil(dataSource.length / ITEMS_PER_PAGE);
    const displayData = dataSource.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE) || [];

    return (
        <div className="stock-modal-overlay" onClick={onClose}>
            <div className="stock-modal-content" onClick={e => e.stopPropagation()}>

                <div className="stock-modal-header">
                    <div>
                        <h2>{item.name}</h2>
                        <p>{item.sku} • {item.tracking_type.replace('_', ' + ')} Tracking</p>
                    </div>
                    <button className="btn-close-modal" onClick={onClose} title="Close Details">
                        <X size={20} />
                    </button>
                </div>

                <div className="stock-modal-body">
                    {item.tracking_type === 'QTY' && (!displayData || displayData.length === 0) ? (
                        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
                            <p style={{ fontWeight: '500' }}>Standard item (No Batch/Serial tracking required).</p>
                        </div>
                    ) : (
                        <div className="modal-table-container">
                            <Table
                                data={displayData}
                                columns={getColumns()}
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPrevPage={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                onNextPage={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                isLoading={false}
                            />
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
