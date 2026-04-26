// Controlador de Reportes - UnionTech
const ReportingService = require('../services/reportingService');

class ReportsController {
    constructor() {
        this.reportingService = new ReportingService();
    }

    // Obtener estadísticas de accesos
    async getAccessStatistics(req, res) {
        try {
            const { dateFrom, dateTo } = req.query;

            const result = await this.reportingService.getAccessStatistics(dateFrom, dateTo);

            res.json(result);

        } catch (error) {
            console.error('Error obteniendo estadísticas:', error);
            res.status(500).json({
                success: false,
                message: 'Error obteniendo estadísticas de accesos',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Obtener histórico de accesos con filtros
    async getAccessHistory(req, res) {
        try {
            const filters = {
                dateFrom: req.query.dateFrom,
                dateTo: req.query.dateTo,
                userId: req.query.userId,
                building: req.query.building,
                method: req.query.method,
                status: req.query.status,
                page: req.query.page,
                limit: req.query.limit
            };

            // Remover filtros vacíos
            Object.keys(filters).forEach(key => {
                if (!filters[key]) delete filters[key];
            });

            const result = await this.reportingService.getAccessHistory(filters);

            res.json(result);

        } catch (error) {
            console.error('Error obteniendo histórico:', error);
            res.status(500).json({
                success: false,
                message: 'Error obteniendo histórico de accesos',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Exportar reportes en formato JSON
    async exportJSON(req, res) {
        try {
            const filters = {
                dateFrom: req.query.dateFrom,
                dateTo: req.query.dateTo,
                userId: req.query.userId,
                building: req.query.building,
                method: req.query.method,
                status: req.query.status
            };

            // Remover filtros vacíos
            Object.keys(filters).forEach(key => {
                if (!filters[key]) delete filters[key];
            });

            const result = await this.reportingService.generateExportData('json', filters);

            // Configurar headers para descarga
            const filename = `uniontech_report_${new Date().toISOString().split('T')[0]}.json`;
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.setHeader('Content-Type', 'application/json');

            res.json(result.data);

        } catch (error) {
            console.error('Error exportando JSON:', error);
            res.status(500).json({
                success: false,
                message: 'Error exportando reporte JSON',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Exportar reportes en formato CSV
    async exportCSV(req, res) {
        try {
            const filters = {
                dateFrom: req.query.dateFrom,
                dateTo: req.query.dateTo,
                userId: req.query.userId,
                building: req.query.building,
                method: req.query.method,
                status: req.query.status
            };

            // Remover filtros vacíos
            Object.keys(filters).forEach(key => {
                if (!filters[key]) delete filters[key];
            });

            const result = await this.reportingService.generateExportData('csv', filters);
            const csvData = this.convertToCSV(result.data.accessHistory);

            // Configurar headers para descarga
            const filename = `uniontech_report_${new Date().toISOString().split('T')[0]}.csv`;
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.setHeader('Content-Type', 'text/csv');

            res.send(csvData);

        } catch (error) {
            console.error('Error exportando CSV:', error);
            res.status(500).json({
                success: false,
                message: 'Error exportando reporte CSV',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Dashboard de reportes principal
    async getDashboardData(req, res) {
        try {
            // Obtener estadísticas de los últimos 30 días
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            
            const stats = await this.reportingService.getAccessStatistics(
                thirtyDaysAgo.toISOString().split('T')[0],
                new Date().toISOString().split('T')[0]
            );

            // Obtener accesos recientes
            const recentAccesses = await this.reportingService.getAccessHistory({
                limit: 10,
                page: 1
            });

            res.json({
                success: true,
                data: {
                    statistics: stats.data,
                    recentAccesses: recentAccesses.data.logs,
                    generatedAt: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error('Error obteniendo datos del dashboard:', error);
            res.status(500).json({
                success: false,
                message: 'Error obteniendo datos del dashboard',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Generar datos mock para demo
    async generateMockData(req, res) {
        try {
            await this.reportingService.generateMockAccessLogs();

            res.json({
                success: true,
                message: 'Datos mock generados exitosamente'
            });

        } catch (error) {
            console.error('Error generando datos mock:', error);
            res.status(500).json({
                success: false,
                message: 'Error generando datos mock',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Función auxiliar para convertir a CSV
    convertToCSV(data) {
        if (!data || data.length === 0) {
            return 'No hay datos disponibles';
        }

        // Headers
        const headers = [
            'Fecha y Hora',
            'Usuario',
            'Email',
            'Persona',
            'Documento',
            'Método',
            'Edificio',
            'Ubicación',
            'Estado',
            'Dispositivo'
        ];

        // Convertir datos
        const rows = data.map(log => [
            new Date(log.timestamp).toLocaleString(),
            log.userName || 'N/A',
            log.userEmail || 'N/A',
            log.personName || 'N/A',
            log.document || 'N/A',
            log.method || 'N/A',
            log.building || 'N/A',
            log.location || 'N/A',
            log.status === 'granted' ? 'Permitido' : 'Denegado',
            log.deviceId || 'N/A'
        ]);

        // Combinar headers y rows
        const csvContent = [headers, ...rows]
            .map(row => row.map(field => `"${field}"`).join(','))
            .join('\n');

        return csvContent;
    }
}

module.exports = ReportsController;
