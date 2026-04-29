// Sistema de Recuperación de Contraseñas - UnionTech
// Implementación de HU3: Recuperación de contraseñas segura

class PasswordRecovery {
    constructor() {
        this.baseURL = (window.API_BASE_URL || 'https://uniontech-backend-production.up.railway.app') + '/api/auth';
        this.currentStep = 1;
        this.userEmail = '';
        this.resetToken = '';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkURLParams();
        console.log('Sistema de recuperación de contraseñas inicializado');
    }

    setupEventListeners() {
        // Formulario de solicitud
        document.getElementById('requestForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRequestReset();
        });

        // Formulario de verificación
        document.getElementById('verifyForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleVerifyToken();
        });

        // Formulario de nueva contraseña
        document.getElementById('resetForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleResetPassword();
        });

        // Validación de contraseña en tiempo real
        document.getElementById('newPassword').addEventListener('input', (e) => {
            this.checkPasswordStrength(e.target.value);
        });

        // Verificación de coincidencia de contraseñas
        document.getElementById('confirmPassword').addEventListener('input', (e) => {
            this.checkPasswordMatch();
        });

        // Auto-formato del token (solo números)
        document.getElementById('token').addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^0-9]/g, '');
        });
    }

    checkURLParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        
        if (token) {
            // Si hay un token en la URL, ir directamente al paso de verificación
            this.resetToken = token;
            this.goToStep(2);
            document.getElementById('token').value = token;
        }
    }

    async handleRequestReset() {
        const email = document.getElementById('email').value.trim();
        
        if (!email) {
            this.showAlert('Por favor ingresa tu email', 'error');
            return;
        }

        if (!this.isValidEmail(email)) {
            this.showAlert('Por favor ingresa un email válido', 'error');
            return;
        }

        try {
            this.setLoading('requestBtn', true);
            
            const response = await fetch(`${this.baseURL}/request-reset`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (data.success) {
                this.userEmail = email;
                this.showAlert('Se han enviado las instrucciones a tu email', 'success');
                setTimeout(() => {
                    this.goToStep(2);
                }, 2000);
            } else {
                this.showAlert(data.message || 'Error al procesar la solicitud', 'error');
            }

        } catch (error) {
            console.error('Error en solicitud de reset:', error);
            this.showAlert('Error de conexión. Intenta nuevamente.', 'error');
        } finally {
            this.setLoading('requestBtn', false);
        }
    }

    async handleVerifyToken() {
        const token = document.getElementById('token').value.trim();
        
        if (!token || token.length !== 6) {
            this.showAlert('El código debe tener 6 dígitos', 'error');
            return;
        }

        try {
            this.setLoading('verifyBtn', true);
            
            const response = await fetch(`${this.baseURL}/verify-reset/${token}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (data.success) {
                this.resetToken = token;
                this.showAlert('Código verificado correctamente', 'success');
                setTimeout(() => {
                    this.goToStep(3);
                }, 1500);
            } else {
                this.showAlert(data.message || 'Código inválido o expirado', 'error');
            }

        } catch (error) {
            console.error('Error verificando token:', error);
            this.showAlert('Error de conexión. Intenta nuevamente.', 'error');
        } finally {
            this.setLoading('verifyBtn', false);
        }
    }

    async handleResetPassword() {
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Validaciones
        if (!newPassword || newPassword.length < 8) {
            this.showAlert('La contraseña debe tener al menos 8 caracteres', 'error');
            return;
        }

        if (!this.isStrongPassword(newPassword)) {
            this.showAlert('La contraseña no cumple con los requisitos de seguridad', 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            this.showAlert('Las contraseñas no coinciden', 'error');
            return;
        }

        try {
            this.setLoading('resetBtn', true);
            
            const response = await fetch(`${this.baseURL}/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    token: this.resetToken,
                    newPassword
                })
            });

            const data = await response.json();

            if (data.success) {
                this.showAlert('Contraseña actualizada exitosamente', 'success');
                setTimeout(() => {
                    this.goToStep(4);
                }, 2000);
            } else {
                this.showAlert(data.message || 'Error al cambiar la contraseña', 'error');
            }

        } catch (error) {
            console.error('Error cambiando contraseña:', error);
            this.showAlert('Error de conexión. Intenta nuevamente.', 'error');
        } finally {
            this.setLoading('resetBtn', false);
        }
    }

    goToStep(step) {
        // Ocultar todos los pasos
        document.querySelectorAll('[id$="Step"]').forEach(el => {
            el.classList.add('hidden');
        });

        // Actualizar indicador de pasos
        document.querySelectorAll('.step').forEach((el, index) => {
            el.classList.remove('active', 'completed');
            if (index + 1 < step) {
                el.classList.add('completed');
            } else if (index + 1 === step) {
                el.classList.add('active');
            }
        });

        // Mostrar paso actual
        const stepMap = {
            1: 'requestStep',
            2: 'verifyStep',
            3: 'resetStep',
            4: 'successStep'
        };

        const targetStep = document.getElementById(stepMap[step]);
        if (targetStep) {
            targetStep.classList.remove('hidden');
            this.currentStep = step;
        }

        // Limpiar alertas
        this.clearAlerts();
    }

    checkPasswordStrength(password) {
        const strengthBar = document.getElementById('strengthBar');
        let strength = 0;
        let className = '';

        // Criterios de fortaleza
        if (password.length >= 8) strength++;
        if (/[a-z]/.test(password)) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^A-Za-z0-9]/.test(password)) strength++;

        // Aplicar clase según fortaleza
        switch (strength) {
            case 0:
            case 1:
                className = '';
                break;
            case 2:
                className = 'strength-weak';
                break;
            case 3:
                className = 'strength-fair';
                break;
            case 4:
                className = 'strength-good';
                break;
            case 5:
                className = 'strength-strong';
                break;
        }

        strengthBar.className = `password-strength-bar ${className}`;
    }

    checkPasswordMatch() {
        const password = document.getElementById('newPassword').value;
        const confirm = document.getElementById('confirmPassword').value;
        const confirmInput = document.getElementById('confirmPassword');

        if (confirm && password !== confirm) {
            confirmInput.style.borderColor = '#f44336';
        } else if (confirm && password === confirm) {
            confirmInput.style.borderColor = '#4CAF50';
        } else {
            confirmInput.style.borderColor = '#e0e0e0';
        }
    }

    isStrongPassword(password) {
        // Al menos 8 caracteres, mayúscula, minúscula, número y símbolo
        const hasLength = password.length >= 8;
        const hasUpper = /[A-Z]/.test(password);
        const hasLower = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSymbol = /[^A-Za-z0-9]/.test(password);

        return hasLength && hasUpper && hasLower && hasNumber && hasSymbol;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    setLoading(buttonId, loading) {
        const button = document.getElementById(buttonId);
        const originalText = button.textContent;

        if (loading) {
            button.disabled = true;
            button.innerHTML = '<span class="loading"></span>Procesando...';
        } else {
            button.disabled = false;
            button.textContent = originalText;
        }
    }

    showAlert(message, type = 'info') {
        const container = document.getElementById('alertContainer');
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        
        const icon = {
            success: '✅',
            error: '❌',
            info: 'ℹ️'
        };

        alert.innerHTML = `${icon[type]} ${message}`;
        
        // Limpiar alertas anteriores
        container.innerHTML = '';
        container.appendChild(alert);

        // Auto-remover después de 5 segundos para alertas de éxito
        if (type === 'success') {
            setTimeout(() => {
                if (alert.parentNode) {
                    alert.remove();
                }
            }, 5000);
        }
    }

    clearAlerts() {
        document.getElementById('alertContainer').innerHTML = '';
    }
}

// Inicializar cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
    new PasswordRecovery();
});
