/**
 * Sistema de Autenticación Frontend UnionTech
 * Manejo de tokens y autenticación del lado cliente
 */

class AuthSystem {
    constructor() {
        this.token = null;
        this.user = null;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        
        // Recuperar token del localStorage
        this.token = localStorage.getItem('uniontech_token');
        
        if (this.token) {
            try {
                // Decodificar información básica del token (simulado)
                this.user = this.decodeToken(this.token);
            } catch (error) {
                console.warn('Token inválido encontrado, limpiando...');
                this.logout();
            }
        }
        
        this.initialized = true;
        console.log('Sistema de autenticación inicializado');
    }

    async login(username, password) {
        try {
            const response = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password })
            });

            if (!response.ok) {
                throw new Error('Credenciales inválidas');
            }

            const data = await response.json();
            
            if (data.success) {
                this.token = data.token;
                this.user = data.user;
                
                // Guardar token en localStorage
                localStorage.setItem('uniontech_token', this.token);
                
                // Disparar evento de login exitoso
                this.dispatchAuthEvent('login', this.user);
                
                return { success: true, user: this.user };
            } else {
                throw new Error(data.message || 'Error de autenticación');
            }
        } catch (error) {
            console.error('Error en login:', error);
            return { success: false, message: error.message };
        }
    }

    logout() {
        this.token = null;
        this.user = null;
        
        // Limpiar localStorage
        localStorage.removeItem('uniontech_token');
        
        // Disparar evento de logout
        this.dispatchAuthEvent('logout');
        
        console.log('Usuario desconectado');
    }

    isAuthenticated() {
        return !!(this.token && this.user);
    }

    getToken() {
        return this.token;
    }

    getUser() {
        return this.user;
    }

    // Simulación de decodificación de token
    decodeToken(token) {
        try {
            // En un sistema real, aquí decodificarías un JWT
            // Por ahora, simulamos la información del usuario
            const users = {
                'demo_token_admin': { username: 'admin', role: 'admin', name: 'Administrador' },
                'demo_token_demo': { username: 'demo', role: 'user', name: 'Usuario Demo' },
                'demo_token_operator': { username: 'operator', role: 'operator', name: 'Operador' }
            };
            
            return users[token] || null;
        } catch (error) {
            console.error('Error decodificando token:', error);
            return null;
        }
    }

    // Agregar headers de autenticación a las peticiones
    getAuthHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        return headers;
    }

    // Realizar petición autenticada
    async authenticatedFetch(url, options = {}) {
        const defaultOptions = {
            headers: this.getAuthHeaders()
        };
        
        const mergedOptions = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers
            }
        };
        
        try {
            const response = await fetch(url, mergedOptions);
            
            // Si recibimos 401, el token expiró
            if (response.status === 401) {
                this.logout();
                throw new Error('Sesión expirada');
            }
            
            return response;
        } catch (error) {
            console.error('Error en petición autenticada:', error);
            throw error;
        }
    }

    // Disparar eventos personalizados de autenticación
    dispatchAuthEvent(type, data = null) {
        const event = new CustomEvent(`auth:${type}`, {
            detail: data
        });
        document.dispatchEvent(event);
    }

    // Verificar permisos de rol
    hasRole(requiredRole) {
        if (!this.user) return false;
        
        const roleHierarchy = {
            'admin': 3,
            'operator': 2,
            'user': 1
        };
        
        const userLevel = roleHierarchy[this.user.role] || 0;
        const requiredLevel = roleHierarchy[requiredRole] || 0;
        
        return userLevel >= requiredLevel;
    }

    // Método para refrescar token (simulado)
    async refreshToken() {
        try {
            const response = await this.authenticatedFetch('http://localhost:3000/api/auth/refresh', {
                method: 'POST'
            });
            
            if (response.ok) {
                const data = await response.json();
                this.token = data.token;
                localStorage.setItem('uniontech_token', this.token);
                return true;
            }
        } catch (error) {
            console.error('Error refrescando token:', error);
            this.logout();
        }
        return false;
    }
}

// Instancia global
window.AuthSystem = new AuthSystem();

// Aliases globales para fácil uso
window.login = (username, password) => window.AuthSystem.login(username, password);
window.logout = () => window.AuthSystem.logout();
window.isAuthenticated = () => window.AuthSystem.isAuthenticated();
window.getAuthHeaders = () => window.AuthSystem.getAuthHeaders();
window.authenticatedFetch = (url, options) => window.AuthSystem.authenticatedFetch(url, options);

// Inicializar automáticamente
document.addEventListener('DOMContentLoaded', () => {
    window.AuthSystem.init();
});

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthSystem;
}
