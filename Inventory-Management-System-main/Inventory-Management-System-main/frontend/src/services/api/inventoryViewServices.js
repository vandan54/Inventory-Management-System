const API_BASE_URL = 'http://localhost:3000/api/inventory-view';

const getHeaders = () => ({
    'authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
});

export const inventoryViewServices = {
    // 1. Get Authorized Warehouses (Automatically scoped by backend based on role)
    getWarehouses: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/warehouses`, {
                method: 'GET',
                headers: getHeaders()
            });
            const data = await response.json();
            return { response, data };
        } catch (err) {
            throw err;
        }
    },

    // 2. Get Paginated Inventory List with Filters
    getInventoryList: async (warehouseIds, filters = {}, page = 1, limit = 10) => {
        try {
            const searchQuery = filters.search ? `&search=${encodeURIComponent(filters.search)}` : '';
            const bodyFilters = { ...filters };
            delete bodyFilters.search; // Sent in query instead

            const response = await fetch(`${API_BASE_URL}/list?page=${page}&limit=${limit}${searchQuery}`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ warehouseIds, filters: bodyFilters })
            });
            const data = await response.json();
            return { response, data };
        } catch (err) {
            throw err;
        }
    },

    // 3. Get KPI Metrics for the Dashboard
    getInventoryKPIs: async (warehouseIds, filters = {}) => {
        try {
            const searchQuery = filters.search ? `?search=${encodeURIComponent(filters.search)}` : '';
            const bodyFilters = { ...filters };
            delete bodyFilters.search; // Sent in query instead

            const response = await fetch(`${API_BASE_URL}/kpis${searchQuery}`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ warehouseIds, filters: bodyFilters })
            });
            const data = await response.json();
            return { response, data };
        } catch (err) {
            throw err;
        }
    },

    // 4. Get Item Details (Batches, Expiry, Locations) for Modal
    getItemDetails: async (itemId, warehouseIds) => {
        try {
            const response = await fetch(`${API_BASE_URL}/item/${itemId}/details`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ warehouseIds })
            });
            const data = await response.json();
            return { response, data };
        } catch (err) {
            throw err;
        }
    }
};
