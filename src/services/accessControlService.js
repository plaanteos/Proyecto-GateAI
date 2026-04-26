const fs = require('fs').promises;
const path = require('path');
const QRCode = require('qrcode');
const crypto = require('crypto');

/**
 * HU4 - Servicio completo de registro y gestión de accesos
 * Incluye generación de QR, validación de accesos, histórico y estadísticas
 */
class AccessControlService {
    constructor() {
        this.accessRecordsFile = path.join(__dirname, '../../data/access-records.json');
        this.qrCodesFile = path.join(__dirname, '../../data/qr-codes.json');
        this.visitorsFile = path.join(__dirname, '../../data/visitors.json');
        this.buildingsFile = path.join(__dirname, '../../data/buildings.json');
        
        this.accessRecords = new Map();
        this.qrCodes = new Map();
        this.visitors = new Map();
        this.buildings = new Map();
        
        this.initializeService();
    }

    async initializeService() {
        try {
            await this.ensureDataDirectory();
            await this.loadData();
            await this.initializeBuildings();
            await this.initializeSampleData();
            
            // Limpiar QR codes expirados cada hora
            setInterval(() => this.cleanupExpiredQRCodes(), 60 * 60 * 1000);
        } catch (error) {
            console.error('Error inicializando servicio de control de acceso:', error);
        }
    }

    async ensureDataDirectory() {
        const dataDir = path.dirname(this.accessRecordsFile);
        try {
            await fs.mkdir(dataDir, { recursive: true });
        } catch (error) {
            if (error.code !== 'EEXIST') {
                throw error;
            }
        }
    }

    // =====================================
    // GESTIÓN DE VISITANTES
    // =====================================

    async registerVisitor(visitorData, registeredBy) {
        try {
            const visitorId = this.generateVisitorId();
            
            const visitor = {
                id: visitorId,
                firstName: visitorData.firstName,
                lastName: visitorData.lastName,
                document: visitorData.document,
                documentType: visitorData.documentType || 'DNI',
                email: visitorData.email,
                phone: visitorData.phone,
                company: visitorData.company || null,
                purpose: visitorData.purpose || 'Visita',
                photo: visitorData.photo || null,
                emergencyContact: visitorData.emergencyContact || null,
                notes: visitorData.notes || null,
                registeredBy: registeredBy.id,
                registeredAt: new Date(),
                active: true,
                visits: []
            };

            this.visitors.set(visitorId, visitor);
            await this.saveVisitors();

            return {
                success: true,
                visitor: visitor,
                message: 'Visitante registrado exitosamente'
            };

        } catch (error) {
            throw error;
        }
    }

    async updateVisitor(visitorId, updateData, updatedBy) {
        try {
            const visitor = this.visitors.get(visitorId);
            if (!visitor) {
                throw new Error('Visitante no encontrado');
            }

            const updatedVisitor = {
                ...visitor,
                ...updateData,
                updatedBy: updatedBy.id,
                updatedAt: new Date()
            };

            this.visitors.set(visitorId, updatedVisitor);
            await this.saveVisitors();

            return {
                success: true,
                visitor: updatedVisitor,
                message: 'Visitante actualizado exitosamente'
            };

        } catch (error) {
            throw error;
        }
    }

    // =====================================
    // GENERACIÓN DE CÓDIGOS QR
    // =====================================

    async generateQRCode(qrData, createdBy) {
        try {
            const qrId = this.generateQRId();
            const expiresAt = new Date(Date.now() + (qrData.validHours || 24) * 60 * 60 * 1000);
            
            const qrRecord = {
                id: qrId,
                visitorId: qrData.visitorId,
                building: qrData.building,
                areas: qrData.areas || ['lobby'],
                purpose: qrData.purpose || 'Visita',
                host: qrData.host || null,
                hostContact: qrData.hostContact || null,
                validFrom: new Date(),
                validUntil: expiresAt,
                maxUses: qrData.maxUses || 1,
                usedCount: 0,
                active: true,
                type: qrData.type || 'visitor', // visitor, service, delivery, etc.
                restrictions: qrData.restrictions || {},
                createdBy: createdBy.id,
                createdAt: new Date(),
                uses: []
            };

            // Generar código QR
            const qrData_string = JSON.stringify({
                id: qrId,
                v: qrRecord.visitorId,
                b: qrRecord.building,
                exp: expiresAt.getTime(),
                hash: this.generateQRHash(qrId, qrRecord.visitorId, expiresAt)
            });

            const qrCodeImage = await QRCode.toDataURL(qrData_string, {
                errorCorrectionLevel: 'H',
                type: 'image/png',
                quality: 0.92,
                margin: 1,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                },
                width: 256
            });

            qrRecord.qrCode = qrCodeImage;
            qrRecord.qrData = qrData_string;

            this.qrCodes.set(qrId, qrRecord);
            await this.saveQRCodes();

            // Agregar a visitante si existe
            if (qrRecord.visitorId) {
                const visitor = this.visitors.get(qrRecord.visitorId);
                if (visitor) {
                    visitor.visits.push({
                        qrId: qrId,
                        building: qrRecord.building,
                        purpose: qrRecord.purpose,
                        createdAt: new Date(),
                        status: 'pending'
                    });
                    await this.saveVisitors();
                }
            }

            return {
                success: true,
                qrCode: qrRecord,
                message: 'Código QR generado exitosamente'
            };

        } catch (error) {
            throw error;
        }
    }

    async validateQRCode(qrData, location = {}) {
        try {
            let qrInfo;
            
            try {
                qrInfo = JSON.parse(qrData);
            } catch (parseError) {
                throw new Error('Código QR inválido');
            }

            const qrRecord = this.qrCodes.get(qrInfo.id);
            if (!qrRecord) {
                throw new Error('Código QR no encontrado');
            }

            // Verificar hash de seguridad
            const expectedHash = this.generateQRHash(qrInfo.id, qrInfo.v, new Date(qrInfo.exp));
            if (qrInfo.hash !== expectedHash) {
                throw new Error('Código QR corrupto o inválido');
            }

            // Verificar si está activo
            if (!qrRecord.active) {
                throw new Error('Código QR desactivado');
            }

            // Verificar fecha de expiración
            if (new Date() > new Date(qrRecord.validUntil)) {
                throw new Error('Código QR expirado');
            }

            // Verificar fecha de inicio
            if (new Date() < new Date(qrRecord.validFrom)) {
                throw new Error('Código QR aún no válido');
            }

            // Verificar número máximo de usos
            if (qrRecord.usedCount >= qrRecord.maxUses) {
                throw new Error('Código QR ya utilizado el máximo de veces');
            }

            // Verificar restricciones de ubicación
            if (location.building && qrRecord.building !== location.building) {
                throw new Error('Código QR no válido para este edificio');
            }

            // Verificar restricciones de horario
            if (qrRecord.restrictions.timeRestrictions) {
                const currentTime = new Date();
                const currentHour = currentTime.getHours();
                const restrictions = qrRecord.restrictions.timeRestrictions;
                
                if (restrictions.startHour && currentHour < restrictions.startHour) {
                    throw new Error('Acceso fuera del horario permitido');
                }
                
                if (restrictions.endHour && currentHour > restrictions.endHour) {
                    throw new Error('Acceso fuera del horario permitido');
                }
            }

            return {
                valid: true,
                qrRecord: qrRecord,
                visitor: qrRecord.visitorId ? this.visitors.get(qrRecord.visitorId) : null,
                message: 'Código QR válido'
            };

        } catch (error) {
            return {
                valid: false,
                error: error.message,
                timestamp: new Date()
            };
        }
    }

    // =====================================
    // REGISTRO DE ACCESOS
    // =====================================

    async recordAccess(accessData, recordedBy) {
        try {
            const accessId = this.generateAccessId();
            
            // Validar QR si se proporciona
            let qrValidation = null;
            if (accessData.qrData) {
                qrValidation = await this.validateQRCode(accessData.qrData, {
                    building: accessData.building
                });
                
                if (!qrValidation.valid) {
                    // Registrar intento fallido
                    await this.recordFailedAccess(accessData, qrValidation.error, recordedBy);
                    throw new Error(qrValidation.error);
                }
            }

            const accessRecord = {
                id: accessId,
                type: accessData.type || 'entry', // entry, exit, area_access
                method: accessData.method || 'qr', // qr, manual, biometric, card
                status: 'granted',
                timestamp: new Date(),
                
                // Información del visitante/usuario
                visitorId: qrValidation?.visitor?.id || accessData.visitorId || null,
                userId: accessData.userId || null,
                visitorName: qrValidation?.visitor ? 
                    `${qrValidation.visitor.firstName} ${qrValidation.visitor.lastName}` : 
                    accessData.visitorName,
                document: qrValidation?.visitor?.document || accessData.document,
                
                // Información de ubicación
                building: accessData.building,
                area: accessData.area || 'main_entrance',
                floor: accessData.floor || null,
                gate: accessData.gate || 'main',
                
                // Información del QR
                qrId: qrValidation?.qrRecord?.id || null,
                qrData: accessData.qrData || null,
                
                // Información adicional
                purpose: qrValidation?.qrRecord?.purpose || accessData.purpose || 'Visita',
                host: qrValidation?.qrRecord?.host || accessData.host || null,
                company: accessData.company || null,
                temperature: accessData.temperature || null,
                notes: accessData.notes || null,
                
                // Información de registro
                recordedBy: recordedBy.id,
                recordedAt: new Date(),
                location: {
                    ip: accessData.ip || null,
                    userAgent: accessData.userAgent || null,
                    coordinates: accessData.coordinates || null
                },
                
                // Información de seguridad
                riskLevel: this.calculateRiskLevel(accessData, qrValidation),
                alerts: [],
                
                // Metadatos
                metadata: {
                    deviceId: accessData.deviceId || null,
                    gateStatus: accessData.gateStatus || 'opened',
                    duration: null, // Se calculará en el exit
                    photos: accessData.photos || []
                }
            };

            // Actualizar uso del QR
            if (qrValidation && qrValidation.qrRecord) {
                const qrRecord = qrValidation.qrRecord;
                qrRecord.usedCount++;
                qrRecord.uses.push({
                    accessId: accessId,
                    timestamp: new Date(),
                    location: accessData.area || 'main_entrance',
                    type: accessData.type || 'entry'
                });

                // Desactivar QR si llegó al máximo de usos
                if (qrRecord.usedCount >= qrRecord.maxUses) {
                    qrRecord.active = false;
                }

                await this.saveQRCodes();
            }

            // Detectar alertas de seguridad
            const alerts = await this.detectSecurityAlerts(accessRecord);
            accessRecord.alerts = alerts;

            this.accessRecords.set(accessId, accessRecord);
            await this.saveAccessRecords();

            // Registrar en el visitante
            if (accessRecord.visitorId) {
                const visitor = this.visitors.get(accessRecord.visitorId);
                if (visitor) {
                    const visit = visitor.visits.find(v => v.qrId === accessRecord.qrId);
                    if (visit) {
                        visit.status = 'completed';
                        visit.accessId = accessId;
                        visit.timestamp = new Date();
                    }
                    await this.saveVisitors();
                }
            }

            return {
                success: true,
                access: accessRecord,
                alerts: alerts,
                message: 'Acceso registrado exitosamente'
            };

        } catch (error) {
            throw error;
        }
    }

    async recordFailedAccess(accessData, reason, recordedBy) {
        try {
            const accessId = this.generateAccessId();
            
            const failedAccess = {
                id: accessId,
                type: accessData.type || 'entry',
                method: accessData.method || 'qr',
                status: 'denied',
                reason: reason,
                timestamp: new Date(),
                
                visitorName: accessData.visitorName || 'Desconocido',
                document: accessData.document || null,
                building: accessData.building,
                area: accessData.area || 'main_entrance',
                
                qrData: accessData.qrData || null,
                recordedBy: recordedBy.id,
                recordedAt: new Date(),
                
                riskLevel: 'HIGH', // Accesos fallidos siempre son de alto riesgo
                alerts: ['ACCESS_DENIED', 'INVALID_QR'],
                
                location: {
                    ip: accessData.ip || null,
                    userAgent: accessData.userAgent || null
                }
            };

            this.accessRecords.set(accessId, failedAccess);
            await this.saveAccessRecords();

            return failedAccess;

        } catch (error) {
            console.error('Error registrando acceso fallido:', error);
        }
    }

    // =====================================
    // CONSULTAS Y REPORTES
    // =====================================

    async getAccessHistory(filters = {}) {
        try {
            let records = Array.from(this.accessRecords.values());

            // Aplicar filtros
            if (filters.startDate) {
                const startDate = new Date(filters.startDate);
                records = records.filter(record => new Date(record.timestamp) >= startDate);
            }

            if (filters.endDate) {
                const endDate = new Date(filters.endDate);
                records = records.filter(record => new Date(record.timestamp) <= endDate);
            }

            if (filters.building) {
                records = records.filter(record => record.building === filters.building);
            }

            if (filters.area) {
                records = records.filter(record => record.area === filters.area);
            }

            if (filters.status) {
                records = records.filter(record => record.status === filters.status);
            }

            if (filters.type) {
                records = records.filter(record => record.type === filters.type);
            }

            if (filters.visitorId) {
                records = records.filter(record => record.visitorId === filters.visitorId);
            }

            if (filters.search) {
                const searchTerm = filters.search.toLowerCase();
                records = records.filter(record => 
                    record.visitorName?.toLowerCase().includes(searchTerm) ||
                    record.document?.toLowerCase().includes(searchTerm) ||
                    record.company?.toLowerCase().includes(searchTerm) ||
                    record.purpose?.toLowerCase().includes(searchTerm)
                );
            }

            // Ordenar por fecha
            records.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

            // Paginación
            const page = filters.page || 1;
            const limit = Math.min(filters.limit || 50, 1000);
            const offset = (page - 1) * limit;

            const total = records.length;
            const paginatedRecords = records.slice(offset, offset + limit);

            return {
                success: true,
                records: paginatedRecords,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            };

        } catch (error) {
            throw error;
        }
    }

    async getAccessStatistics(filters = {}) {
        try {
            const records = Array.from(this.accessRecords.values());
            const now = new Date();
            
            // Filtrar por fecha si se especifica
            let filteredRecords = records;
            if (filters.startDate || filters.endDate) {
                const startDate = filters.startDate ? new Date(filters.startDate) : new Date(0);
                const endDate = filters.endDate ? new Date(filters.endDate) : now;
                
                filteredRecords = records.filter(record => {
                    const recordDate = new Date(record.timestamp);
                    return recordDate >= startDate && recordDate <= endDate;
                });
            }

            // Estadísticas básicas
            const totalAccesses = filteredRecords.length;
            const grantedAccesses = filteredRecords.filter(r => r.status === 'granted').length;
            const deniedAccesses = filteredRecords.filter(r => r.status === 'denied').length;
            const uniqueVisitors = new Set(filteredRecords.map(r => r.visitorId)).size;

            // Por método de acceso
            const methodStats = {};
            filteredRecords.forEach(record => {
                methodStats[record.method] = (methodStats[record.method] || 0) + 1;
            });

            // Por edificio
            const buildingStats = {};
            filteredRecords.forEach(record => {
                buildingStats[record.building] = (buildingStats[record.building] || 0) + 1;
            });

            // Por horario (horas del día)
            const hourlyStats = Array(24).fill(0);
            filteredRecords.forEach(record => {
                const hour = new Date(record.timestamp).getHours();
                hourlyStats[hour]++;
            });

            // Por día de la semana
            const weeklyStats = Array(7).fill(0);
            filteredRecords.forEach(record => {
                const day = new Date(record.timestamp).getDay();
                weeklyStats[day]++;
            });

            // Tendencia mensual (últimos 12 meses)
            const monthlyStats = [];
            for (let i = 11; i >= 0; i--) {
                const date = new Date();
                date.setMonth(date.getMonth() - i);
                const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
                const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
                
                const monthRecords = records.filter(record => {
                    const recordDate = new Date(record.timestamp);
                    return recordDate >= monthStart && recordDate <= monthEnd;
                });

                monthlyStats.push({
                    month: date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' }),
                    total: monthRecords.length,
                    granted: monthRecords.filter(r => r.status === 'granted').length,
                    denied: monthRecords.filter(r => r.status === 'denied').length
                });
            }

            // Alertas de seguridad
            const securityAlerts = filteredRecords.filter(record => 
                record.alerts && record.alerts.length > 0
            ).length;

            return {
                success: true,
                statistics: {
                    summary: {
                        totalAccesses,
                        grantedAccesses,
                        deniedAccesses,
                        successRate: totalAccesses > 0 ? ((grantedAccesses / totalAccesses) * 100).toFixed(2) : 0,
                        uniqueVisitors,
                        securityAlerts
                    },
                    byMethod: methodStats,
                    byBuilding: buildingStats,
                    hourlyDistribution: hourlyStats,
                    weeklyDistribution: weeklyStats,
                    monthlyTrend: monthlyStats,
                    period: {
                        startDate: filters.startDate || 'N/A',
                        endDate: filters.endDate || 'N/A',
                        totalDays: filters.startDate && filters.endDate ? 
                            Math.ceil((new Date(filters.endDate) - new Date(filters.startDate)) / (1000 * 60 * 60 * 24)) : 
                            'N/A'
                    }
                }
            };

        } catch (error) {
            throw error;
        }
    }

    // =====================================
    // UTILIDADES Y HELPERS
    // =====================================

    generateAccessId() {
        return 'ACC_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8).toUpperCase();
    }

    generateQRId() {
        return 'QR_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6).toUpperCase();
    }

    generateVisitorId() {
        return 'VIS_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8).toUpperCase();
    }

    generateQRHash(qrId, visitorId, expiresAt) {
        const data = `${qrId}-${visitorId}-${expiresAt.getTime()}`;
        return crypto.createHash('sha256').update(data).digest('hex').substr(0, 16);
    }

    calculateRiskLevel(accessData, qrValidation) {
        let riskScore = 0;
        
        // Factores de riesgo
        if (!qrValidation || !qrValidation.valid) riskScore += 50;
        if (accessData.method === 'manual') riskScore += 20;
        if (!accessData.host) riskScore += 10;
        if (accessData.type === 'area_access') riskScore += 15;
        
        // Horario fuera de oficina
        const hour = new Date().getHours();
        if (hour < 7 || hour > 22) riskScore += 25;
        
        if (riskScore >= 70) return 'HIGH';
        if (riskScore >= 40) return 'MEDIUM';
        return 'LOW';
    }

    async detectSecurityAlerts(accessRecord) {
        const alerts = [];
        
        // Múltiples accesos en poco tiempo
        const recentAccesses = Array.from(this.accessRecords.values())
            .filter(record => 
                record.visitorId === accessRecord.visitorId &&
                new Date(record.timestamp) > new Date(Date.now() - 30 * 60 * 1000) // 30 minutos
            );
        
        if (recentAccesses.length > 3) {
            alerts.push('MULTIPLE_ACCESSES_SUSPICIOUS');
        }
        
        // Acceso fuera de horario
        const hour = new Date(accessRecord.timestamp).getHours();
        if (hour < 6 || hour > 23) {
            alerts.push('OUT_OF_HOURS_ACCESS');
        }
        
        // QR usado múltiples veces rápidamente
        if (accessRecord.qrId) {
            const qrRecord = this.qrCodes.get(accessRecord.qrId);
            if (qrRecord && qrRecord.usedCount > qrRecord.maxUses * 0.8) {
                alerts.push('QR_OVERUSE_WARNING');
            }
        }
        
        return alerts;
    }

    async cleanupExpiredQRCodes() {
        try {
            const now = new Date();
            let cleanedCount = 0;
            
            for (const [qrId, qrRecord] of this.qrCodes) {
                if (new Date(qrRecord.validUntil) < now) {
                    qrRecord.active = false;
                    cleanedCount++;
                }
            }
            
            if (cleanedCount > 0) {
                await this.saveQRCodes();
                console.log(`Limpieza automática: ${cleanedCount} códigos QR expirados desactivados`);
            }
            
        } catch (error) {
            console.error('Error en limpieza automática de QR codes:', error);
        }
    }

    // =====================================
    // PERSISTENCIA DE DATOS
    // =====================================

    async loadData() {
        try {
            await Promise.all([
                this.loadAccessRecords(),
                this.loadQRCodes(),
                this.loadVisitors(),
                this.loadBuildings()
            ]);
        } catch (error) {
            console.error('Error cargando datos:', error);
        }
    }

    async loadAccessRecords() {
        try {
            const data = await fs.readFile(this.accessRecordsFile, 'utf8');
            const records = JSON.parse(data);
            records.forEach(record => {
                this.accessRecords.set(record.id, record);
            });
        } catch (error) {
            if (error.code !== 'ENOENT') {
                throw error;
            }
        }
    }

    async saveAccessRecords() {
        const records = Array.from(this.accessRecords.values());
        await fs.writeFile(this.accessRecordsFile, JSON.stringify(records, null, 2));
    }

    async loadQRCodes() {
        try {
            const data = await fs.readFile(this.qrCodesFile, 'utf8');
            const qrCodes = JSON.parse(data);
            qrCodes.forEach(qr => {
                this.qrCodes.set(qr.id, qr);
            });
        } catch (error) {
            if (error.code !== 'ENOENT') {
                throw error;
            }
        }
    }

    async saveQRCodes() {
        const qrCodes = Array.from(this.qrCodes.values());
        await fs.writeFile(this.qrCodesFile, JSON.stringify(qrCodes, null, 2));
    }

    async loadVisitors() {
        try {
            const data = await fs.readFile(this.visitorsFile, 'utf8');
            const visitors = JSON.parse(data);
            visitors.forEach(visitor => {
                this.visitors.set(visitor.id, visitor);
            });
        } catch (error) {
            if (error.code !== 'ENOENT') {
                throw error;
            }
        }
    }

    async saveVisitors() {
        const visitors = Array.from(this.visitors.values());
        await fs.writeFile(this.visitorsFile, JSON.stringify(visitors, null, 2));
    }

    async loadBuildings() {
        try {
            const data = await fs.readFile(this.buildingsFile, 'utf8');
            const buildings = JSON.parse(data);
            buildings.forEach(building => {
                this.buildings.set(building.id, building);
            });
        } catch (error) {
            if (error.code !== 'ENOENT') {
                throw error;
            }
        }
    }

    async saveBuildings() {
        const buildings = Array.from(this.buildings.values());
        await fs.writeFile(this.buildingsFile, JSON.stringify(buildings, null, 2));
    }

    // =====================================
    // DATOS DE EJEMPLO
    // =====================================

    async initializeBuildings() {
        if (this.buildings.size === 0) {
            const defaultBuildings = [
                {
                    id: 'torre_a',
                    name: 'Torre A',
                    address: 'Av. Principal 123',
                    areas: ['lobby', 'parking', 'office_1', 'office_2', 'roof'],
                    gates: ['main', 'service', 'emergency'],
                    floors: 20,
                    capacity: 500,
                    active: true
                },
                {
                    id: 'torre_b',
                    name: 'Torre B',
                    address: 'Av. Principal 125',
                    areas: ['lobby', 'parking', 'commercial', 'residential'],
                    gates: ['main', 'parking'],
                    floors: 15,
                    capacity: 300,
                    active: true
                }
            ];

            defaultBuildings.forEach(building => {
                this.buildings.set(building.id, building);
            });

            await this.saveBuildings();
        }
    }

    async initializeSampleData() {
        // Solo crear datos de ejemplo si no existen
        if (this.visitors.size === 0) {
            // Crear algunos visitantes de ejemplo
            const sampleVisitors = [
                {
                    firstName: 'Juan',
                    lastName: 'Pérez',
                    document: '12345678',
                    email: 'juan.perez@email.com',
                    phone: '+1234567890',
                    company: 'Empresa ABC',
                    purpose: 'Reunión de negocios'
                },
                {
                    firstName: 'María',
                    lastName: 'García',
                    document: '87654321',
                    email: 'maria.garcia@email.com',
                    phone: '+0987654321',
                    company: 'Consultoría XYZ',
                    purpose: 'Auditoría'
                }
            ];

            const systemUser = { id: 'system' };

            for (const visitorData of sampleVisitors) {
                try {
                    await this.registerVisitor(visitorData, systemUser);
                } catch (error) {
                    console.error('Error creando visitante de ejemplo:', error);
                }
            }
        }
    }
}

module.exports = AccessControlService;
