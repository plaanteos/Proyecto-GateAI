/**
 * Sistema de Notificaciones UnionTech
 * Manejo de notificaciones del sistema y alertas
 */

class NotificationSystem {
    constructor() {
        this.notifications = [];
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        
        // Crear contenedor de notificaciones si no existe
        if (!document.getElementById('notification-container')) {
            const container = document.createElement('div');
            container.id = 'notification-container';
            container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
                max-width: 350px;
            `;
            document.body.appendChild(container);
        }
        
        this.initialized = true;
        console.log('Sistema de notificaciones inicializado');
    }

    show(message, type = 'info', duration = 5000) {
        this.init();
        
        const notification = {
            id: Date.now(),
            message,
            type,
            timestamp: new Date()
        };
        
        this.notifications.push(notification);
        this.render(notification, duration);
        
        return notification.id;
    }

    render(notification, duration) {
        const container = document.getElementById('notification-container');
        if (!container) return;

        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${this.getBootstrapType(notification.type)} alert-dismissible fade show mb-2`;
        alertDiv.style.cssText = 'animation: slideInRight 0.3s ease-out;';
        
        alertDiv.innerHTML = `
            <i class="fas ${this.getIcon(notification.type)} me-2"></i>
            <span>${notification.message}</span>
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        container.appendChild(alertDiv);

        // Auto-remove después del tiempo especificado
        if (duration > 0) {
            setTimeout(() => {
                if (alertDiv.parentNode) {
                    alertDiv.style.animation = 'slideOutRight 0.3s ease-in';
                    setTimeout(() => {
                        if (alertDiv.parentNode) {
                            alertDiv.remove();
                        }
                    }, 300);
                }
            }, duration);
        }
    }

    getBootstrapType(type) {
        const typeMap = {
            'success': 'success',
            'error': 'danger',
            'warning': 'warning',
            'info': 'info',
            'critical': 'danger'
        };
        return typeMap[type] || 'info';
    }

    getIcon(type) {
        const iconMap = {
            'success': 'fa-check-circle',
            'error': 'fa-exclamation-circle',
            'warning': 'fa-exclamation-triangle',
            'info': 'fa-info-circle',
            'critical': 'fa-times-circle'
        };
        return iconMap[type] || 'fa-info-circle';
    }

    clear() {
        const container = document.getElementById('notification-container');
        if (container) {
            container.innerHTML = '';
        }
        this.notifications = [];
    }

    // Métodos de conveniencia
    success(message, duration = 5000) {
        return this.show(message, 'success', duration);
    }

    error(message, duration = 8000) {
        return this.show(message, 'error', duration);
    }

    warning(message, duration = 6000) {
        return this.show(message, 'warning', duration);
    }

    info(message, duration = 5000) {
        return this.show(message, 'info', duration);
    }

    critical(message, duration = 0) {
        return this.show(message, 'critical', duration);
    }
}

// CSS para animaciones
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Instancia global
window.NotificationSystem = new NotificationSystem();

// Aliases globales para fácil uso
window.showNotification = (message, type, duration) => window.NotificationSystem.show(message, type, duration);
window.showSuccess = (message, duration) => window.NotificationSystem.success(message, duration);
window.showError = (message, duration) => window.NotificationSystem.error(message, duration);
window.showWarning = (message, duration) => window.NotificationSystem.warning(message, duration);
window.showInfo = (message, duration) => window.NotificationSystem.info(message, duration);
