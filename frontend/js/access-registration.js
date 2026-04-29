// Sistema de Registro de Accesos UnionTech - HU8
// Interfaz intuitiva con Material-UI y múltiples métodos de validación

class AccessRegistrationSystem {
    constructor() {
        this.apiBaseUrl = (window.API_BASE_URL || 'https://uniontech-backend-production.up.railway.app') + '/api';
        this.currentMethod = null;
        this.qrScanner = null;
        this.facialStream = null;
        this.multimodalValidations = {
            qr: false,
            facial: false,
            document: false
        };
        this.init();
    }

    async init() {
        try {
            await this.loadRecentAccess();
            this.setupEventListeners();
            console.log('Sistema de registro de accesos inicializado');
        } catch (error) {
            console.error('Error inicializando sistema:', error);
            this.showStatus('Error inicializando el sistema', 'error');
        }
    }

    setupEventListeners() {
        // Validación multimodal en tiempo real
        document.addEventListener('change', (e) => {
            if (e.target.matches('#qr-validation, #facial-validation, #document-validation')) {
                this.updateMultimodalStatus();
            }
        });

        // Auto-refresh cada 30 segundos
        setInterval(() => {
            this.loadRecentAccess();
        }, 30000);
    }

    // HU8: Selección de método de acceso intuitiva
    selectMethod(method) {
        // Limpiar selección anterior
        document.querySelectorAll('.method-card').forEach(card => {
            card.classList.remove('active');
        });

        // Ocultar todos los formularios
        document.querySelectorAll('.access-form').forEach(form => {
            form.classList.add('hidden');
        });

        // Activar método seleccionado
        document.querySelector(`[data-method="${method}"]`).classList.add('active');
        document.getElementById(`${method}-form`).classList.remove('hidden');
        
        this.currentMethod = method;
        this.clearStatus();

        // Configuración específica por método
        switch(method) {
            case 'qr':
                this.prepareQRScanner();
                break;
            case 'facial':
                this.prepareFacialRecognition();
                break;
            case 'document':
                this.prepareDocumentForm();
                break;
            case 'multimodal':
                this.prepareMultimodalValidation();
                break;
        }
    }

    // Sistema QR Code
    prepareQRScanner() {
        this.showStatus('Presiona "Iniciar Escáner" para comenzar', 'info');
    }

    async startQRScanner() {
        try {
            this.qrScanner = new Html5Qrcode("qr-reader");
            
            const config = {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0
            };

            await this.qrScanner.start(
                { facingMode: "environment" },
                config,
                (decodedText, decodedResult) => {
                    this.processQRCode(decodedText);
                },
                (errorMessage) => {
                    // Error de escaneo - no mostrar todos los errores
                }
            );

            this.showStatus('Escáner QR activo - Coloca el código frente a la cámara', 'info');

        } catch (error) {
            console.error('Error iniciando escáner QR:', error);
            this.showStatus('Error al acceder a la cámara', 'error');
        }
    }

    async stopQRScanner() {
        if (this.qrScanner) {
            try {
                await this.qrScanner.stop();
                this.qrScanner = null;
                this.showStatus('Escáner QR detenido', 'info');
            } catch (error) {
                console.error('Error deteniendo escáner:', error);
            }
        }
    }

    async processQRCode(qrData) {
        try {
            await this.stopQRScanner();
            
            this.showStatus('Código QR detectado - Validando acceso...', 'info');
            
            const response = await fetch(`${this.apiBaseUrl}/access/validate-qr`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify({
                    qrCode: qrData,
                    timestamp: new Date().toISOString(),
                    method: 'qr'
                })
            });

            const result = await response.json();
            
            if (result.success) {
                this.showStatus('✅ Acceso concedido', 'success');
                this.updateMultimodalValidation('qr', true);
                await this.loadRecentAccess();
            } else {
                this.showStatus('❌ Acceso denegado: ' + result.message, 'error');
            }

        } catch (error) {
            console.error('Error procesando QR:', error);
            this.showStatus('Error validando código QR', 'error');
        }
    }

    // Sistema de Reconocimiento Facial
    prepareFacialRecognition() {
        this.showStatus('Presiona "Iniciar Reconocimiento" para activar la cámara', 'info');
    }

    async startFacialRecognition() {
        try {
            const video = document.getElementById('facial-video');
            
            this.facialStream = await navigator.mediaDevices.getUserMedia({
                video: { 
                    width: 640, 
                    height: 480,
                    facingMode: 'user'
                }
            });
            
            video.srcObject = this.facialStream;
            video.play();
            
            this.showStatus('Cámara activa - Posiciona tu rostro en el centro', 'info');

        } catch (error) {
            console.error('Error accediendo a la cámara:', error);
            this.showStatus('Error al acceder a la cámara facial', 'error');
        }
    }

    async takeFacialPhoto() {
        try {
            const video = document.getElementById('facial-video');
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0);
            
            const imageData = canvas.toDataURL('image/jpeg', 0.8);
            
            this.showStatus('Procesando reconocimiento facial...', 'info');
            
            const response = await fetch(`${this.apiBaseUrl}/access/validate-facial`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify({
                    faceImage: imageData,
                    timestamp: new Date().toISOString(),
                    method: 'facial'
                })
            });

            const result = await response.json();
            
            if (result.success) {
                this.showStatus('✅ Reconocimiento facial exitoso', 'success');
                this.updateMultimodalValidation('facial', true);
                await this.loadRecentAccess();
            } else {
                this.showStatus('❌ No se pudo reconocer el rostro', 'error');
            }

        } catch (error) {
            console.error('Error en reconocimiento facial:', error);
            this.showStatus('Error procesando imagen facial', 'error');
        }
    }

    // Sistema de Documento ID
    prepareDocumentForm() {
        this.showStatus('Complete los datos de su documento de identificación', 'info');
        
        // Auto-focus en el primer campo
        setTimeout(() => {
            document.getElementById('documentType').focus();
        }, 100);
    }

    async processDocumentAccess(event) {
        event.preventDefault();
        
        const documentType = document.getElementById('documentType').value;
        const documentNumber = document.getElementById('documentNumber').value;
        const building = document.getElementById('building').value;

        if (!documentType || !documentNumber || !building) {
            this.showStatus('Por favor complete todos los campos', 'error');
            return;
        }

        try {
            this.showStatus('Validando documento...', 'info');
            
            const response = await fetch(`${this.apiBaseUrl}/access/validate-document`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify({
                    documentType,
                    documentNumber,
                    building,
                    timestamp: new Date().toISOString(),
                    method: 'document'
                })
            });

            const result = await response.json();
            
            if (result.success) {
                this.showStatus('✅ Acceso autorizado por documento', 'success');
                this.updateMultimodalValidation('document', true);
                await this.loadRecentAccess();
                
                // Limpiar formulario
                event.target.reset();
            } else {
                this.showStatus('❌ Documento no autorizado: ' + result.message, 'error');
            }

        } catch (error) {
            console.error('Error validando documento:', error);
            this.showStatus('Error en la validación del documento', 'error');
        }
    }

    // Sistema Multimodal
    prepareMultimodalValidation() {
        this.resetMultimodalValidations();
        this.showStatus('Complete al menos 2 métodos de validación para acceso de alta seguridad', 'info');
    }

    updateMultimodalValidation(method, isValid) {
        this.multimodalValidations[method] = isValid;
        
        const checkbox = document.getElementById(`${method}-validation`);
        if (checkbox) {
            checkbox.checked = isValid;
            checkbox.disabled = isValid;
        }
        
        this.updateMultimodalStatus();
    }

    updateMultimodalStatus() {
        const validations = Object.values(this.multimodalValidations);
        const validCount = validations.filter(v => v).length;
        const submitButton = document.getElementById('multimodal-submit');
        
        if (validCount >= 2) {
            submitButton.disabled = false;
            submitButton.classList.remove('btn-secondary');
            submitButton.classList.add('btn-success');
            this.showStatus(`✅ ${validCount}/3 validaciones completadas - Listo para acceso`, 'success');
        } else {
            submitButton.disabled = true;
            submitButton.classList.remove('btn-success');
            submitButton.classList.add('btn-secondary');
            this.showStatus(`${validCount}/3 validaciones completadas - Se requieren al menos 2`, 'info');
        }
    }

    async processMultimodalAccess() {
        try {
            const validations = Object.entries(this.multimodalValidations)
                .filter(([method, isValid]) => isValid)
                .map(([method]) => method);

            this.showStatus('Procesando acceso multimodal...', 'info');
            
            const response = await fetch(`${this.apiBaseUrl}/access/validate-multimodal`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify({
                    validations,
                    timestamp: new Date().toISOString(),
                    method: 'multimodal'
                })
            });

            const result = await response.json();
            
            if (result.success) {
                this.showStatus('🔒 Acceso de alta seguridad concedido', 'success');
                await this.loadRecentAccess();
                this.resetMultimodalValidations();
            } else {
                this.showStatus('❌ Error en validación multimodal', 'error');
            }

        } catch (error) {
            console.error('Error en validación multimodal:', error);
            this.showStatus('Error procesando validación múltiple', 'error');
        }
    }

    resetMultimodalValidations() {
        this.multimodalValidations = { qr: false, facial: false, document: false };
        
        document.querySelectorAll('#qr-validation, #facial-validation, #document-validation').forEach(checkbox => {
            checkbox.checked = false;
            checkbox.disabled = false;
        });
        
        this.updateMultimodalStatus();
    }

    // Gestión de Estado y UI
    showStatus(message, type = 'info') {
        const statusDiv = document.getElementById('statusMessage');
        statusDiv.className = `status-message status-${type}`;
        
        const icons = {
            success: 'check_circle',
            error: 'error',
            info: 'info'
        };
        
        statusDiv.innerHTML = `
            <span class="material-icons">${icons[type]}</span>
            ${message}
        `;
        
        statusDiv.classList.remove('hidden');
        
        // Auto-ocultar después de 5 segundos para mensajes de éxito
        if (type === 'success') {
            setTimeout(() => {
                this.clearStatus();
            }, 5000);
        }
    }

    clearStatus() {
        document.getElementById('statusMessage').classList.add('hidden');
    }

    // Historial de Accesos
    async loadRecentAccess() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/access/recent?limit=10`, {
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`
                }
            });

            if (!response.ok) {
                throw new Error('Error cargando historial');
            }

            const result = await response.json();
            this.renderAccessHistory(result.data || []);

        } catch (error) {
            console.error('Error cargando historial:', error);
            document.getElementById('access-history-list').innerHTML = `
                <div class="status-message status-error">
                    <span class="material-icons">error</span>
                    Error cargando historial de accesos
                </div>
            `;
        }
    }

    renderAccessHistory(accesses) {
        const container = document.getElementById('access-history-list');
        
        if (!accesses.length) {
            container.innerHTML = `
                <div class="status-message status-info">
                    <span class="material-icons">info</span>
                    No hay accesos recientes
                </div>
            `;
            return;
        }

        container.innerHTML = accesses.map(access => {
            const time = new Date(access.timestamp || access.fecha).toLocaleString('es-ES');
            const userName = access.userName || access.usuario || 'Usuario';
            const building = access.building || access.edificio || 'N/A';
            const method = access.method || access.metodo || 'N/A';
            const status = access.status || access.estado || 'unknown';
            
            return `
                <div class="history-item">
                    <div class="history-info">
                        <div class="history-avatar">
                            ${userName.charAt(0).toUpperCase()}
                        </div>
                        <div class="history-details">
                            <h4>${userName}</h4>
                            <p>${building} • ${method} • ${time}</p>
                        </div>
                    </div>
                    <div class="status-badge status-${status === 'exitoso' || status === 'granted' ? 'granted' : 'denied'}">
                        ${status === 'exitoso' || status === 'granted' ? 'Concedido' : 'Denegado'}
                    </div>
                </div>
            `;
        }).join('');
    }

    // Utilidades
    getAuthToken() {
        return localStorage.getItem('authToken') || localStorage.getItem('uniontech_token') || 'demo-token';
    }

    async refreshData() {
        const button = document.querySelector('.floating-action');
        const originalIcon = button.innerHTML;
        
        button.innerHTML = '<div class="loading"></div>';
        
        try {
            await this.loadRecentAccess();
            this.showStatus('Datos actualizados', 'success');
        } catch (error) {
            this.showStatus('Error actualizando datos', 'error');
        } finally {
            setTimeout(() => {
                button.innerHTML = originalIcon;
            }, 1000);
        }
    }

    // Cleanup al salir
    cleanup() {
        if (this.qrScanner) {
            this.stopQRScanner();
        }
        
        if (this.facialStream) {
            this.facialStream.getTracks().forEach(track => track.stop());
        }
    }
}

// Funciones globales para HTML
function selectMethod(method) {
    if (window.accessSystem) {
        window.accessSystem.selectMethod(method);
    }
}

function startQRScanner() {
    if (window.accessSystem) {
        window.accessSystem.startQRScanner();
    }
}

function stopQRScanner() {
    if (window.accessSystem) {
        window.accessSystem.stopQRScanner();
    }
}

function startFacialRecognition() {
    if (window.accessSystem) {
        window.accessSystem.startFacialRecognition();
    }
}

function takeFacialPhoto() {
    if (window.accessSystem) {
        window.accessSystem.takeFacialPhoto();
    }
}

function processDocumentAccess(event) {
    if (window.accessSystem) {
        window.accessSystem.processDocumentAccess(event);
    }
}

function processMultimodalAccess() {
    if (window.accessSystem) {
        window.accessSystem.processMultimodalAccess();
    }
}

function refreshData() {
    if (window.accessSystem) {
        window.accessSystem.refreshData();
    }
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    window.accessSystem = new AccessRegistrationSystem();
});

// Cleanup al cerrar
window.addEventListener('beforeunload', () => {
    if (window.accessSystem) {
        window.accessSystem.cleanup();
    }
});
