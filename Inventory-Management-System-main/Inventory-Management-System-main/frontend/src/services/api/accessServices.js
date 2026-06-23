const API_BASE_URL = 'http://localhost:3000/api/access';

const getHeaders = () => ({
    'authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
});

export const accessServices = {
    // 1. Get Minimal Warehouses
    getMinimalWarehouses: async () => {
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

    // 2. Get Assigned Products
    getAssignedProducts: async (warehouseId, page = 1, limit = 10, search = "") => {
        try {
            const response = await fetch(`${API_BASE_URL}/warehouses/${warehouseId}/products?page=${page}&limit=${limit}&search=${search}`, {
                method: 'GET',
                headers: getHeaders()
            });
            const data = await response.json();
            return { response, data };
        } catch (err) {
            throw err;
        }
    },

    // 3. Get Assigned Users
    getAssignedUsers: async (warehouseId, page = 1, limit = 10, search = "") => {
        try {
            const response = await fetch(`${API_BASE_URL}/warehouses/${warehouseId}/users?page=${page}&limit=${limit}&search=${search}`, {
                method: 'GET',
                headers: getHeaders()
            });
            const data = await response.json();
            return { response, data };
        } catch (err) {
            throw err;
        }
    },

    // 4. Get Unassigned Products (for modal)
    getUnassignedProducts: async (warehouseId, search = "") => {
        try {
            const response = await fetch(`${API_BASE_URL}/warehouses/${warehouseId}/products/unassigned?search=${search}`, {
                method: 'GET',
                headers: getHeaders()
            });
            const data = await response.json();
            return { response, data };
        } catch (err) {
            throw err;
        }
    },

    // 5. Get Unassigned Users (for modal)
    getUnassignedUsers: async (warehouseId, search = "") => {
        try {
            const response = await fetch(`${API_BASE_URL}/warehouses/${warehouseId}/users/unassigned?search=${search}`, {
                method: 'GET',
                headers: getHeaders()
            });
            const data = await response.json();
            return { response, data };
        } catch (err) {
            throw err;
        }
    },

    // 6. Assign Products
    assignProducts: async (warehouseId, itemIds) => {
        try {
            const response = await fetch(`${API_BASE_URL}/warehouses/${warehouseId}/products`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ itemIds })
            });
            const data = await response.json();
            return { response, data };
        } catch (err) {
            throw err;
        }
    },

    // 7. Assign Users
    assignUsers: async (warehouseId, userIds) => {
        try {
            const response = await fetch(`${API_BASE_URL}/warehouses/${warehouseId}/users`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ userIds })
            });
            const data = await response.json();
            return { response, data };
        } catch (err) {
            throw err;
        }
    },

    // 8. Toggle Product Status
    toggleProductStatus: async (warehouseId, productId, is_active) => {
        try {
            const response = await fetch(`${API_BASE_URL}/warehouses/${warehouseId}/products/${productId}/status`, {
                method: 'PATCH',
                headers: getHeaders(),
                body: JSON.stringify({ is_active })
            });
            const data = await response.json();
            return { response, data };
        } catch (err) {
            throw err;
        }
    },

    // 9. Remove Product Access
    removeAssignedProduct: async (warehouseId, productId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/warehouses/${warehouseId}/products/${productId}`, {
                method: 'DELETE',
                headers: getHeaders()
            });
            const data = await response.json();
            return { response, data };
        } catch (err) {
            throw err;
        }
    },

    // 10. Remove User Access
    removeAssignedUser: async (warehouseId, userId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/warehouses/${warehouseId}/users/${userId}`, {
                method: 'DELETE',
                headers: getHeaders()
            });
            const data = await response.json();
            return { response, data };
        } catch (err) {
            throw err;
        }
    }
};
