const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const getHeaders = () => {
    const token = localStorage.getItem('rappel_token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};

export const api = {
    auth: {
        signup: async (userData) => {
            const res = await fetch(`${API_URL}/auth/signup`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(userData)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            // Save token and email for verification
            if (data.session?.access_token) {
                localStorage.setItem('rappel_token', data.session.access_token);
            }
            // Store email temporarily for verification page
            localStorage.setItem('rappel_user_email', userData.email);

            return data;
        },
        login: async (email, password) => {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            if (data.session?.access_token) {
                localStorage.setItem('rappel_token', data.session.access_token);
            }
            return data;
        },
        logout: () => {
            localStorage.removeItem('rappel_token');
        },
        verify: async (code) => {
            // Get the user email from localStorage (saved during signup)
            const userEmail = localStorage.getItem('rappel_user_email');

            if (!userEmail) {
                throw new Error("Email non trouvé. Veuillez vous réinscrire.");
            }

            const res = await fetch(`${API_URL}/auth/verify-email`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ email: userEmail, code })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            // Save token if provided
            if (data.session?.access_token) {
                localStorage.setItem('rappel_token', data.session.access_token);
            }

            // Clear the temporary email storage
            localStorage.removeItem('rappel_user_email');

            return data;
        },
        getProfile: async () => {
            const res = await fetch(`${API_URL}/profile`, {
                headers: getHeaders()
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            return data;
        },
        updateProfile: async (profileData) => {
            const res = await fetch(`${API_URL}/profile`, {
                method: 'PATCH',
                headers: getHeaders(),
                body: JSON.stringify(profileData)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            return data;
        },
    },
    leads: {
        fetchAll: async () => {
            const res = await fetch(`${API_URL}/leads`, {
                headers: getHeaders()
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            return data;
        },
        create: async (leadData) => {
            const res = await fetch(`${API_URL}/leads`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(leadData)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            return data;
        },
        createManual: async (leadData) => {
            const res = await fetch(`${API_URL}/leads/manual`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(leadData)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            return data;
        },
        update: async (id, data) => {
            const res = await fetch(`${API_URL}/leads/${id}`, {
                method: 'PATCH',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            const resData = await res.json();
            if (!res.ok) throw new Error(resData.error);
            return resData;
        }
    },
    quotes: {
        fetchAll: async () => {
            const res = await fetch(`${API_URL}/quotes`, {
                headers: getHeaders()
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            return data;
        },
        create: async (quoteData) => {
            const res = await fetch(`${API_URL}/quotes`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(quoteData)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            return data;
        },
        update: async (id, quoteData) => {
            const res = await fetch(`${API_URL}/quotes/${id}`, {
                method: 'PATCH',
                headers: getHeaders(),
                body: JSON.stringify(quoteData)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            return data;
        },
        delete: async (id) => {
            const res = await fetch(`${API_URL}/quotes/${id}`, {
                method: 'DELETE',
                headers: getHeaders()
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            return data;
        }
    },
    stats: {
        fetch: async () => {
            const res = await fetch(`${API_URL}/stats`, {
                headers: getHeaders()
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            return data;
        }
    },
    payments: {
        createCheckout: async (body) => {
            const res = await fetch(`${API_URL}/payments/create-checkout-session`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(body)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            return data;
        }
    },
    admin: {
        fetchLeads: async () => {
            const res = await fetch(`${API_URL}/admin/leads`, {
                headers: getHeaders()
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            return data;
        },
        fetchUsers: async () => {
            const res = await fetch(`${API_URL}/admin/users`, {
                headers: getHeaders()
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            return data;
        },
        updateUserRole: async (userId, role) => {
            const res = await fetch(`${API_URL}/admin/users/${userId}/role`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ role })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            return data;
        }
    },
    activity: {
        fetchAll: async () => {
            const res = await fetch(`${API_URL}/activity`, {
                headers: getHeaders()
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            return data;
        }
    },
    company: {
        lookupSiret: async (siret) => {
            const res = await fetch(`${API_URL}/company/lookup?siret=${encodeURIComponent(siret)}`, {
                headers: getHeaders()
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            return data;
        },
        getLegalForms: async () => {
            const res = await fetch(`${API_URL}/company/legal-forms`, {
                headers: getHeaders()
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            return data;
        }
    }
};
