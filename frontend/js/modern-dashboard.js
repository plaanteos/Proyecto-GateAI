// Dashboard Moderno UnionTech - HU9
// Dashboard responsive con Material Design y funcionalidades avanzadas

class ModernDashboard {
    constructor() {
        this.apiBaseUrl = 'http://localhost:3001/api';
        this.currentPage = 'dashboard';
        this.charts = {};
        this.refreshInterval = null;
        this.sidebarOpen = window.innerWidth > 1024;
        this.init();
    }

    async init() {
        try {
            this.setupEventListeners();
            this.setupResponsiveDesign();
            await this.loadDashboardData();
            this.startAutoRefresh();
            
            console.log('Dashboard moderno inicializado');
        } catch (error) {
            console.error('Error inicializando dashboard:', error);
        }
    }

    setupEventListeners() {
        // Navegación responsive
        window.addEventListener('resize', () => {
            this.handleResize();
        });

        // Click fuera del sidebar para cerrarlo en móvil
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 1024 && 
                this.sidebarOpen && 
                !e.target.closest('.dashboard-sidebar') && 
                !e.target.closest('#menu-toggle')) {
                this.toggleSidebar();
            }
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.sidebarOpen && window.innerWidth <= 1024) {
                this.toggleSidebar();
            }
        });
    }

    setupResponsiveDesign() {
        this.handleResize();
    }

    handleResize() {
        const isMobile = window.innerWidth <= 1024;
        const sidebar = document.getElementById('sidebar');
        
        if (isMobile && this.sidebarOpen) {
            sidebar.classList.add('open');
        } else if (isMobile) {
            sidebar.classList.remove('open');
        } else {
            sidebar.classList.remove('open');
            this.sidebarOpen = true;
        }

        // Redimensionar gráficos
        Object.values(this.charts).forEach(chart => {
            if (chart && chart.resize) {
                chart.resize();
            }
        });
    }

    toggleSidebar() {
        this.sidebarOpen = !this.sidebarOpen;
        const sidebar = document.getElementById('sidebar');
        
        if (window.innerWidth <= 1024) {
            sidebar.classList.toggle('open', this.sidebarOpen);
        }
    }

    navigateTo(page) {
        // Actualizar navegación activa
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        document.querySelector(`[onclick="navigateTo('${page}')"]`).classList.add('active');

        // Mostrar página correspondiente
        document.querySelectorAll('[id$="-page"]').forEach(pageEl => {
            pageEl.classList.add('hidden');
        });
        
        document.getElementById(`${page}-page`).classList.remove('hidden');
        this.currentPage = page;

        // Cerrar sidebar en móvil después de navegación
        if (window.innerWidth <= 1024) {
            this.sidebarOpen = false;
            document.getElementById('sidebar').classList.remove('open');
        }

        // Cargar datos específicos de la página
        this.loadPageData(page);
    }

    async loadPageData(page) {
        switch(page) {
            case 'dashboard':
                await this.loadDashboardData();
                break;
            case 'access':
                await this.loadAccessData();
                break;
            case 'reports':
                await this.loadReportsData();
                break;
            // Agregar más páginas según necesidad
        }
    }

    async loadDashboardData() {
        try {
            // Cargar estadísticas principales
            await Promise.all([
                this.loadMainStats(),
                this.loadChartData(),
                this.loadRecentActivity()
            ]);
        } catch (error) {
            console.error('Error cargando datos del dashboard:', error);
        }
    }

    async loadMainStats() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/reports/dashboard`, {
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error('Error cargando estadísticas');
            }

            const data = await response.json();
            this.updateMainStats(data.data);
        } catch (error) {
            console.error('Error cargando estadísticas:', error);
            // Mostrar datos de ejemplo si hay error
            this.updateMainStats({
                totalAccess: 1247,
                activeUsers: 89,
                securityAlerts: 3,
                systemUptime: 99.9
            });
        }
    }

    updateMainStats(stats) {
        // Animación de números con contador
        this.animateValue('total-access', 0, stats.totalAccess || 0, 1000);
        this.animateValue('active-users', 0, stats.activeUsers || 0, 1200);
        this.animateValue('security-alerts', 0, stats.securityAlerts || 0, 800);
        
        // Uptime con animación especial
        const uptimeEl = document.getElementById('system-uptime');
        if (uptimeEl) {
            uptimeEl.textContent = `${(stats.systemUptime || 99.9).toFixed(1)}%`;
        }
    }

    animateValue(elementId, start, end, duration) {
        const element = document.getElementById(elementId);
        if (!element) return;

        const startTime = performance.now();
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function for smooth animation
            const easeOutCubic = 1 - Math.pow(1 - progress, 3);
            const currentValue = Math.floor(start + (end - start) * easeOutCubic);
            
            element.textContent = currentValue.toLocaleString();
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }

    async loadChartData() {
        try {
            const [hourlyData, methodsData] = await Promise.all([
                this.fetchChartData('/reports/statistics'),
                this.fetchChartData('/reports/methods-distribution')
            ]);

            this.createHourlyChart(hourlyData);
            this.createMethodsChart(methodsData);
        } catch (error) {
            console.error('Error cargando datos de gráficos:', error);
            this.createSampleCharts();
        }
    }

    async fetchChartData(endpoint) {
        const response = await fetch(`${this.apiBaseUrl}${endpoint}`, {
            headers: this.getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error(`Error fetching ${endpoint}`);
        }

        const data = await response.json();
        return data.data;
    }

    createHourlyChart(data) {
        const ctx = document.getElementById('hourly-chart');
        if (!ctx) return;

        // Destruir gráfico anterior si existe
        if (this.charts.hourly) {
            this.charts.hourly.destroy();
        }

        // Datos de ejemplo si no hay datos reales
        const chartData = data?.hourlyDistribution || this.getHourlyExampleData();

        this.charts.hourly = new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartData.map(d => `${d.hour.toString().padStart(2, '0')}:00`),
                datasets: [{
                    label: 'Accesos',
                    data: chartData.map(d => d.count),
                    borderColor: '#1976d2',
                    backgroundColor: 'rgba(25, 118, 210, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#1976d2',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8
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
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#757575'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            color: '#757575',
                            precision: 0
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    }

    createMethodsChart(data) {
        const ctx = document.getElementById('methods-chart');
        if (!ctx) return;

        // Destruir gráfico anterior si existe
        if (this.charts.methods) {
            this.charts.methods.destroy();
        }

        // Datos de ejemplo si no hay datos reales
        const chartData = data?.methods || [
            { method: 'QR Code', count: 45, color: '#1976d2' },
            { method: 'Facial', count: 30, color: '#388e3c' },
            { method: 'Documento', count: 20, color: '#f57c00' },
            { method: 'Multimodal', count: 5, color: '#7b1fa2' }
        ];

        this.charts.methods = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: chartData.map(d => d.method),
                datasets: [{
                    data: chartData.map(d => d.count),
                    backgroundColor: chartData.map(d => d.color),
                    borderWidth: 0,
                    hoverBorderWidth: 3,
                    hoverBorderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '60%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true,
                            font: {
                                family: 'Roboto',
                                size: 14
                            }
                        }
                    }
                }
            }
        });
    }

    async loadRecentActivity() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/access/recent?limit=10`, {
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error('Error cargando actividad reciente');
            }

            const data = await response.json();
            this.renderRecentActivity(data.data || []);
        } catch (error) {
            console.error('Error cargando actividad:', error);
            this.renderRecentActivity(this.getExampleActivity());
        }
    }

    renderRecentActivity(activities) {
        const tbody = document.getElementById('recent-activity');
        if (!tbody) return;

        if (!activities.length) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center">No hay actividad reciente</td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = activities.map(activity => {
            const time = new Date(activity.timestamp || activity.fecha).toLocaleTimeString('es-ES');
            const userName = activity.userName || activity.usuario || 'Usuario';
            const method = activity.method || activity.metodo || 'N/A';
            const building = activity.building || activity.edificio || 'N/A';
            const status = activity.status || activity.estado || 'unknown';
            
            return `
                <tr>
                    <td>
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #1976d2, #1565c0); display: flex; align-items: center; justify-content: center; color: white; font-weight: 500; font-size: 14px;">
                                ${userName.charAt(0).toUpperCase()}
                            </div>
                            <span>${userName}</span>
                        </div>
                    </td>
                    <td>
                        <span class="badge" style="background: rgba(25, 118, 210, 0.1); color: #1976d2;">
                            ${method}
                        </span>
                    </td>
                    <td>${building}</td>
                    <td>${time}</td>
                    <td>
                        <span class="badge ${status === 'exitoso' || status === 'granted' ? 'success' : 'error'}">
                            ${status === 'exitoso' || status === 'granted' ? 'Concedido' : 'Denegado'}
                        </span>
                    </td>
                    <td>
                        <button class="icon-button" onclick="viewDetails('${activity.id}')" title="Ver detalles">
                            <span class="material-icons">visibility</span>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // Auto-refresh functionality
    startAutoRefresh() {
        this.refreshInterval = setInterval(() => {
            if (this.currentPage === 'dashboard') {
                this.loadMainStats();
                this.loadRecentActivity();
            }
        }, 30000); // Cada 30 segundos
    }

    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    // Datos de ejemplo para desarrollo
    getHourlyExampleData() {
        return Array.from({ length: 24 }, (_, i) => ({
            hour: i,
            count: Math.floor(Math.random() * 100) + 10
        }));
    }

    getExampleActivity() {
        const names = ['Juan Pérez', 'María García', 'Carlos López', 'Ana Martín', 'Luis Rodríguez'];
        const methods = ['QR Code', 'Facial', 'Documento', 'Multimodal'];
        const buildings = ['Torre A', 'Torre B', 'Torre C', 'Laboratorio'];
        const statuses = ['granted', 'granted', 'granted', 'denied']; // Más granted que denied

        return Array.from({ length: 8 }, (_, i) => ({
            id: `activity-${i}`,
            userName: names[Math.floor(Math.random() * names.length)],
            method: methods[Math.floor(Math.random() * methods.length)],
            building: buildings[Math.floor(Math.random() * buildings.length)],
            timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(),
            status: statuses[Math.floor(Math.random() * statuses.length)]
        }));
    }

    getAuthHeaders() {
        const token = localStorage.getItem('authToken') || localStorage.getItem('uniontech_token');
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token || 'demo-token'}`
        };
    }

    // Métodos para otras funcionalidades
    async loadAccessData() {
        console.log('Cargando datos de acceso...');
    }

    async loadReportsData() {
        console.log('Cargando datos de reportes...');
    }

    createSampleCharts() {
        this.createHourlyChart(null);
        this.createMethodsChart(null);
    }

    // Cleanup
    destroy() {
        this.stopAutoRefresh();
        Object.values(this.charts).forEach(chart => {
            if (chart && chart.destroy) {
                chart.destroy();
            }
        });
    }
}

// Funciones globales para HTML
function toggleSidebar() {
    if (window.modernDashboard) {
        window.modernDashboard.toggleSidebar();
    }
}

function navigateTo(page) {
    if (window.modernDashboard) {
        window.modernDashboard.navigateTo(page);
    }
}

function toggleNotifications() {
    console.log('Toggle notifications');
}

function toggleSettings() {
    console.log('Toggle settings');
}

function toggleUserMenu() {
    console.log('Toggle user menu');
}

function viewDetails(id) {
    console.log('Ver detalles:', id);
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    window.modernDashboard = new ModernDashboard();
});

// Cleanup al cerrar
window.addEventListener('beforeunload', () => {
    if (window.modernDashboard) {
        window.modernDashboard.destroy();
    }
});
