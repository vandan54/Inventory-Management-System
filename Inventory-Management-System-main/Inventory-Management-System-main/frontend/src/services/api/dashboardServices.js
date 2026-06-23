const API_BASE_URL = 'http://localhost:3000/api/dashboard';

const getHeaders = () => {
    return {
        'authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
    };
};

export const dashboardServices = {
    // --- Owner Roles ---
    getOwnerDashboard: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/owner`, {
                method: 'GET',
                headers: getHeaders()
            });
            const data = await response.json();
            return { response, data };
        } catch (err) {
            throw err;
        }
    },

    // --- Manager Roles ---
    getManagerDashboard: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/manager`, {
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
