const API_BASE_URL = 'http://localhost:3000/api/inventory';

const getHeaders = () => ({
    'authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
});

export const inventoryServices = {
    // 1. Get staff's assigned warehouse
    getStaffWarehouse: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/staff-warehouse`, {
                method: 'GET',
                headers: getHeaders()
            });
            const data = await response.json();
            return { response, data };
        } catch (err) {
            throw err;
        }
    },

    // 2. Get products for a warehouse
    getWarehouseProducts: async (warehouseId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/warehouse/${warehouseId}/products`, {
                method: 'GET',
                headers: getHeaders()
            });
            const data = await response.json();
            return { response, data };
        } catch (err) {
            throw err;
        }
    },

    // 3. Get reasons by type
    getReasons: async (type) => {
        try {
            const response = await fetch(`${API_BASE_URL}/reasons/${type}`, {
                method: 'GET',
                headers: getHeaders()
            });
            const data = await response.json();
            return { response, data };
        } catch (err) {
            throw err;
        }
    },

    // 4. Get existing batches for a product
    getProductBatches: async (warehouseId, productId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/warehouse/${warehouseId}/product/${productId}/batches`, {
                method: 'GET',
                headers: getHeaders()
            });
            const data = await response.json();
            return { response, data };
        } catch (err) {
            throw err;
        }
    },

    // 5. Get existing serials for a product
    getProductSerials: async (warehouseId, productId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/warehouse/${warehouseId}/product/${productId}/serials`, {
                method: 'GET',
                headers: getHeaders()
            });
            const data = await response.json();
            return { response, data };
        } catch (err) {
            throw err;
        }
    },

    // 6. Stock IN
    stockIn: async (warehouseId, payload) => {
        try {
            const response = await fetch(`${API_BASE_URL}/warehouse/${warehouseId}/stock-in`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            return { response, data };
        } catch (err) {
            throw err;
        }
    },

    // 7. Stock OUT
    stockOut: async (warehouseId, payload) => {
        try {
            const response = await fetch(`${API_BASE_URL}/warehouse/${warehouseId}/stock-out`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            return { response, data };
        } catch (err) {
            throw err;
        }
    },

    // 8. Get staff's recent logs
    getStaffRecentLogs: async (page = 1, limit = 15) => {
        try {
            const response = await fetch(`${API_BASE_URL}/recent-logs?page=${page}&limit=${limit}`, {
                method: 'GET',
                headers: getHeaders()
            });
            const data = await response.json();
            return { response, data };
        } catch (err) {
            throw err;
        }
    }
};
