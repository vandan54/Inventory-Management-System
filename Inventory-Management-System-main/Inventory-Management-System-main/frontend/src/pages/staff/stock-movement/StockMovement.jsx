import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowDownCircle,
    ArrowUpCircle,
    Hash,
    Calendar,
    Fingerprint,
    AlertCircle,
    CheckCircle2,
    Package as PackageIcon,
    Warehouse as WarehouseIcon,
    MapPin
} from 'lucide-react';
import { authServices } from '../../../services/api/authServices';
import { inventoryServices } from '../../../services/api/inventoryServices';
import { useAlert } from '../../../context/AlertContext';
import { useUser } from '../../../context/UserContext';
import './StockMovement.css';

const StockMovement = () => {
    const { showAlert } = useAlert();
    const { logout } = useUser();
    const navigate = useNavigate();

    // --- Access & Loading ---
    const [hasAccess, setHasAccess] = useState(null); // null = checking, true/false = resolved
    const [warehouse, setWarehouse] = useState(null);
    const [isPageLoading, setIsPageLoading] = useState(true);

    // --- Data from API ---
    const [products, setProducts] = useState([]);
    const [reasonsIN, setReasonsIN] = useState([]);
    const [reasonsOUT, setReasonsOUT] = useState([]);
    const [existingBatches, setExistingBatches] = useState([]);
    const [existingSerials, setExistingSerials] = useState([]);

    // --- Core State ---
    const [movementType, setMovementType] = useState('IN');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- Form State ---
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [reasonId, setReasonId] = useState('');
    const [quantity, setQuantity] = useState('');
    const [batchNumber, setBatchNumber] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [serialNumber, setSerialNumber] = useState('');

    // --- OUT mode: selections ---
    const [selectedBatches, setSelectedBatches] = useState({});
    const [selectedSerials, setSelectedSerials] = useState([]);

    // ===== TOKEN EXPIRY HANDLER =====
    const handleTokenExpiry = (data) => {
        if (data.code === 'TOKEN_EXPIRED') {
            showAlert(data.alertTitle, data.message, data.alertType, data.autoClose);
            setTimeout(() => {
                localStorage.removeItem('token');
                logout();
                navigate('/login');
            }, 1500);
            return true;
        }
        return false;
    };

    // ===== 1. CHECK ACCESS & LOAD INITIAL DATA =====
    useEffect(() => {
        const initializePage = async () => {
            setIsPageLoading(true);
            try {
                // Check access
                const { data: accessData } = await authServices.checkAccess();
                if (!accessData.hasAccess) {
                    setHasAccess(false);
                    setIsPageLoading(false);
                    return;
                }
                setHasAccess(true);

                // Get staff warehouse
                const { data: whData } = await inventoryServices.getStaffWarehouse();
                if (handleTokenExpiry(whData)) return;

                if (!whData.hasAccess || !whData.data) {
                    setHasAccess(false);
                    setIsPageLoading(false);
                    return;
                }

                setWarehouse(whData.data);

                // Load products + reasons in parallel
                const [productsRes, reasonsInRes, reasonsOutRes] = await Promise.all([
                    inventoryServices.getWarehouseProducts(whData.data.id),
                    inventoryServices.getReasons('IN'),
                    inventoryServices.getReasons('OUT')
                ]);

                if (handleTokenExpiry(productsRes.data)) return;

                setProducts(productsRes.data.data || []);
                setReasonsIN(reasonsInRes.data.data || []);
                setReasonsOUT(reasonsOutRes.data.data || []);
            } catch (err) {
                console.error('Init error:', err);
                showAlert('Connection Failed', 'Unable to connect to the server. Please try again.', 'error', true);
            } finally {
                setIsPageLoading(false);
            }
        };

        initializePage();
    }, []);

    // ===== 2. LOAD TRACKED STOCK WHEN PRODUCT CHANGES (OUT mode) =====
    useEffect(() => {
        if (!selectedProduct || !warehouse || movementType !== 'OUT') return;

        const loadTrackedStock = async () => {
            try {
                const trackingMode = getTrackingMode(selectedProduct);

                if (trackingMode === 'batch' || trackingMode === 'batch+expiry') {
                    const { data } = await inventoryServices.getProductBatches(warehouse.id, selectedProduct.id);
                    if (handleTokenExpiry(data)) return;
                    setExistingBatches(data.data || []);
                } else if (trackingMode === 'serial') {
                    const { data } = await inventoryServices.getProductSerials(warehouse.id, selectedProduct.id);
                    if (handleTokenExpiry(data)) return;
                    setExistingSerials(data.data || []);
                }
            } catch (err) {
                console.error('Load tracked stock error:', err);
            }
        };

        loadTrackedStock();
    }, [selectedProduct, movementType]);

    // ===== HELPERS =====
    const getTrackingMode = (product) => {
        if (!product) return 'none';
        const { track_batch, track_serial, track_expiry } = product;
        if (track_batch && track_expiry) return 'batch+expiry';
        if (track_batch) return 'batch';
        if (track_serial) return 'serial';
        return 'quantity';
    };

    const trackingMode = getTrackingMode(selectedProduct);
    const reasons = movementType === 'IN' ? reasonsIN : reasonsOUT;

    const isExpired = (dateStr) => {
        if (!dateStr) return false;
        return new Date(dateStr) < new Date();
    };

    const resetForm = () => {
        setReasonId('');
        setQuantity('');
        setBatchNumber('');
        setExpiryDate('');
        setSerialNumber('');
        setSelectedBatches({});
        setSelectedSerials([]);
        setExistingBatches([]);
        setExistingSerials([]);
    };

    const handleTypeChange = (type) => {
        setMovementType(type);
        setSelectedProduct(null);
        resetForm();
    };

    const handleProductSelect = (e) => {
        const product = products.find(p => p.id === parseInt(e.target.value));
        setSelectedProduct(product || null);
        resetForm();
    };

    const handleBatchQtyChange = (batchId, value) => {
        setSelectedBatches(prev => ({
            ...prev,
            [batchId]: value === '' ? '' : Math.max(0, parseInt(value) || 0)
        }));
    };

    const handleSerialToggle = (serialId) => {
        setSelectedSerials(prev =>
            prev.includes(serialId)
                ? prev.filter(id => id !== serialId)
                : [...prev, serialId]
        );
    };

    // ===== SUBMIT =====
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedProduct || !warehouse) return;

        setIsSubmitting(true);
        try {
            let result;

            if (movementType === 'IN') {
                const payload = {
                    productId: selectedProduct.id,
                    reasonId: parseInt(reasonId),
                    trackingMode,
                    quantity: trackingMode !== 'serial' ? parseInt(quantity) : 1,
                    batchNumber: batchNumber || null,
                    expiryDate: expiryDate || null,
                    serialNumber: serialNumber || null
                };
                result = await inventoryServices.stockIn(warehouse.id, payload);
            } else {
                const payload = {
                    productId: selectedProduct.id,
                    reasonId: parseInt(reasonId),
                    trackingMode,
                    quantity: trackingMode === 'quantity' ? parseInt(quantity) : undefined,
                    batchSelections: (trackingMode === 'batch' || trackingMode === 'batch+expiry')
                        ? Object.entries(selectedBatches)
                            .filter(([_, qty]) => qty > 0)
                            .map(([id, qty]) => ({ trackedId: parseInt(id), quantity: qty }))
                        : undefined,
                    serialIds: trackingMode === 'serial' ? selectedSerials : undefined
                };
                result = await inventoryServices.stockOut(warehouse.id, payload);
            }

            const { data } = result;
            if (handleTokenExpiry(data)) return;

            showAlert(data.alertTitle, data.message, data.alertType, data.autoClose);

            if (data.status) {
                setSelectedProduct(null);
                resetForm();
            }
        } catch (err) {
            console.error('Submit error:', err);
            showAlert('Connection Failed', 'Unable to connect to the server. Please try again.', 'error', true);
        } finally {
            setIsSubmitting(false);
        }
    };

    // ===== LOADING STATE =====
    if (isPageLoading) {
        return (
            <div className="stock-wrapper">
                <div className="stock-header">
                    <h1 className="stock-title">Stock Movement</h1>
                </div>
                <div className="stock-content">
                    <div className="stock-loading">Loading logs...</div>
                </div>
            </div>
        );
    }

    // ===== NO ACCESS STATE =====
    if (!hasAccess) {
        return (
            <div className="stock-wrapper">
                <div className="stock-header">
                    <h1 className="stock-title">Stock Movement</h1>
                </div>
                <div className="stock-content">
                    <div className="no-access-box">
                        <div className="no-access-icon">
                            <AlertCircle size={36} />
                        </div>
                        <h2>Warehouse Assignment Required</h2>
                        <p>You currently don't have access to any warehouse records. Please contact your manager to view your movement history.</p>
                    </div>
                </div>
            </div>
        );
    }

    // ===== STOCK IN: Render tracking fields =====
    const renderStockInFields = () => {
        if (!selectedProduct) return null;

        if (trackingMode === 'quantity') {
            return (
                <div className="stock-form-row">
                    <div className="stock-form-group">
                        <label>Quantity</label>
                        <input type="number" className="stock-input" placeholder="Enter quantity" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                    </div>
                    <div className="stock-form-group">
                        <label>Reason</label>
                        <select className="stock-select" value={reasonId} onChange={(e) => setReasonId(e.target.value)}>
                            <option value="">Select reason...</option>
                            {reasons.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                    </div>
                </div>
            );
        }

        if (trackingMode === 'batch') {
            return (
                <>
                    <div className="stock-form-row">
                        <div className="stock-form-group">
                            <label>Quantity</label>
                            <input type="number" className="stock-input" placeholder="Enter quantity" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                        </div>
                        <div className="stock-form-group">
                            <label>Reason</label>
                            <select className="stock-select" value={reasonId} onChange={(e) => setReasonId(e.target.value)}>
                                <option value="">Select reason...</option>
                                {reasons.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="tracking-section">
                        <div className="tracking-label"><Hash size={14} /> Batch Tracking</div>
                        <div className="stock-form-group">
                            <label>Batch Number</label>
                            <input type="text" className="stock-input" placeholder="e.g. B-2025-001" value={batchNumber} onChange={(e) => setBatchNumber(e.target.value)} />
                        </div>
                    </div>
                </>
            );
        }

        if (trackingMode === 'batch+expiry') {
            return (
                <>
                    <div className="stock-form-row">
                        <div className="stock-form-group">
                            <label>Quantity</label>
                            <input type="number" className="stock-input" placeholder="Enter quantity" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                        </div>
                        <div className="stock-form-group">
                            <label>Reason</label>
                            <select className="stock-select" value={reasonId} onChange={(e) => setReasonId(e.target.value)}>
                                <option value="">Select reason...</option>
                                {reasons.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="tracking-section">
                        <div className="tracking-label"><Hash size={14} /> Batch + Expiry Tracking</div>
                        <div className="stock-form-row">
                            <div className="stock-form-group">
                                <label>Batch Number</label>
                                <input type="text" className="stock-input" placeholder="e.g. B-2025-001" value={batchNumber} onChange={(e) => setBatchNumber(e.target.value)} />
                            </div>
                            <div className="stock-form-group">
                                <label><Calendar size={14} /> Expiry Date</label>
                                <input type="date" className="stock-input" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
                            </div>
                        </div>
                    </div>
                </>
            );
        }

        if (trackingMode === 'serial') {
            return (
                <>
                    <div className="stock-form-row">
                        <div className="stock-form-group">
                            <label>Reason</label>
                            <select className="stock-select" value={reasonId} onChange={(e) => setReasonId(e.target.value)}>
                                <option value="">Select reason...</option>
                                {reasons.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="tracking-section">
                        <div className="tracking-label"><Fingerprint size={14} /> Serial Tracking</div>
                        <div className="stock-form-group">
                            <label>Serial Number</label>
                            <input type="text" className="stock-input" placeholder="Enter unique serial number" value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} />
                        </div>
                        <span className="tracking-hint">Quantity is automatically set to 1 for serial-tracked items.</span>
                    </div>
                </>
            );
        }
    };

    // ===== STOCK OUT: Render selection from existing stock =====
    const renderStockOutFields = () => {
        if (!selectedProduct) return null;

        if (trackingMode === 'quantity') {
            return (
                <div className="stock-form-row">
                    <div className="stock-form-group">
                        <label>Quantity to Remove</label>
                        <input type="number" className="stock-input" placeholder="Enter quantity" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                    </div>
                    <div className="stock-form-group">
                        <label>Reason</label>
                        <select className="stock-select" value={reasonId} onChange={(e) => setReasonId(e.target.value)}>
                            <option value="">Select reason...</option>
                            {reasons.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                    </div>
                </div>
            );
        }

        if (trackingMode === 'batch' || trackingMode === 'batch+expiry') {
            return (
                <>
                    <div className="stock-form-row">
                        <div className="stock-form-group">
                            <label>Reason</label>
                            <select className="stock-select" value={reasonId} onChange={(e) => setReasonId(e.target.value)}>
                                <option value="">Select reason...</option>
                                {reasons.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="tracking-section">
                        <div className="tracking-label"><Hash size={14} /> Select Batches to Remove From</div>
                        <span className="tracking-hint" style={{ marginBottom: '0.75rem', display: 'block' }}>
                            Enter the quantity to remove from each batch. You can remove from multiple batches at once.
                        </span>
                        <div className="batch-selection-list">
                            {existingBatches.length === 0 && (
                                <div className="stock-loading">No batches found in stock.</div>
                            )}
                            {existingBatches.map(batch => (
                                <div key={batch.id} className="batch-item">
                                    <div className="batch-item-info">
                                        <span className="batch-item-primary">{batch.batch_number}</span>
                                        <div className="batch-item-meta">
                                            <span className="batch-meta-tag qty">
                                                <PackageIcon size={12} /> {batch.quantity} available
                                            </span>
                                            {batch.expiry_date && (
                                                <span className={`batch-meta-tag expiry ${isExpired(batch.expiry_date) ? 'expired' : ''}`}>
                                                    <Calendar size={12} /> {isExpired(batch.expiry_date) ? 'Expired: ' : 'Exp: '}{batch.expiry_date}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <input
                                        type="number"
                                        className="batch-item-qty-input"
                                        placeholder="0"
                                        min="0"
                                        max={batch.quantity}
                                        value={selectedBatches[batch.id] ?? ''}
                                        onChange={(e) => handleBatchQtyChange(batch.id, e.target.value)}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            );
        }

        if (trackingMode === 'serial') {
            return (
                <>
                    <div className="stock-form-row">
                        <div className="stock-form-group">
                            <label>Reason</label>
                            <select className="stock-select" value={reasonId} onChange={(e) => setReasonId(e.target.value)}>
                                <option value="">Select reason...</option>
                                {reasons.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="tracking-section">
                        <div className="tracking-label"><Fingerprint size={14} /> Select Serial Numbers to Remove</div>
                        <span className="tracking-hint" style={{ marginBottom: '0.75rem', display: 'block' }}>
                            Click on items to select them for dispatch or removal.
                        </span>
                        {selectedSerials.length > 0 && (
                            <span className="serial-count-badge" style={{ marginBottom: '0.75rem', display: 'inline-block' }}>
                                {selectedSerials.length} selected
                            </span>
                        )}
                        <div className="batch-selection-list">
                            {existingSerials.length === 0 && (
                                <div className="stock-loading">No serial items found in stock.</div>
                            )}
                            {existingSerials.map(item => (
                                <div
                                    key={item.id}
                                    className={`serial-item ${selectedSerials.includes(item.id) ? 'selected' : ''}`}
                                    onClick={() => handleSerialToggle(item.id)}
                                >
                                    <input
                                        type="checkbox"
                                        className="serial-checkbox"
                                        checked={selectedSerials.includes(item.id)}
                                        onChange={() => { }}
                                    />
                                    <span className="serial-item-label">{item.serial_number}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            );
        }
    };

    // ===== MAIN RENDER =====
    return (
        <div className="stock-wrapper">
            <div className="stock-header">
                <h1 className="stock-title">Stock Movement</h1>
                {warehouse && (
                    <div className="warehouse-info-badge">
                        <WarehouseIcon size={16} />
                        <span className="warehouse-info-name">{warehouse.name}</span>
                        {(warehouse.city || warehouse.state) && (
                            <span className="warehouse-info-location">
                                <MapPin size={12} />
                                {[warehouse.city, warehouse.state].filter(Boolean).join(', ')}
                            </span>
                        )}
                    </div>
                )}
            </div>

            <div className="stock-content">
                {/* IN / OUT Selector */}
                <div className="type-selector">
                    <button
                        className={`type-btn ${movementType === 'IN' ? 'active-in' : ''}`}
                        onClick={() => handleTypeChange('IN')}
                    >
                        <ArrowDownCircle size={18} />
                        Stock IN
                    </button>
                    <button
                        className={`type-btn ${movementType === 'OUT' ? 'active-out' : ''}`}
                        onClick={() => handleTypeChange('OUT')}
                    >
                        <ArrowUpCircle size={18} />
                        Stock OUT
                    </button>
                </div>

                <form className="stock-form" onSubmit={handleSubmit}>
                    {/* Product Selection */}
                    <div className="stock-form-group" style={{ maxWidth: '400px' }}>
                        <label>Product</label>
                        <select
                            className="stock-select"
                            value={selectedProduct?.id || ''}
                            onChange={handleProductSelect}
                        >
                            <option value="">Select a product...</option>
                            {products.map(p => (
                                <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                            ))}
                        </select>
                    </div>

                    <hr className="stock-divider" />

                    {/* Dynamic fields */}
                    {movementType === 'IN' ? renderStockInFields() : renderStockOutFields()}

                    {/* Submit */}
                    {selectedProduct && (
                        <button
                            type="submit"
                            className={`btn-stock-submit ${movementType === 'IN' ? 'btn-in' : 'btn-out'}`}
                            disabled={isSubmitting}
                        >
                            <CheckCircle2 size={18} />
                            {isSubmitting
                                ? 'Processing...'
                                : movementType === 'IN' ? 'Confirm Stock IN' : 'Confirm Stock OUT'
                            }
                        </button>
                    )}
                </form>
            </div>
        </div>
    );
};

export default StockMovement;
