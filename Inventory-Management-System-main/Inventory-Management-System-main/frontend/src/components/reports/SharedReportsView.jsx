import React, { useState, useEffect } from 'react';
import { 
    FileText, 
    Download, 
    Search, 
    Calendar,
    Filter,
    ArrowUp,
    ArrowDown,
    RefreshCw
} from 'lucide-react';
import Table from '../table/Table';
import MultiSelect from '../form/MultiSelect';
import Select from '../form/Select';
import DateInput from '../form/DateInput';
import { useAlert } from '../../context/AlertContext';
import { reportServices } from '../../services/api/reportServices';
import './SharedReportsView.css';

// --- Shared Report Logic ---
export default function SharedReportsView({ role, warehouses = [], selectedWarehouses = [], onWarehouseChange }) {
    const { showAlert } = useAlert(); // Need alert context for validation messages

    // --- Filter State ---
    const [reportType, setReportType] = useState('STOCK_SUMMARY');
    const [selectedProducts, setSelectedProducts] = useState([]); // Array now
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [sortBy, setSortBy] = useState('product');
    const [sortDir, setSortDir] = useState('asc');

    // --- Result State ---
    const [reportData, setReportData] = useState([]);
    const [activeReportType, setActiveReportType] = useState('STOCK_SUMMARY'); // Which report is currently rendered
    const [overviewStats, setOverviewStats] = useState(null); // Storage for KPI numbers
    const [isGenerating, setIsGenerating] = useState(false);
    const [hasGenerated, setHasGenerated] = useState(false);
    const [productOptions, setProductOptions] = useState([]);
    const [isMetadataLoading, setIsMetadataLoading] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    // --- Pagination State ---
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Helper to render "N/A" for empty values
    const safeRender = (val) => (val === null || val === undefined || val === '') ? <span style={{color: '#94a3b8', fontStyle: 'italic'}}>N/A</span> : val;

    // --- Fetch Metadata (Products) ---
    useEffect(() => {
        const fetchMetadata = async () => {
            // Reset product selection when report type or warehouse set changes
            // to prevent mismatching data (e.g. quantity product in expiry report)
            setSelectedProducts([]); 
            
            setIsMetadataLoading(true);
            try {
                let res;
                const whIds = selectedWarehouses || [];
                if (role === 'owner') {
                    res = await reportServices.getOwnerMetadata(reportType, whIds);
                } else {
                    res = await reportServices.getManagerMetadata(reportType, whIds);
                }

                if (res.response.ok && res.data.status) {
                    setProductOptions(res.data.data.products || []);
                }
            } catch (err) {
                console.error("Failed to fetch report metadata:", err);
            } finally {
                setIsMetadataLoading(false);
            }
        };

        fetchMetadata();
    }, [reportType, selectedWarehouses, role]);

    const handleGenerate = async (targetPage = 1) => {
        // Validation: Ensure warehouses are selected
        if (!selectedWarehouses || selectedWarehouses.length === 0) {
            showAlert('Selection Required', 'Please select at least one warehouse before generating the report.', 'warning', true);
            return;
        }

        setIsGenerating(true);
        setHasGenerated(true);
        
        try {
            const filters = { selectedProducts, startDate, endDate, sortBy, sortDir };
            let res;
            if (role === 'owner') {
                res = await reportServices.getOwnerReport(reportType, selectedWarehouses, filters, targetPage);
            } else {
                res = await reportServices.getManagerReport(reportType, selectedWarehouses, filters, targetPage);
            }

            if (res.response.ok && res.data.status) {
                setReportData(res.data.data.results || []);
                setOverviewStats(res.data.data.overview || null);
                setActiveReportType(reportType); // Lock in the generated type
                
                // Update pagination from response
                if (res.data.pagination) {
                    setTotalPages(res.data.pagination.totalPages || 1);
                    setPage(res.data.pagination.currentPage || 1);
                }
            } else if (res.data.alertTitle) {
                showAlert(res.data.alertTitle, res.data.message, res.data.alertType, res.data.autoClose);
            }
        } catch (err) {
            console.error("Failed to generate report:", err);
            showAlert('Server Error', 'An unexpected error occurred while generating the report.', 'error', true);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownload = async () => {
        setIsDownloading(true);
        try {
            const filters = { selectedProducts, startDate, endDate, sortBy, sortDir };
            let res;
            // limit: -1 instructs the backend to bypass pagination and return ALL data for the export
            if (role === 'owner') {
                res = await reportServices.getOwnerReport(activeReportType, selectedWarehouses, filters, 1, -1);
            } else {
                res = await reportServices.getManagerReport(activeReportType, selectedWarehouses, filters, 1, -1);
            }

            if (res.response.ok && res.data.status) {
                const rawResults = res.data.data.results || [];
                if (rawResults.length === 0) {
                    showAlert('No Data', 'There is no data available to download for this report.', 'info', true);
                    return;
                }

                // Prepare Data (Pivot if WH_COMPARISON)
                let downloadData = rawResults;
                if (activeReportType === 'WH_COMPARISON') {
                    const grouped = {};
                    rawResults.forEach(row => {
                        if (!grouped[row.product]) grouped[row.product] = { product: row.product, total: 0 };
                        grouped[row.product][`wh_${row.warehouse}`] = row.qty;
                        grouped[row.product].total += row.qty;
                    });
                    downloadData = Object.values(grouped);
                }

                // Create formatted HTML Table for Excel (Supports Bold and Borders)
                const columns = getColumns();
                let tableHtml = `
                    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
                    <head>
                        <meta charset="UTF-8">
                        <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Report</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
                        <style>
                            .header { font-weight: bold; background-color: #f1f5f9; text-align: center; border: 1px solid #000; }
                            .cell { border: 1px solid #000; padding: 5px; }
                        </style>
                    </head>
                    <body>
                        <table border="1">
                            <thead>
                                <tr>
                                    ${columns.map(c => `<th class="header">${c.label}</th>`).join('')}
                                </tr>
                            </thead>
                            <tbody>
                                ${downloadData.map(row => `
                                    <tr>
                                        ${columns.map(col => {
                                            let val = row[col.key] ?? 'N/A';
                                            return `<td class="cell">${val}</td>`;
                                        }).join('')}
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </body>
                    </html>
                `;

                const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.setAttribute('href', url);
                link.setAttribute('download', `${activeReportType}_Report_${new Date().toLocaleDateString()}.xls`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        } catch (err) {
            console.error("Download failed:", err);
            showAlert('Download Failed', 'Failed to generate formatted report.', 'error', true);
        } finally {
            setIsDownloading(false);
        }
    };

    const handlePageChange = (newPage) => {
        handleGenerate(newPage);
    };


    // --- Dynamic Data Pre-processor ---
    const processedData = React.useMemo(() => {
        if (!reportData || reportData.length === 0) return [];

        if (activeReportType === 'WH_COMPARISON') {
            // Pivot the data: group by product and make warehouses distinct columns
            const grouped = {};
            reportData.forEach(row => {
                if (!grouped[row.product]) {
                    // Safe init
                    grouped[row.product] = { product: row.product, total: 0 };
                }
                const whKey = `wh_${row.warehouse}`;
                grouped[row.product][whKey] = row.qty;
                grouped[row.product].total += row.qty;
            });
            return Object.values(grouped);
        }
        
        return reportData;
    }, [reportData, activeReportType]);

    const getColumns = () => {
        if (activeReportType === 'STOCK_SUMMARY') {
            return [
                { key: 'product', label: 'Product Name' },
                { key: 'sku', label: 'SKU' },
                { key: 'category', label: 'Category' },
                { key: 'qty', label: 'Current Qty', render: (val) => <strong>{val}</strong> },
                { key: 'warehouse', label: 'Warehouse' }
            ];
        }
        if (activeReportType === 'EXPIRING' || activeReportType === 'EXPIRED') {
            return [
                { key: 'product', label: 'Product' },
                { key: 'sku', label: 'SKU' },
                { key: 'batch', label: 'Batch #', render: safeRender },
                { key: 'expiry', label: 'Expiry Date', render: (val) => val ? <span style={{color: activeReportType === 'EXPIRED' ? '#ef4444' : '#f59e0b'}}>{val}</span> : safeRender(val) },
                { key: 'qty', label: 'Quantity' },
                { key: 'location', label: 'Warehouse' }
            ];
        }

        if (activeReportType === 'LOW_STOCK') {
            return [
                { key: 'product', label: 'Product' },
                { key: 'warehouse', label: 'Warehouse' },
                { key: 'currentQty', label: 'In Stock', render: (val) => <span style={{color: '#ef4444', fontWeight: '700'}}>{val}</span> },
                { key: 'reorderLevel', label: 'Reorder At' },
                { key: 'shortage', label: 'Units Needed' }
            ];
        }
        if (activeReportType === 'TURNOVER') {
            return [
                { key: 'product', label: 'Product' },
                { key: 'inbound', label: 'Stock IN' },
                { key: 'outbound', label: 'Stock OUT' },
                { key: 'turnoverRate', label: 'Velocity', render: (val) => (
                    <span className={`status-badge ${String(val).toLowerCase()}`}>{val}</span>
                )},
                { key: 'status', label: 'Inventory Status' }
            ];
        }
        if (activeReportType === 'WH_COMPARISON') {
            if (processedData.length === 0) return [{ key: 'product', label: 'Product' }];
            
            const cols = [{ key: 'product', label: 'Product' }];
            const whKeys = Object.keys(processedData[0]).filter(k => k.startsWith('wh_'));
            
            whKeys.forEach(key => {
                cols.push({ 
                    key: key, 
                    label: key.replace('wh_', ''),
                    render: (val) => val !== undefined ? val : <span style={{color: '#94a3b8'}}>0</span> 
                });
            });
            
            // Visual chart column using pure CSS
            if (whKeys.length >= 2) {
                cols.push({
                    key: 'variance',
                    label: 'Distribution Chart',
                    render: (_, row) => {
                        const total = row.total || 1;
                        const w1 = row[whKeys[0]] || 0;
                        const pct1 = Math.round((w1 / total) * 100);
                        return (
                            <div className="variance-bar-container" title={`${pct1}% vs ${100-pct1}%`}>
                                <div className="variance-bar-fill" style={{ width: `${pct1}%` }}></div>
                            </div>
                        );
                    }
                });
            }
            cols.push({ key: 'total', label: 'Total Extent', render: (val) => <strong>{val}</strong> });
            return cols;
        }
        if (activeReportType === 'BATCH_ANALYSIS') {
            return [
                { key: 'product', label: 'Product' },
                { key: 'batchNo', label: 'Batch Identifier', render: safeRender },
                { key: 'mfgDate', label: 'Mfg Date', render: safeRender },
                { key: 'expiryDate', label: 'Expiry Date', render: safeRender },
                { key: 'qtyInBatch', label: 'Batch Qty' }
            ];
        }

        if (activeReportType === 'SALES_REPORT' || activeReportType === 'RETURNS_REPORT') {
            return [
                { key: 'date', label: 'Date' },
                { key: 'product', label: 'Product' },
                { key: 'qty', label: 'Quantity' },
                { key: 'warehouse', label: 'Warehouse' },
                { key: 'user', label: 'Performed By' }
            ];
        }

        return [
            { key: 'date', label: 'Date' },
            { key: 'product', label: 'Product' },
            { key: 'qty', label: 'Quantity' },
            { key: 'warehouse', label: 'Warehouse' },
            { key: 'user', label: 'Performed By' }
        ];
    };

    // --- BI KPI Rendering ---
    const renderKPICards = () => {
        if (!overviewStats) return null;

        const metrics = [
            { label: "Total Line Items", value: overviewStats.totalRecords }
        ];

        // Dynamically add stats returned from backend
        if (overviewStats.totalQuantity) metrics.push({ label: "Total Quantity", value: overviewStats.totalQuantity });
        if (overviewStats.totalUniqueItems) metrics.push({ label: "Unique Products", value: overviewStats.totalUniqueItems });
        if (overviewStats.totalShortageUnits) metrics.push({ label: "Shortage Deficit", value: overviewStats.totalShortageUnits, color: 'critical' });
        if (overviewStats.totalUnitsAtRisk) metrics.push({ label: "Units At Risk", value: overviewStats.totalUnitsAtRisk, color: 'warning' });
        if (overviewStats.totalVolumeMoved) metrics.push({ label: "Total Volume", value: overviewStats.totalVolumeMoved });
        if (overviewStats.totalSystemStock) metrics.push({ label: "System Stock", value: overviewStats.totalSystemStock });

        return (
            <div className="report-kpi-grid">
                {metrics.map((m, idx) => (
                    <div key={idx} className={`kpi-card ${m.color || ''}`}>
                        <span className="kpi-label">{m.label}</span>
                        <span className="kpi-value">{m.value || 0}</span>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="reports-view-container">
            {/* 1. Filter Panel */}
            <div className="reports-tools-container">
                <div className="reports-filter-row">
                    <MultiSelect
                        label="Target Warehouses"
                        options={warehouses}
                        selectedValues={selectedWarehouses}
                        onChange={onWarehouseChange}
                        placeholder="Select Warehouses"
                        allSelectedLabel="All Warehouses"
                    />

                    <Select
                        label="Report Type"
                        value={reportType}
                        onChange={(e) => setReportType(e.target.value)}
                        placeholder="Choose Report Type"
                        options={[
                            { label: "Stock Summary (Level)", value: "STOCK_SUMMARY" },
                            { label: "Expiring Soon", value: "EXPIRING" },
                            { label: "Expired Inventory", value: "EXPIRED" },
                            { label: "Low Stock Alert (Reorder)", value: "LOW_STOCK" },
                            { label: "Movement Velocity (Turnover)", value: "TURNOVER" },
                            { label: "Warehouse Comparison", value: "WH_COMPARISON" },
                            { label: "Detailed Batch Analysis", value: "BATCH_ANALYSIS" },
                            { label: "Sales Report (OUT)", value: "SALES_REPORT" },
                            { label: "Returns Report (IN)", value: "RETURNS_REPORT" }
                        ]}
                    />

                    <MultiSelect
                        label="Product Scope"
                        selectedValues={selectedProducts}
                        onChange={(vals) => setSelectedProducts(vals)}
                        placeholder={isMetadataLoading ? "Loading Products..." : "All Products"}
                        allSelectedLabel="All Products"
                        options={productOptions}
                    />
                </div>

                <div className="reports-filter-row">
                    <DateInput
                        label="From Date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                    />
                    <DateInput
                        label="To Date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                    />
                    <div className="sorting-group">
                        <Select
                            label="Sort By"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            options={[
                                { label: "Product Name", value: "product" },
                                { label: "Date", value: "date" },
                                { label: "Quantity", value: "qty" }
                            ]}
                        />
                         <Select
                            label="Direction"
                            value={sortDir}
                            onChange={(e) => setSortDir(e.target.value)}
                            options={[
                                { label: "Ascending", value: "asc" },
                                { label: "Descending", value: "desc" }
                            ]}
                        />
                    </div>
                </div>

                <div className="reports-action-row">
                    <button 
                        className="btn-generate" 
                        onClick={handleGenerate}
                        disabled={isGenerating}
                    >
                        {isGenerating ? <RefreshCw className="spin" size={18} /> : <FileText size={18} />}
                        {isGenerating ? "Generating..." : "Generate Report"}
                    </button>
                    <button 
                        className="btn-download" 
                        onClick={handleDownload}
                        disabled={isDownloading || !hasGenerated}
                    >
                        {isDownloading ? <RefreshCw className="spin" size={18} /> : <Download size={18} />}
                        {isDownloading ? "Preparing Excel..." : "Download Excel"}
                    </button>
                </div>
            </div>

            {/* 2. List / Preview Area */}
            <div className="report-preview-container">
                {!hasGenerated ? (
                    <div className="report-empty-state">
                        <Filter size={48} style={{marginBottom: '1rem', opacity: 0.2}} />
                        <h3>Configure your report</h3>
                        <p>Select report type and filters above, then click generate to see the results.</p>
                    </div>
                ) : (
                    <>
                        <div className="report-header-info">
                            <h2>{activeReportType.replace('_', ' ')} Preview</h2>
                            <p>
                                Showing data for {selectedWarehouses?.length || 0} warehouse(s) | 
                                {selectedProducts?.length === 0 || selectedProducts?.includes('ALL') 
                                    ? " All Products" 
                                    : ` ${selectedProducts?.length} Product(s)`}
                            </p>
                            <span className="report-timestamp">
                                Generated at: {overviewStats?.generatedAt ? new Date(overviewStats.generatedAt).toLocaleTimeString() : new Date().toLocaleTimeString()}
                            </span>
                        </div>
                        
                        {/* Premium Business Intelligence Stats */}
                        {renderKPICards()}

                        <Table
                            data={processedData}
                            columns={getColumns()}
                            isLoading={isGenerating}
                            currentPage={page}
                            totalPages={totalPages}
                            onPrevPage={() => handlePageChange(page - 1)}
                            onNextPage={() => handlePageChange(page + 1)}
                        />
                    </>
                )}
            </div>
        </div>
    );
}
