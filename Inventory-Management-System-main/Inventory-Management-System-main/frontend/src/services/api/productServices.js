const API_BASE_URL = 'http://localhost:3000/api/products';

export const productServices = {
    createProduct: async (formData) => {
        try {
            const response = await fetch(`${API_BASE_URL}`, {
                method: 'POST',
                headers: {
                    'authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ ...formData })
            });

            const data = await response.json();

            return { response, data };
        } catch (err) {
            throw err;
        }
    },
    updateProduct: async (id, formData) => {
        try {
            const response = await fetch(`${API_BASE_URL}/${id}`, {
                method: 'PUT',
                headers: {
                    'authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ ...formData })
            });

            const data = await response.json();

            return { response, data };
        } catch (err) {
            throw err;
        }
    },
    deleteProduct: async (id, password) => {
        try {
            const response = await fetch(`${API_BASE_URL}/${id}`, {
                method: 'DELETE',
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
    searchProduct: async (page, search) => {
        try {
            const response = await fetch(`${API_BASE_URL}?page=${page}&limit=10&search=${encodeURIComponent(search)}`, {
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