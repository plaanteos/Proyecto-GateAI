// Servicio de Reportes y Estadísticas - UnionTech
const fs = require('fs').promises;
const path = require('path');

class ReportingService {
    constructor() {
        this.dataPath = path.join(__dirname, '../../data/database.json');
        this.logsPath = path.join(__dirname, '../../logs');
    }

    // Cargar datos desde archivo
    async loadData() {
        try {
            const data = await fs.readFile(this.dataPath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Error cargando datos:', error);
            return { users: [], persons: [], visitors: [], buildings: [], accessLogs: [] };
        }
    }

    // Generar estadísticas de accesos
    async getAccessStatistics(dateFrom = null, dateTo = null) {
        try {
            const data = await this.loadData();
            const accessLogs = data.accessLogs || [];

            // Filtrar por fechas si se proporcionan
            let filteredLogs = accessLogs;
            if (dateFrom || dateTo) {
                filteredLogs = accessLogs.filter(log => {
                    const logDate = new Date(log.timestamp);
                    if (dateFrom && logDate < new Date(dateFrom)) return false;
                    if (dateTo && logDate > new Date(dateTo)) return false;
                    return true;
                });
            }

            // Estadísticas generales
            const totalAccesses = filteredLogs.length;
            const successfulAccesses = filteredLogs.filter(log => log.status === 'granted').length;
            const deniedAccesses = filteredLogs.filter(log => log.status === 'denied').length;
            const successRate = totalAccesses > 0 ? (successfulAccesses / totalAccesses * 100).toFixed(2) : 0;

            // Accesos por método
            const accessByMethod = this.groupBy(filteredLogs, 'method');
            const methodStats = Object.keys(accessByMethod).map(method => ({
                method,
                count: accessByMethod[method].length,
                percentage: totalAccesses > 0 ? (accessByMethod[method].length / totalAccesses * 100).toFixed(2) : 0
            }));

            // Accesos por día (últimos 30 días)
            const dailyAccesses = this.getDailyAccesses(filteredLogs, 30);

            // Accesos por hora del día
            const hourlyAccesses = this.getHourlyAccesses(filteredLogs);

            // Top edificios por accesos
            const buildingAccesses = this.groupBy(filteredLogs, 'building');
            const topBuildings = Object.keys(buildingAccesses)
                .map(building => ({
                    building,
                    count: buildingAccesses[building].length,
                    successCount: buildingAccesses[building].filter(log => log.status === 'granted').length
                }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 10);

            // Usuarios más activos
            const userAccesses = this.groupBy(filteredLogs, 'userId');
            const topUsers = Object.keys(userAccesses)
                .map(userId => {
                    const user = data.users.find(u => u.id === userId);
                    return {
                        userId,
                        userName: user ? user.name : 'Usuario Desconocido',
                        count: userAccesses[userId].length,
                        lastAccess: new Date(Math.max(...userAccesses[userId].map(log => new Date(log.timestamp))))
                    };
                })
                .sort((a, b) => b.count - a.count)
                .slice(0, 10);

            return {
                success: true,
                data: {
                    summary: {
                        totalAccesses,
                        successfulAccesses,
                        deniedAccesses,
                        successRate: parseFloat(successRate),
                        dateRange: {
                            from: dateFrom,
                            to: dateTo
                        }
                    },
                    methodStats,
                    dailyAccesses,
                    hourlyAccesses,
                    topBuildings,
                    topUsers,
                    generatedAt: new Date().toISOString()
                }
            };

        } catch (error) {
            console.error('Error generando estadísticas:', error);
            throw new Error('Error generando estadísticas de accesos');
        }
    }

    // Obtener histórico de accesos con filtros
    async getAccessHistory(filters = {}) {
        try {
            const data = await this.loadData();
            let accessLogs = data.accessLogs || [];

            // Aplicar filtros
            if (filters.dateFrom) {
                accessLogs = accessLogs.filter(log => new Date(log.timestamp) >= new Date(filters.dateFrom));
            }
            if (filters.dateTo) {
                accessLogs = accessLogs.filter(log => new Date(log.timestamp) <= new Date(filters.dateTo));
            }
            if (filters.userId) {
                accessLogs = accessLogs.filter(log => log.userId === filters.userId);
            }
            if (filters.building) {
                accessLogs = accessLogs.filter(log => log.building === filters.building);
            }
            if (filters.method) {
                accessLogs = accessLogs.filter(log => log.method === filters.method);
            }
            if (filters.status) {
                accessLogs = accessLogs.filter(log => log.status === filters.status);
            }

            // Paginación
            const page = parseInt(filters.page) || 1;
            const limit = parseInt(filters.limit) || 50;
            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + limit;

            // Ordenar por fecha (más reciente primero)
            accessLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

            // Enriquecer datos con información de usuarios
            const enrichedLogs = accessLogs.map(log => {
                const user = data.users.find(u => u.id === log.userId);
                const person = data.persons.find(p => p.id === log.personId);
                return {
                    ...log,
                    userName: user ? user.name : 'Usuario Desconocido',
                    userEmail: user ? user.email : null,
                    personName: person ? person.name : null,
                    document: person ? person.document : null
                };
            });

            const paginatedLogs = enrichedLogs.slice(startIndex, endIndex);

            return {
                success: true,
                data: {
                    logs: paginatedLogs,
                    pagination: {
                        currentPage: page,
                        totalPages: Math.ceil(enrichedLogs.length / limit),
                        totalRecords: enrichedLogs.length,
                        hasNext: endIndex < enrichedLogs.length,
                        hasPrevious: page > 1
                    },
                    filters: filters
                }
            };

        } catch (error) {
            console.error('Error obteniendo histórico:', error);
            throw new Error('Error obteniendo histórico de accesos');
        }
    }

    // Generar datos para exportación
    async generateExportData(format = 'json', filters = {}) {
        try {
            const historyResult = await this.getAccessHistory({ ...filters, limit: 10000 });
            const statsResult = await this.getAccessStatistics(filters.dateFrom, filters.dateTo);

            const exportData = {
                metadata: {
                    generatedAt: new Date().toISOString(),
                    format: format,
                    filters: filters,
                    totalRecords: historyResult.data.pagination.totalRecords
                },
                statistics: statsResult.data,
                accessHistory: historyResult.data.logs
            };

            return {
                success: true,
                data: exportData
            };

        } catch (error) {
            console.error('Error generando datos de exportación:', error);
            throw new Error('Error generando datos para exportación');
        }
    }

    // Funciones auxiliares
    groupBy(array, key) {
        return array.reduce((result, item) => {
            const group = item[key] || 'Sin especificar';
            if (!result[group]) {
                result[group] = [];
            }
            result[group].push(item);
            return result;
        }, {});
    }

    getDailyAccesses(logs, days) {
        const result = [];
        const now = new Date();
        
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            
            const dayLogs = logs.filter(log => {
                const logDate = new Date(log.timestamp).toISOString().split('T')[0];
                return logDate === dateStr;
            });

            result.push({
                date: dateStr,
                total: dayLogs.length,
                granted: dayLogs.filter(log => log.status === 'granted').length,
                denied: dayLogs.filter(log => log.status === 'denied').length
            });
        }

        return result;
    }

    getHourlyAccesses(logs) {
        const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
            hour: hour.toString().padStart(2, '0') + ':00',
            count: 0
        }));

        logs.forEach(log => {
            const hour = new Date(log.timestamp).getHours();
            hourlyData[hour].count++;
        });

        return hourlyData;
    }

    // Generar datos mock si no existen logs
    async generateMockAccessLogs() {
        const data = await this.loadData();
        
        if (!data.accessLogs || data.accessLogs.length === 0) {
            const mockLogs = [];
            const methods = ['QR', 'Facial', 'Manual', 'Card'];
            const buildings = ['Edificio A', 'Edificio B', 'Torre Central'];
            const statuses = ['granted', 'denied'];

            // Generar logs de los últimos 30 días
            for (let i = 0; i < 500; i++) {
                const randomDate = new Date();
                randomDate.setDate(randomDate.getDate() - Math.floor(Math.random() * 30));
                randomDate.setHours(Math.floor(Math.random() * 24));
                randomDate.setMinutes(Math.floor(Math.random() * 60));

                const userId = data.users[Math.floor(Math.random() * data.users.length)]?.id;
                const personId = data.persons[Math.floor(Math.random() * data.persons.length)]?.id;

                mockLogs.push({
                    id: `log_${i + 1}`,
                    timestamp: randomDate.toISOString(),
                    userId: userId,
                    personId: personId,
                    method: methods[Math.floor(Math.random() * methods.length)],
                    building: buildings[Math.floor(Math.random() * buildings.length)],
                    status: Math.random() > 0.1 ? 'granted' : 'denied',
                    location: `Entrada ${Math.floor(Math.random() * 5) + 1}`,
                    deviceId: `device_${Math.floor(Math.random() * 10) + 1}`
                });
            }

            data.accessLogs = mockLogs;
            await fs.writeFile(this.dataPath, JSON.stringify(data, null, 2));
            console.log('✅ Generados logs de acceso mock para demo');
        }
    }
}

module.exports = ReportingService;
