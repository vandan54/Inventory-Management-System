const API_BASE_URL = 'http://localhost:3000/api/owner';

export const ownerServices = {
    completeProfile: async (organizationData, userData) => {
        try {
            const response = await fetch(`${API_BASE_URL}/complete-profile`, {
                method: 'POST',
                headers: {
                    'authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ ...organizationData, ...userData })
            });

            const data = await response.json();

            return { response, data };
        } catch (err) {
            throw err;
        }
    },
    editProfile: async (profileData) => {
        try {
            const response = await fetch(`${API_BASE_URL}/edit-profile`, {
                method: 'POST',
                headers: {
                    'authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(profileData)
            });

            const data = await response.json();

            return { response, data };
        } catch (err) {
            throw err;
        }
    },
    getProfile: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/profile`, {
                method: 'GET',
                headers: {
                    'authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            return { response, data };
        } catch (err) {
            throw err;
        }
    }
};