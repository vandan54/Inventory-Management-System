const API_BASE_URL = 'http://localhost:3000/api/manager';

const getHeaders = () => ({
    'authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
});

export const managerServices = {
    // 1. Get List of Warehouses that the manager is assigned to
    getManagerWarehouses: async () => {
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

    // 2. Get list of staff users in a specific assigned warehouse
    getWarehouseStaff: async (warehouseId, page = 1, limit = 10, search = "") => {
        try {
            const response = await fetch(`${API_BASE_URL}/warehouses/${warehouseId}/staff?page=${page}&limit=${limit}&search=${search}`, {
                method: 'GET',
                headers: getHeaders()
            });
            const data = await response.json();
            return { response, data };
        } catch (err) {
            throw err;
        }
    },

    // 3. Toggle a staff member's active status (block/unblock)
    toggleStaffStatus: async (warehouseId, staffId, is_active) => {
        try {
            const response = await fetch(`${API_BASE_URL}/warehouses/${warehouseId}/staff/${staffId}/status`, {
                method: 'PATCH',
                headers: getHeaders(),
                body: JSON.stringify({ is_active })
            });
            const data = await response.json();
            return { response, data };
        } catch (err) {
            throw err;
        }
    }
};
