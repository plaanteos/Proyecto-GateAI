// UnionTech - API Utilities
const _DEFAULT_API_URL = (window.API_BASE_URL || 'https://uniontech-backend-production.up.railway.app') + '/api';
class APIClient {
    constructor(baseUrl = _DEFAULT_API_URL) {
        this.baseUrl = baseUrl;
    }

    getAuthHeaders() {
        const token = localStorage.getItem('uniontech_token');
        return {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        };
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            headers: this.getAuthHeaders(),
            ...options
        };

        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP Error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`API Error [${endpoint}]:`, error);
            throw error;
        }
    }

    // Auth endpoints
    async login(username, password) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
    }

    async getProfile() {
        return this.request('/auth/profile');
    }

    // Access endpoints
    async generateQR(data) {
        return this.request('/access/generate', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async validateAccess(code) {
        return this.request('/access/validate', {
            method: 'POST',
            body: JSON.stringify({ code })
        });
    }

    async getActiveQRs() {
        return this.request('/access/active');
    }

    async getAccessStatus(accessId) {
        return this.request(`/access/status/${accessId}`);
    }

    // Notifications endpoints
    async sendWhatsApp(phone, message, templateData = {}) {
        return this.request('/notifications/whatsapp', {
            method: 'POST',
            body: JSON.stringify({ phone, message, templateData })
        });
    }

    async sendEmail(email, subject, message, templateData = {}) {
        return this.request('/notifications/email', {
            method: 'POST',
            body: JSON.stringify({ email, subject, message, templateData })
        });
    }

    async sendVisitorInvite(anfitrionId, visitantData) {
        return this.request('/notifications/visitor-invite', {
            method: 'POST',
            body: JSON.stringify({ anfitrionId, visitantData })
        });
    }

    async sendAccessNotification(anfitrionId, accessData) {
        return this.request('/notifications/access-granted', {
            method: 'POST',
            body: JSON.stringify({ anfitrionId, accessData })
        });
    }

    // Visitors endpoints
    async getVisitors() {
        return this.request('/visitantes');
    }

    async createVisitor(visitorData) {
        return this.request('/visitantes', {
            method: 'POST',
            body: JSON.stringify(visitorData)
        });
    }

    // People endpoints
    async getPeople(page = 1, limit = 10, activo = true) {
        const params = new URLSearchParams({ page, limit, activo });
        return this.request(`/personas?${params}`);
    }

    async createPerson(personData) {
        return this.request('/personas', {
            method: 'POST',
            body: JSON.stringify(personData)
        });
    }

    async updatePerson(id, personData) {
        return this.request(`/personas/${id}`, {
            method: 'PUT',
            body: JSON.stringify(personData)
        });
    }

    async deletePerson(id) {
        return this.request(`/personas/${id}`, {
            method: 'DELETE'
        });
    }

    // Buildings endpoints
    async getBuildings() {
        return this.request('/edificios');
    }

    async createBuilding(buildingData) {
        return this.request('/edificios', {
            method: 'POST',
            body: JSON.stringify(buildingData)
        });
    }

    // Reports endpoints
    async getAccessReport(fechaDesde, fechaHasta) {
        const params = new URLSearchParams({ fechaDesde, fechaHasta });
        return this.request(`/reportes/accesos?${params}`);
    }

    // System health
    async checkHealth() {
        const response = await fetch(`${this.baseUrl.replace('/api', '')}/health`);
        return response.json();
    }
}

// Singleton instance
window.api = new APIClient();

// Error handler utility
function handleAPIError(error, showToUser = true) {
    console.error('API Error:', error);
    
    if (showToUser && window.app) {
        let message = 'Error de conexión con el servidor';
        
        if (error.message.includes('401')) {
            message = 'Sesión expirada. Por favor inicie sesión nuevamente.';
            window.app.logout();
        } else if (error.message.includes('403')) {
            message = 'No tiene permisos para realizar esta acción.';
        } else if (error.message.includes('404')) {
            message = 'Recurso no encontrado.';
        } else if (error.message.includes('500')) {
            message = 'Error interno del servidor.';
        } else {
            message = error.message || message;
        }
        
        window.app.showAlert(message, 'danger');
    }
    
    return error;
}

// Request interceptor for global error handling
const originalRequest = window.api.request.bind(window.api);
window.api.request = async function(endpoint, options) {
    try {
        return await originalRequest(endpoint, options);
    } catch (error) {
        return Promise.reject(handleAPIError(error, true));
    }
};
