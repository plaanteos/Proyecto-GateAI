// Dashboard de Reportes - Sistema UnionTech
// Implementación de HU5, HU6 y HU7: Historial de accesos, estadísticas y exportación

class ReportsDashboard {
    constructor() {
        this.baseURL = (window.API_BASE_URL || 'https://uniontech-backend-production.up.railway.app') + '/api/reports';
        this.currentData = null;
        this.charts = {};
        this.init();
    }

    async init() {
        try {
            // Configurar fechas por defecto
            this.setupDefaultDates();
            
            // Cargar datos iniciales
            await this.loadDashboardData();
            
            // Configurar event listeners
            this.setupEventListeners();
            
            console.log('Dashboard de reportes inicializado correctamente');
        } catch (error) {
            console.error('Error inicializando dashboard:', error);
            this.showError('Error inicializando el dashboard');
        }
    }

    setupDefaultDates() {
        const today = new Date();
        const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        document.getElementById('dateFrom').value = lastWeek.toISOString().split('T')[0];
        document.getElementById('dateTo').value = today.toISOString().split('T')[0];
    }

    setupEventListeners() {
        // Auto-aplicar filtros cuando cambien las fechas
        document.getElementById('dateFrom').addEventListener('change', () => this.applyFilters());
        document.getElementById('dateTo').addEventListener('change', () => this.applyFilters());
        document.getElementById('building').addEventListener('change', () => this.applyFilters());
        document.getElementById('accessType').addEventListener('change', () => this.applyFilters());
    }

    async loadDashboardData() {
        try {
            this.showLoading();
            
            // Cargar estadísticas del dashboard
            const dashboardData = await this.fetchData('/dashboard');
            this.updateStatistics(dashboardData);
            
            // Cargar datos para gráficos
            await this.loadChartData();
            
            // Cargar historial con filtros actuales
            await this.loadAccessHistory();
            
        } catch (error) {
            console.error('Error cargando datos del dashboard:', error);
            this.showError('Error cargando los datos del dashboard');
        }
    }

    async loadChartData() {
        try {
            // Obtener filtros actuales
            const filters = this.getCurrentFilters();
            
            // Cargar estadísticas con filtros
            const statsData = await this.fetchData('/statistics', filters);
            
            // Crear gráficos
            this.createDailyChart(statsData.dailyAccess);
            this.createHourlyChart(statsData.hourlyDistribution);
            
        } catch (error) {
            console.error('Error cargando datos de gráficos:', error);
        }
    }

    async loadAccessHistory() {
        try {
            const filters = this.getCurrentFilters();
            const historyData = await this.fetchData('/history', filters);
            
            this.renderAccessTable(historyData.accesses);
            this.currentData = historyData;
            
        } catch (error) {
            console.error('Error cargando historial:', error);
            this.showError('Error cargando el historial de accesos');
        }
    }

    getCurrentFilters() {
        return {
            dateFrom: document.getElementById('dateFrom').value,
            dateTo: document.getElementById('dateTo').value,
            building: document.getElementById('building').value,
            accessType: document.getElementById('accessType').value
        };
    }

    async fetchData(endpoint, params = {}) {
        const token = localStorage.getItem('authToken');
        if (!token) {
            throw new Error('Token de autenticación no encontrado');
        }

        const url = new URL(this.baseURL + endpoint);
        Object.keys(params).forEach(key => {
            if (params[key]) {
                url.searchParams.append(key, params[key]);
            }
        });

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        if (!data.success) {
            throw new Error(data.message || 'Error en la respuesta del servidor');
        }

        return data.data;
    }

    updateStatistics(data) {
        document.getElementById('totalAccess').textContent = data.totalAccess.toLocaleString();
        document.getElementById('uniqueUsers').textContent = data.uniqueUsers.toLocaleString();
        document.getElementById('avgDailyAccess').textContent = Math.round(data.avgDailyAccess);
        document.getElementById('peakHour').textContent = `${data.peakHour}:00`;
    }

    createDailyChart(dailyData) {
        const ctx = document.getElementById('dailyChart').getContext('2d');
        
        // Destruir gráfico anterior si existe
        if (this.charts.daily) {
            this.charts.daily.destroy();
        }

        this.charts.daily = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dailyData.map(d => this.formatDate(d.date)),
                datasets: [{
                    label: 'Accesos por Día',
                    data: dailyData.map(d => d.count),
                    borderColor: '#2196F3',
                    backgroundColor: 'rgba(33, 150, 243, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        }
                    }
                }
            }
        });
    }

    createHourlyChart(hourlyData) {
        const ctx = document.getElementById('hourlyChart').getContext('2d');
        
        // Destruir gráfico anterior si existe
        if (this.charts.hourly) {
            this.charts.hourly.destroy();
        }

        this.charts.hourly = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: hourlyData.map(h => `${h.hour.toString().padStart(2, '0')}:00`),
                datasets: [{
                    label: 'Accesos por Hora',
                    data: hourlyData.map(h => h.count),
                    backgroundColor: 'rgba(33, 150, 243, 0.8)',
                    borderColor: '#2196F3',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        }
                    }
                }
            }
        });
    }

    renderAccessTable(accesses) {
        const container = document.getElementById('tableContainer');
        
        if (!accesses || accesses.length === 0) {
            container.innerHTML = '<div class="loading">No se encontraron registros de acceso</div>';
            return;
        }

        const table = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Hora</th>
                        <th>Usuario</th>
                        <th>Edificio</th>
                        <th>Tipo</th>
                        <th>Método</th>
                        <th>Estado</th>
                    </tr>
                </thead>
                <tbody>
                    ${accesses.map(access => `
                        <tr>
                            <td>${this.formatDate(access.fecha)}</td>
                            <td>${this.formatTime(access.hora)}</td>
                            <td>${access.usuario || access.personaId}</td>
                            <td>${access.edificio || access.edificioId}</td>
                            <td>
                                <span class="badge ${access.tipo === 'entrada' ? 'success' : 'info'}">
                                    ${access.tipo}
                                </span>
                            </td>
                            <td>${access.metodo}</td>
                            <td>
                                <span class="badge ${access.estado === 'exitoso' ? 'success' : 'error'}">
                                    ${access.estado}
                                </span>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        container.innerHTML = table;
    }

    async applyFilters() {
        await this.loadDashboardData();
    }

    async refreshDashboard() {
        await this.loadDashboardData();
    }

    async exportData(format) {
        try {
            const filters = this.getCurrentFilters();
            const endpoint = format === 'json' ? '/export/json' : '/export/csv';
            
            const response = await fetch(this.baseURL + endpoint + '?' + new URLSearchParams(filters), {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });

            if (!response.ok) {
                throw new Error('Error en la exportación');
            }

            if (format === 'json') {
                const data = await response.json();
                this.downloadJSON(data, 'accesos_' + this.getCurrentDateString() + '.json');
            } else {
                const csvData = await response.text();
                this.downloadCSV(csvData, 'accesos_' + this.getCurrentDateString() + '.csv');
            }

            this.showSuccess(`Datos exportados exitosamente en formato ${format.toUpperCase()}`);

        } catch (error) {
            console.error('Error exportando datos:', error);
            this.showError('Error al exportar los datos');
        }
    }

    downloadJSON(data, filename) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        this.downloadBlob(blob, filename);
    }

    downloadCSV(csvData, filename) {
        const blob = new Blob([csvData], { type: 'text/csv' });
        this.downloadBlob(blob, filename);
    }

    downloadBlob(blob, filename) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES');
    }

    formatTime(timeString) {
        if (!timeString) return '--';
        return timeString.substring(0, 5); // HH:MM
    }

    getCurrentDateString() {
        return new Date().toISOString().split('T')[0];
    }

    showLoading() {
        const container = document.getElementById('tableContainer');
        container.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                Cargando datos...
            </div>
        `;
    }

    showError(message) {
        const container = document.getElementById('tableContainer');
        container.innerHTML = `
            <div class="error-message">
                ⚠️ ${message}
            </div>
        `;
    }

    showSuccess(message) {
        // Crear notificación temporal
        const notification = document.createElement('div');
        notification.className = 'success-notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Funciones globales para el HTML
function refreshDashboard() {
    if (window.dashboard) {
        window.dashboard.refreshDashboard();
    }
}

function applyFilters() {
    if (window.dashboard) {
        window.dashboard.applyFilters();
    }
}

function exportData(format) {
    if (window.dashboard) {
        window.dashboard.exportData(format);
    }
}

// Inicializar dashboard cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new ReportsDashboard();
});

// Estilos adicionales para notificaciones
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    .badge {
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
    }
    
    .badge.success {
        background: #e8f5e8;
        color: #2e7d32;
    }
    
    .badge.info {
        background: #e3f2fd;
        color: #1976d2;
    }
    
    .badge.error {
        background: #ffebee;
        color: #c62828;
    }
`;
document.head.appendChild(style);
