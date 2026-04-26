// UnionTech - QR Code Manager
class QRManager {
    constructor() {
        this.currentQR = null;
        this.setupEventListeners();
    }

    setupEventListeners() {
        // QR Generation Form
        document.addEventListener('submit', (e) => {
            if (e.target.id === 'qr-form') {
                e.preventDefault();
                this.handleQRGeneration();
            }
        });
    }

    async handleQRGeneration() {
        const formData = this.getQRFormData();
        
        if (!this.validateQRForm(formData)) {
            return;
        }

        try {
            // Show loading
            const submitBtn = document.querySelector('#qr-form button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<div class="loading-spinner"></div> Generando...';
            submitBtn.disabled = true;

            // Generate QR via API
            const response = await window.api.generateQR(formData);
            
            // Create QR code
            const qrData = {
                id: response.accessId,
                type: formData.accessType,
                visitor: formData.visitorName,
                building: formData.building,
                expiry: formData.expiryDate,
                created: new Date().toISOString()
            };

            await this.generateQRCode(JSON.stringify(qrData));
            
            // Show success message
            window.app.showAlert('Código QR generado exitosamente', 'success');
            
            // Reset form
            document.getElementById('qr-form').reset();
            
            // Send notification if WhatsApp number available
            if (formData.whatsappNumber) {
                await this.sendQRViaWhatsApp(formData.whatsappNumber, response.accessId);
            }

        } catch (error) {
            console.error('Error generating QR:', error);
            window.app.showAlert('Error al generar código QR', 'danger');
        } finally {
            // Restore button
            const submitBtn = document.querySelector('#qr-form button[type="submit"]');
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    getQRFormData() {
        return {
            accessType: document.getElementById('access-type')?.value,
            visitorName: document.getElementById('visitor-name')?.value,
            building: document.getElementById('building')?.value,
            expiryDate: document.getElementById('expiry-date')?.value,
            whatsappNumber: document.getElementById('whatsapp-number')?.value
        };
    }

    validateQRForm(data) {
        if (!data.visitorName) {
            window.app.showAlert('El nombre del visitante es requerido', 'warning');
            return false;
        }

        if (!data.building) {
            window.app.showAlert('Debe seleccionar un edificio', 'warning');
            return false;
        }

        if (data.expiryDate && new Date(data.expiryDate) <= new Date()) {
            window.app.showAlert('La fecha de expiración debe ser futura', 'warning');
            return false;
        }

        return true;
    }

    async generateQRCode(data, size = 200) {
        try {
            const qrContainer = document.getElementById('qr-container');
            if (!qrContainer) {
                console.error('QR container not found');
                return;
            }

            // Clear previous QR
            qrContainer.innerHTML = '';

            // Generate QR code
            const canvas = await QRCode.toCanvas(data, {
                width: size,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            });

            qrContainer.appendChild(canvas);
            this.currentQR = { data, canvas };

            // Show QR modal
            const qrModal = new bootstrap.Modal(document.getElementById('qrModal'));
            qrModal.show();

            return canvas;

        } catch (error) {
            console.error('Error generating QR code:', error);
            throw error;
        }
    }

    async generateQR() {
        // Quick QR generation for sidebar button
        const quickData = {
            type: 'quick',
            visitor: 'Visitante Rápido',
            building: '1',
            created: new Date().toISOString(),
            expiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
        };

        try {
            const response = await window.api.generateQR(quickData);
            await this.generateQRCode(JSON.stringify({
                id: response.accessId,
                ...quickData
            }));
            
            window.app.showAlert('Código QR rápido generado', 'success');
        } catch (error) {
            console.error('Error in quick QR generation:', error);
            window.app.showAlert('Error al generar QR rápido', 'danger');
        }
    }

    downloadQR() {
        if (!this.currentQR) {
            window.app.showAlert('No hay código QR para descargar', 'warning');
            return;
        }

        try {
            const link = document.createElement('a');
            link.download = `qr-uniontech-${Date.now()}.png`;
            link.href = this.currentQR.canvas.toDataURL();
            link.click();
            
            window.app.showAlert('Código QR descargado', 'success');
        } catch (error) {
            console.error('Error downloading QR:', error);
            window.app.showAlert('Error al descargar QR', 'danger');
        }
    }

    async shareQR() {
        if (!this.currentQR) {
            window.app.showAlert('No hay código QR para compartir', 'warning');
            return;
        }

        try {
            const qrDataUrl = this.currentQR.canvas.toDataURL();
            
            // Create message for WhatsApp
            const message = `🔐 *Código de Acceso UnionTech*\n\n` +
                          `Utilice este código QR para acceder al edificio.\n` +
                          `Válido hasta: ${new Date().toLocaleDateString()}\n\n` +
                          `*UnionTech Security System*`;

            // For now, just copy to clipboard
            await navigator.clipboard.writeText(message);
            window.app.showAlert('Mensaje copiado al portapapeles', 'info');
            
            // TODO: Implement actual WhatsApp sharing with image
            console.log('QR ready for sharing:', qrDataUrl);
            
        } catch (error) {
            console.error('Error sharing QR:', error);
            window.app.showAlert('Error al compartir QR', 'danger');
        }
    }

    async validateAccess() {
        const validationCode = document.getElementById('validation-code')?.value;
        
        if (!validationCode) {
            window.app.showAlert('Ingrese un código para validar', 'warning');
            return;
        }

        try {
            const result = await window.api.validateAccess(validationCode);
            
            const resultContainer = document.getElementById('validation-result');
            if (resultContainer) {
                let alertClass = result.valid ? 'success' : 'danger';
                let icon = result.valid ? 'check-circle' : 'times-circle';
                
                resultContainer.innerHTML = `
                    <div class="alert alert-${alertClass}">
                        <i class="fas fa-${icon} me-2"></i>
                        <strong>${result.valid ? 'Acceso Autorizado' : 'Acceso Denegado'}</strong>
                        <br>
                        <small>${result.message}</small>
                        ${result.visitor ? `<br><small>Visitante: ${result.visitor}</small>` : ''}
                    </div>
                `;
            }

            // Log access attempt
            console.log('Access validation:', result);
            
            // Send notification if access granted
            if (result.valid && result.anfitrionId) {
                await this.notifyAccessGranted(result.anfitrionId, result);
            }

        } catch (error) {
            console.error('Error validating access:', error);
            
            const resultContainer = document.getElementById('validation-result');
            if (resultContainer) {
                resultContainer.innerHTML = `
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        <strong>Error de Validación</strong>
                        <br>
                        <small>No se pudo validar el código</small>
                    </div>
                `;
            }
        }
    }

    async sendQRViaWhatsApp(phone, accessId) {
        try {
            const message = `🔐 *Código de Acceso UnionTech*\n\n` +
                          `Su código de acceso está listo.\n` +
                          `ID: ${accessId}\n\n` +
                          `Presente este código al llegar al edificio.\n\n` +
                          `*UnionTech Security System*`;

            await window.api.sendWhatsApp(phone, message);
            window.app.showAlert('Código enviado por WhatsApp', 'success');
            
        } catch (error) {
            console.error('Error sending QR via WhatsApp:', error);
            window.app.showAlert('Error al enviar por WhatsApp', 'warning');
        }
    }

    async notifyAccessGranted(anfitrionId, accessData) {
        try {
            await window.api.sendAccessNotification(anfitrionId, accessData);
            console.log('Access notification sent to host');
        } catch (error) {
            console.error('Error sending access notification:', error);
        }
    }

    async loadActiveQRs() {
        try {
            const qrs = await window.api.getActiveQRs();
            return this.renderActiveQRsTable(qrs);
        } catch (error) {
            console.error('Error loading active QRs:', error);
            return '<div class="alert alert-warning">Error cargando códigos activos</div>';
        }
    }

    renderActiveQRsTable(qrs) {
        if (!qrs || qrs.length === 0) {
            return '<div class="alert alert-info">No hay códigos QR activos</div>';
        }

        const rows = qrs.map(qr => `
            <tr>
                <td>${qr.id}</td>
                <td>${qr.visitor}</td>
                <td>${qr.building}</td>
                <td>${new Date(qr.created).toLocaleString()}</td>
                <td>${qr.expiry ? new Date(qr.expiry).toLocaleString() : 'Sin expiración'}</td>
                <td>
                    <span class="badge bg-${qr.status === 'active' ? 'success' : 'warning'}">
                        ${qr.status === 'active' ? 'Activo' : 'Usado'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="qrManager.regenerateQR('${qr.id}')">
                        <i class="fas fa-redo me-1"></i>Regenerar
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="qrManager.revokeQR('${qr.id}')">
                        <i class="fas fa-ban me-1"></i>Revocar
                    </button>
                </td>
            </tr>
        `).join('');

        return `
            <div class="table-responsive">
                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Visitante</th>
                            <th>Edificio</th>
                            <th>Creado</th>
                            <th>Expira</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
            </div>
        `;
    }

    async revokeQR(qrId) {
        if (!confirm('¿Está seguro de revocar este código QR?')) {
            return;
        }

        try {
            await window.api.request(`/access/revoke/${qrId}`, { method: 'POST' });
            window.app.showAlert('Código QR revocado', 'success');
            
            // Reload active QRs if we're on that page
            if (window.app.currentPage === 'access-control') {
                const container = document.getElementById('active-qrs');
                if (container) {
                    container.innerHTML = await this.loadActiveQRs();
                }
            }
        } catch (error) {
            console.error('Error revoking QR:', error);
            window.app.showAlert('Error al revocar código QR', 'danger');
        }
    }
}

// Global functions
function downloadQR() {
    if (window.qrManager) {
        window.qrManager.downloadQR();
    }
}

function shareQR() {
    if (window.qrManager) {
        window.qrManager.shareQR();
    }
}

function validateAccess() {
    if (window.qrManager) {
        window.qrManager.validateAccess();
    }
}

// Initialize QR Manager
document.addEventListener('DOMContentLoaded', () => {
    window.qrManager = new QRManager();
});
