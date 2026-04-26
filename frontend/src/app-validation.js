// Extensión para funciones de validación multimodal
class ValidationExtension {
    constructor(app) {
        this.app = app;
    }

    // =================== VALIDACIÓN MULTIMODAL ===================
    
    showValidationPage() {
        const content = `
            <div class="container-fluid">
                <div class="row">
                    <div class="col-12">
                        <h2><i class="fas fa-shield-alt me-2"></i>Validación Multimodal</h2>
                        <p class="text-muted">Sistema avanzado de validación por QR, reconocimiento facial y documentos</p>
                    </div>
                </div>

                <div class="row mt-4">
                    <!-- Validación QR -->
                    <div class="col-md-4">
                        <div class="card h-100">
                            <div class="card-header bg-primary text-white">
                                <h5><i class="fas fa-qrcode me-2"></i>Validación QR</h5>
                            </div>
                            <div class="card-body">
                                <div class="mb-3">
                                    <label for="qr-persona-id" class="form-label">ID Persona</label>
                                    <input type="text" class="form-control" id="qr-persona-id" placeholder="12345">
                                </div>
                                <div class="mb-3">
                                    <label for="qr-edificio-id" class="form-label">ID Edificio</label>
                                    <select class="form-control" id="qr-edificio-id">
                                        <option value="1">Torre Central</option>
                                        <option value="2">Edificio Norte</option>
                                        <option value="3">Edificio Sur</option>
                                    </select>
                                </div>
                                <button class="btn btn-primary w-100 mb-2" onclick="app.validation.generateQRCode()">
                                    <i class="fas fa-qrcode me-1"></i>Generar QR
                                </button>
                                <button class="btn btn-success w-100" onclick="app.validation.validateQRCode()">
                                    <i class="fas fa-check me-1"></i>Validar QR
                                </button>
                                <div id="qr-result" class="mt-3"></div>
                            </div>
                        </div>
                    </div>

                    <!-- Validación Facial -->
                    <div class="col-md-4">
                        <div class="card h-100">
                            <div class="card-header bg-success text-white">
                                <h5><i class="fas fa-user-check me-2"></i>Reconocimiento Facial</h5>
                            </div>
                            <div class="card-body">
                                <div class="mb-3">
                                    <label for="face-persona-id" class="form-label">ID Persona</label>
                                    <input type="text" class="form-control" id="face-persona-id" placeholder="12345">
                                </div>
                                <div class="mb-3">
                                    <label for="face-image" class="form-label">Imagen Facial</label>
                                    <input type="file" class="form-control" id="face-image" accept="image/*">
                                </div>
                                <div class="mb-3">
                                    <video id="face-video" width="100%" height="200" style="display:none;"></video>
                                    <canvas id="face-canvas" width="300" height="200" style="display:none;"></canvas>
                                    <div id="face-preview" class="border rounded p-3 text-center text-muted">
                                        <i class="fas fa-camera fa-3x mb-2"></i><br>
                                        Vista previa de imagen
                                    </div>
                                </div>
                                <button class="btn btn-info w-100 mb-2" onclick="app.validation.captureFromCamera()">
                                    <i class="fas fa-camera me-1"></i>Capturar Cámara
                                </button>
                                <button class="btn btn-success w-100" onclick="app.validation.validateFace()">
                                    <i class="fas fa-user-check me-1"></i>Validar Rostro
                                </button>
                                <div id="face-result" class="mt-3"></div>
                            </div>
                        </div>
                    </div>

                    <!-- Validación Documentos -->
                    <div class="col-md-4">
                        <div class="card h-100">
                            <div class="card-header bg-warning text-white">
                                <h5><i class="fas fa-id-card me-2"></i>Validación Documentos</h5>
                            </div>
                            <div class="card-body">
                                <div class="mb-3">
                                    <label for="doc-persona-id" class="form-label">ID Persona</label>
                                    <input type="text" class="form-control" id="doc-persona-id" placeholder="12345">
                                </div>
                                <div class="mb-3">
                                    <label for="doc-type" class="form-label">Tipo Documento</label>
                                    <select class="form-control" id="doc-type">
                                        <option value="cedula">Cédula</option>
                                        <option value="pasaporte">Pasaporte</option>
                                        <option value="licencia">Licencia</option>
                                        <option value="carnet_empresarial">Carnet Empresarial</option>
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label for="doc-image" class="form-label">Imagen Documento</label>
                                    <input type="file" class="form-control" id="doc-image" accept="image/*">
                                </div>
                                <div class="mb-3">
                                    <div id="doc-preview" class="border rounded p-3 text-center text-muted">
                                        <i class="fas fa-file-image fa-3x mb-2"></i><br>
                                        Vista previa del documento
                                    </div>
                                </div>
                                <button class="btn btn-warning w-100" onclick="app.validation.validateDocument()">
                                    <i class="fas fa-file-alt me-1"></i>Validar Documento
                                </button>
                                <div id="doc-result" class="mt-3"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Validación Combinada -->
                <div class="row mt-4">
                    <div class="col-12">
                        <div class="card">
                            <div class="card-header bg-dark text-white">
                                <h5><i class="fas fa-shield-alt me-2"></i>Validación Multimodal Combinada</h5>
                            </div>
                            <div class="card-body">
                                <div class="row">
                                    <div class="col-md-3">
                                        <div class="mb-3">
                                            <label for="multi-persona-id" class="form-label">ID Persona</label>
                                            <input type="text" class="form-control" id="multi-persona-id" placeholder="12345">
                                        </div>
                                    </div>
                                    <div class="col-md-3">
                                        <div class="mb-3">
                                            <label for="multi-qr-code" class="form-label">Código QR (opcional)</label>
                                            <input type="text" class="form-control" id="multi-qr-code" placeholder="Código QR">
                                        </div>
                                    </div>
                                    <div class="col-md-3">
                                        <div class="mb-3">
                                            <label for="multi-face-image" class="form-label">Imagen Facial (opcional)</label>
                                            <input type="file" class="form-control" id="multi-face-image" accept="image/*">
                                        </div>
                                    </div>
                                    <div class="col-md-3">
                                        <div class="mb-3">
                                            <label for="multi-doc-image" class="form-label">Documento (opcional)</label>
                                            <input type="file" class="form-control" id="multi-doc-image" accept="image/*">
                                        </div>
                                    </div>
                                </div>
                                <div class="text-center">
                                    <button class="btn btn-dark btn-lg" onclick="app.validation.validateMultiModal()">
                                        <i class="fas fa-shield-alt me-2"></i>Ejecutar Validación Multimodal
                                    </button>
                                </div>
                                <div id="multi-result" class="mt-4"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Log de Validaciones -->
                <div class="row mt-4">
                    <div class="col-12">
                        <div class="card">
                            <div class="card-header">
                                <h5><i class="fas fa-history me-2"></i>Log de Validaciones</h5>
                            </div>
                            <div class="card-body">
                                <div id="validation-log" class="table-responsive">
                                    <p class="text-muted">No hay validaciones registradas</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('main-content').innerHTML = content;
        this.setupValidationEventListeners();
        this.displayValidationLogs();
    }

    setupValidationEventListeners() {
        // Configurar previsualizaciones de imágenes
        const faceImageInput = document.getElementById('face-image');
        const docImageInput = document.getElementById('doc-image');

        if (faceImageInput) {
            faceImageInput.addEventListener('change', (e) => this.previewImage(e, 'face-preview'));
        }
        if (docImageInput) {
            docImageInput.addEventListener('change', (e) => this.previewImage(e, 'doc-preview'));
        }
    }

    previewImage(event, previewElementId) {
        const file = event.target.files[0];
        const preview = document.getElementById(previewElementId);
        
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                preview.innerHTML = `<img src="${e.target.result}" class="img-fluid rounded" style="max-height: 200px;">`;
            };
            reader.readAsDataURL(file);
        }
    }

    async generateQRCode() {
        const personaId = document.getElementById('qr-persona-id').value;
        const edificioId = document.getElementById('qr-edificio-id').value;
        const resultDiv = document.getElementById('qr-result');

        if (!personaId) {
            this.app.showAlert('ID de persona requerido', 'warning');
            return;
        }

        try {
            const response = await fetch(`${this.app.apiBaseUrl}/validation/generate-qr`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('uniontech_token')}`
                },
                body: JSON.stringify({ personaId, edificioId })
            });

            const data = await response.json();

            if (data.success) {
                resultDiv.innerHTML = `
                    <div class="alert alert-success">
                        <h6>QR Generado Exitosamente</h6>
                        <div class="text-center mt-3">
                            <img src="${data.data.qrCode}" class="img-fluid" style="max-width: 200px;">
                        </div>
                        <small class="text-muted">
                            <strong>ID:</strong> ${data.data.qrId}<br>
                            <strong>Expira:</strong> ${new Date(data.data.expiresAt).toLocaleString()}<br>
                            <strong>Tipo:</strong> ${data.data.qrType}
                        </small>
                    </div>
                `;
                this.addToValidationLog('QR Generado', 'success', data);
            } else {
                throw new Error(data.error || 'Error generando QR');
            }
        } catch (error) {
            resultDiv.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
            this.addToValidationLog('Error QR', 'error', { error: error.message });
        }
    }

    async validateQRCode() {
        const qrCode = prompt('Ingrese el código QR a validar:');
        const edificioId = document.getElementById('qr-edificio-id').value;
        const resultDiv = document.getElementById('qr-result');

        if (!qrCode) return;

        try {
            const response = await fetch(`${this.app.apiBaseUrl}/validation/qr`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('uniontech_token')}`
                },
                body: JSON.stringify({ qrData: qrCode, edificioId })
            });

            const data = await response.json();

            if (data.success) {
                resultDiv.innerHTML = `
                    <div class="alert alert-success">
                        <h6>✅ QR Válido</h6>
                        <strong>Persona ID:</strong> ${data.data.personaId}<br>
                        <strong>Edificio ID:</strong> ${data.data.edificioId}<br>
                        <strong>Válido hasta:</strong> ${new Date(data.data.validUntil).toLocaleString()}
                    </div>
                `;
                this.addToValidationLog('QR Validado', 'success', data);
            } else {
                resultDiv.innerHTML = `<div class="alert alert-danger">❌ ${data.message}</div>`;
                this.addToValidationLog('QR Inválido', 'error', data);
            }
        } catch (error) {
            resultDiv.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
        }
    }

    async captureFromCamera() {
        try {
            const video = document.getElementById('face-video');
            const canvas = document.getElementById('face-canvas');
            const ctx = canvas.getContext('2d');
            
            // Obtener acceso a la cámara
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            video.srcObject = stream;
            video.style.display = 'block';
            await video.play();

            // Botón para capturar
            const captureBtn = document.createElement('button');
            captureBtn.className = 'btn btn-primary mt-2';
            captureBtn.innerHTML = '<i class="fas fa-camera"></i> Capturar';
            captureBtn.onclick = () => {
                // Capturar frame
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const imageData = canvas.toDataURL('image/jpeg');
                
                // Mostrar preview
                document.getElementById('face-preview').innerHTML = 
                    `<img src="${imageData}" class="img-fluid rounded" style="max-height: 200px;">`;
                
                // Detener stream
                stream.getTracks().forEach(track => track.stop());
                video.style.display = 'none';
                captureBtn.remove();
                
                // Simular archivo para validación
                this.capturedFaceData = imageData;
            };
            
            video.parentNode.appendChild(captureBtn);
            
        } catch (error) {
            this.app.showAlert('Error accediendo a la cámara: ' + error.message, 'danger');
        }
    }

    async validateFace() {
        const personaId = document.getElementById('face-persona-id').value;
        const fileInput = document.getElementById('face-image');
        const resultDiv = document.getElementById('face-result');

        if (!personaId) {
            this.app.showAlert('ID de persona requerido', 'warning');
            return;
        }

        let faceImageData = this.capturedFaceData;
        
        if (!faceImageData && fileInput.files[0]) {
            faceImageData = await this.fileToBase64(fileInput.files[0]);
        }

        if (!faceImageData) {
            this.app.showAlert('Imagen facial requerida', 'warning');
            return;
        }

        try {
            // Simular validación facial
            const isValid = Math.random() > 0.2; // 80% éxito
            const confidence = Math.random() * 0.3 + 0.7;

            if (isValid) {
                resultDiv.innerHTML = `
                    <div class="alert alert-success">
                        <h6>✅ Rostro Reconocido</h6>
                        <strong>Confianza:</strong> ${(confidence * 100).toFixed(1)}%<br>
                        <strong>Persona ID:</strong> ${personaId}
                    </div>
                `;
                this.addToValidationLog('Facial Validado', 'success', { personaId, confidence });
            } else {
                resultDiv.innerHTML = `
                    <div class="alert alert-danger">
                        <h6>❌ Rostro No Reconocido</h6>
                        <strong>Confianza:</strong> ${(confidence * 100).toFixed(1)}%<br>
                        <strong>Umbral mínimo:</strong> 85%
                    </div>
                `;
                this.addToValidationLog('Facial Rechazado', 'error', { personaId, confidence });
            }
        } catch (error) {
            resultDiv.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
        }
    }

    async validateDocument() {
        const personaId = document.getElementById('doc-persona-id').value;
        const documentType = document.getElementById('doc-type').value;
        const fileInput = document.getElementById('doc-image');
        const resultDiv = document.getElementById('doc-result');

        if (!personaId || !fileInput.files[0]) {
            this.app.showAlert('ID de persona e imagen del documento requeridos', 'warning');
            return;
        }

        try {
            // Simular validación de documento
            const isValid = Math.random() > 0.1; // 90% éxito
            const confidence = Math.random() * 0.2 + 0.8;

            if (isValid) {
                resultDiv.innerHTML = `
                    <div class="alert alert-success">
                        <h6>✅ Documento Válido</h6>
                        <strong>Tipo:</strong> ${documentType}<br>
                        <strong>Confianza:</strong> ${(confidence * 100).toFixed(1)}%<br>
                        <strong>Número:</strong> 1234567890<br>
                        <strong>Nombre:</strong> Juan Pérez
                    </div>
                `;
                this.addToValidationLog('Documento Validado', 'success', { personaId, documentType, confidence });
            } else {
                resultDiv.innerHTML = `
                    <div class="alert alert-danger">
                        <h6>❌ Documento Inválido</h6>
                        <strong>Tipo:</strong> ${documentType}<br>
                        <strong>Razón:</strong> No se pudo procesar
                    </div>
                `;
                this.addToValidationLog('Documento Rechazado', 'error', { personaId, documentType });
            }
        } catch (error) {
            resultDiv.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
        }
    }

    async validateMultiModal() {
        const personaId = document.getElementById('multi-persona-id').value;
        const qrCode = document.getElementById('multi-qr-code').value;
        const faceInput = document.getElementById('multi-face-image');
        const docInput = document.getElementById('multi-doc-image');
        const resultDiv = document.getElementById('multi-result');

        if (!personaId) {
            this.app.showAlert('ID de persona requerido', 'warning');
            return;
        }

        try {
            const validations = [];
            let successCount = 0;

            // Validar QR si está presente
            if (qrCode) {
                const qrValid = Math.random() > 0.2;
                validations.push({
                    method: 'QR',
                    valid: qrValid,
                    confidence: qrValid ? 1.0 : 0.0
                });
                if (qrValid) successCount++;
            }

            // Validar rostro si está presente
            if (faceInput.files[0]) {
                const faceValid = Math.random() > 0.2;
                const confidence = Math.random() * 0.3 + 0.7;
                validations.push({
                    method: 'Facial',
                    valid: faceValid,
                    confidence: confidence
                });
                if (faceValid) successCount++;
            }

            // Validar documento si está presente
            if (docInput.files[0]) {
                const docValid = Math.random() > 0.1;
                const confidence = Math.random() * 0.2 + 0.8;
                validations.push({
                    method: 'Documento',
                    valid: docValid,
                    confidence: confidence
                });
                if (docValid) successCount++;
            }

            const successRate = successCount / validations.length;
            const overallValid = successRate >= 0.6;

            let securityLevel = 'Denegado';
            if (successCount === 3) securityLevel = 'Máximo';
            else if (successCount === 2) securityLevel = 'Alto';
            else if (successCount === 1) securityLevel = 'Estándar';

            const alertClass = overallValid ? 'alert-success' : 'alert-danger';
            const icon = overallValid ? '✅' : '❌';

            resultDiv.innerHTML = `
                <div class="alert ${alertClass}">
                    <h5>${icon} Validación Multimodal ${overallValid ? 'Exitosa' : 'Fallida'}</h5>
                    <div class="row">
                        <div class="col-md-6">
                            <strong>Nivel de Seguridad:</strong> ${securityLevel}<br>
                            <strong>Métodos Usados:</strong> ${validations.length}<br>
                            <strong>Métodos Exitosos:</strong> ${successCount}<br>
                            <strong>Tasa de Éxito:</strong> ${(successRate * 100).toFixed(1)}%
                        </div>
                        <div class="col-md-6">
                            <strong>Resultados por Método:</strong><br>
                            ${validations.map(v => 
                                `${v.method}: ${v.valid ? '✅' : '❌'} (${(v.confidence * 100).toFixed(1)}%)`
                            ).join('<br>')}
                        </div>
                    </div>
                </div>
            `;

            this.addToValidationLog('Validación Multimodal', overallValid ? 'success' : 'error', {
                personaId,
                validations,
                securityLevel,
                successRate
            });

        } catch (error) {
            resultDiv.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
        }
    }

    addToValidationLog(action, status, data) {
        const logs = JSON.parse(localStorage.getItem('validation_logs') || '[]');
        
        const logEntry = {
            timestamp: new Date().toISOString(),
            action,
            status,
            data,
            id: Date.now()
        };
        
        logs.unshift(logEntry);
        logs.splice(10); // Mantener solo últimos 10
        
        localStorage.setItem('validation_logs', JSON.stringify(logs));
        this.displayValidationLogs();
    }

    displayValidationLogs() {
        const logDiv = document.getElementById('validation-log');
        if (!logDiv) return;
        
        const logs = JSON.parse(localStorage.getItem('validation_logs') || '[]');
        
        if (logs.length === 0) {
            logDiv.innerHTML = '<p class="text-muted">No hay validaciones registradas</p>';
            return;
        }

        const table = `
            <table class="table table-striped">
                <thead>
                    <tr>
                        <th>Timestamp</th>
                        <th>Acción</th>
                        <th>Estado</th>
                        <th>Datos</th>
                    </tr>
                </thead>
                <tbody>
                    ${logs.map(log => `
                        <tr>
                            <td>${new Date(log.timestamp).toLocaleString()}</td>
                            <td>${log.action}</td>
                            <td>
                                <span class="badge bg-${log.status === 'success' ? 'success' : 'danger'}">
                                    ${log.status === 'success' ? 'Éxito' : 'Error'}
                                </span>
                            </td>
                            <td>
                                <small class="text-muted">
                                    ${JSON.stringify(log.data).substring(0, 50)}...
                                </small>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
        logDiv.innerHTML = table;
    }

    async fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }
}
