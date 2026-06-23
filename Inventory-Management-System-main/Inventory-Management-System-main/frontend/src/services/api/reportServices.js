const API_BASE_URL = 'http://localhost:3000/api/reports';
const API_VIEW_URL = 'http://localhost:3000/api/inventory-view';

const getHeaders = () => ({
    'authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
});

export const reportServices = {
    // Fetch warehouses specifically for reporting scope
    getReportWarehouses: async () => {
        try {
            const response = await fetch(`${API_VIEW_URL}/warehouses`, {
                method: 'GET',
                headers: getHeaders()
            });
            const data = await response.json();
            return { response, data };
        } catch (err) {
            throw err;
        }
    },

    getManagerReport: async (reportType, warehouseIds, filters, page = 1, limit = 10) => {
        try {
            const response = await fetch(`${API_BASE_URL}/manager?page=${page}&limit=${limit}`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ reportType, warehouseIds, filters })
            });
            const data = await response.json();
            return { response, data };
        } catch (err) {
            throw err;
        }
    },
    
    getOwnerReport: async (reportType, warehouseIds, filters, page = 1, limit = 10) => {
        try {
            const response = await fetch(`${API_BASE_URL}/owner?page=${page}&limit=${limit}`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ reportType, warehouseIds, filters })
            });
            const data = await response.json();
            return { response, data };
        } catch (err) {
            throw err;
        }
    },

    getManagerMetadata: async (reportType, warehouseIds) => {
        try {
            const response = await fetch(`${API_BASE_URL}/manager/metadata`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ reportType, warehouseIds })
            });
            const data = await response.json();
            return { response, data };
        } catch (err) {
            throw err;
        }
    },

    getOwnerMetadata: async (reportType, warehouseIds) => {
        try {
            const response = await fetch(`${API_BASE_URL}/owner/metadata`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ reportType, warehouseIds })
            });
            const data = await response.json();
            return { response, data };
        } catch (err) {
            throw err;
        }
    }
};
