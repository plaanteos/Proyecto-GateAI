// Rutas de Reportes - UnionTech
const express = require('express');
const ReportsController = require('../controllers/reportsController');
const { auth, requireRole } = require('../middleware/auth');
const { ErrorHandler } = require('../middleware/errorHandler');

const router = express.Router();
const reportsController = new ReportsController();

// Todas las rutas requieren autenticación
router.use(auth);

// GET /api/reports/dashboard - Dashboard principal de reportes
router.get('/dashboard',
    requireRole(['admin', 'security', 'building_admin']),
    ErrorHandler.asyncHandler(reportsController.getDashboardData)
);

// GET /api/reports/statistics - Estadísticas de accesos
router.get('/statistics',
    requireRole(['admin', 'security', 'building_admin']),
    ErrorHandler.asyncHandler(reportsController.getAccessStatistics)
);

// GET /api/reports/history - Histórico de accesos con filtros
router.get('/history',
    requireRole(['admin', 'security', 'building_admin']),
    ErrorHandler.asyncHandler(reportsController.getAccessHistory)
);

// GET /api/reports/export/json - Exportar en formato JSON
router.get('/export/json',
    requireRole(['admin', 'security', 'building_admin']),
    ErrorHandler.asyncHandler(reportsController.exportJSON)
);

// GET /api/reports/export/csv - Exportar en formato CSV
router.get('/export/csv',
    requireRole(['admin', 'security', 'building_admin']),
    ErrorHandler.asyncHandler(reportsController.exportCSV)
);

// POST /api/reports/generate-mock - Generar datos mock para demo
router.post('/generate-mock',
    requireRole(['admin']),
    ErrorHandler.asyncHandler(reportsController.generateMockData)
);

module.exports = router;
