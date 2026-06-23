import SetupPassword from "../../pages/auth/SetupPassword";

const API_BASE_URL = 'http://localhost:3000/api/auth';

export const authServices = {
    login: async (email, password) => {
        try {
            const response = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            return { response, data };
        } catch (err) {
            throw err;
        }
    },
    registerOwner: async (email, password) => {
        try {
            const response = await fetch(`${API_BASE_URL}/register-owner`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            return { response, data };
        } catch (err) {
            throw err;
        }
    },
    forgotPassword: async (email) => {
        try {
            const response = await fetch(`${API_BASE_URL}/forgot-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            return { response, data };
        } catch (err) {
            throw err;
        }
    },
    resetPassword: async (token, password) => {
        try {
            const response = await fetch(`${API_BASE_URL}/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ token, password })
            });

            const data = await response.json();

            return { response, data };
        } catch (err) {
            throw err;
        }
    },
    setupPassword: async (password) => {
        try {
            const response = await fetch(`${API_BASE_URL}/setup-password`, {
                method: 'POST',
                headers: {
                    'authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ password })
            });

            const data = await response.json();

            return { response, data };
        } catch (err) {
            throw err;
        }
    },
    checkAccess: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/access-check`, {
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
    },
    changePassword: async (currentPassword, newPassword, confirmPassword) => {
        try {
            const response = await fetch(`${API_BASE_URL}/change-password`, {
                method: 'POST',
                headers: {
                    'authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ currentPassword, newPassword, confirmPassword })
            });

            const data = await response.json();

            return { response, data };
        } catch (err) {
            throw err;
        }
    }
};