// UnionTech - Datos de prueba hardcodeados
const bcrypt = require('bcryptjs');

// Usuarios de prueba (hardcodeados)
const USERS_DB = [
    {
        id: 1,
        username: 'admin',
        password_hash: '$2a$12$LQv3c1yqBwlVHpPjrCRw4edsnx5nLdgS.LY3LQf4VrGMvVXjHW.mK', // admin123
        persona: {
            id: 1,
            nombre: 'Administrador',
            apellido: 'Sistema',
            dni: '12345678',
            telefono: '+5491123456789',
            email: 'admin@uniontech.com'
        },
        rol: {
            id: 1,
            nombre: 'admin'
        },
        activo: true
    },
    {
        id: 2,
        username: 'jesus.copes@alu.inspt.utn.edu.ar',
        password_hash: '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
        persona: {
            id: 2,
            nombre: 'Jesús',
            apellido: 'Copes',
            dni: '12345679',
            telefono: '+5491123456789',
            email: 'jesus.copes@alu.inspt.utn.edu.ar'
        },
        rol: {
            id: 1,
            nombre: 'admin'
        },
        activo: true
    },
    {
        id: 3,
        username: 'security',
        password_hash: '$2a$12$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUOIFrRBPG', // security123
        persona: {
            id: 3,
            nombre: 'Seguridad',
            apellido: 'UnionTech',
            dni: '12345680',
            telefono: '+5491123456790',
            email: 'security@uniontech.com'
        },
        rol: {
            id: 2,
            nombre: 'security'
        },
        activo: true
    },
    {
        id: 4,
        username: 'user',
        password_hash: '$2a$12$6BgKoFCgWZMKRNW8R2c5oeR0Q9jW.8pRvmn7gzX5DpOgKLkY8V9qe', // user123
        persona: {
            id: 4,
            nombre: 'Usuario',
            apellido: 'Regular',
            dni: '12345681',
            telefono: '+5491123456791',
            email: 'user@uniontech.com'
        },
        rol: {
            id: 3,
            nombre: 'user'
        },
        activo: true
    }
];

// Datos de accesos simulados
const ACCESSES_DB = [
    {
        id: 'acc-001',
        visitor: 'Juan Pérez',
        building: 'Edificio Principal',
        status: 'authorized',
        timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 min ago
        code: 'QR001'
    },
    {
        id: 'acc-002',
        visitor: 'María García',
        building: 'Edificio Anexo',
        status: 'authorized',
        timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 min ago
        code: 'QR002'
    },
    {
        id: 'acc-003',
        visitor: 'Carlos López',
        building: 'Edificio Principal',
        status: 'pending',
        timestamp: new Date(Date.now() - 45 * 60 * 1000), // 45 min ago
        code: 'QR003'
    }
];

// QR Codes activos simulados
const QR_CODES_DB = [
    {
        id: 'QR001',
        visitor: 'Juan Pérez',
        building: 'Edificio Principal',
        created: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        expiry: new Date(Date.now() + 22 * 60 * 60 * 1000), // expires in 22 hours
        status: 'used'
    },
    {
        id: 'QR002',
        visitor: 'María García',
        building: 'Edificio Anexo',
        created: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
        expiry: new Date(Date.now() + 23 * 60 * 60 * 1000), // expires in 23 hours
        status: 'used'
    },
    {
        id: 'QR004',
        visitor: 'Ana Rodríguez',
        building: 'Edificio Principal',
        created: new Date(Date.now() - 10 * 60 * 1000), // 10 min ago
        expiry: new Date(Date.now() + 23 * 60 * 60 * 1000), // expires in 23 hours
        status: 'active'
    }
];

// Notificaciones simuladas
const NOTIFICATIONS_DB = [
    {
        id: 'not-001',
        type: 'whatsapp',
        recipient: '+5491123456789',
        message: 'Código QR generado para acceso',
        status: 'sent',
        timestamp: new Date(Date.now() - 30 * 60 * 1000)
    },
    {
        id: 'not-002',
        type: 'email',
        recipient: 'visitante@example.com',
        subject: 'Acceso autorizado',
        message: 'Su acceso ha sido autorizado',
        status: 'sent',
        timestamp: new Date(Date.now() - 15 * 60 * 1000)
    }
];

// Funciones de utilidad
function findUserByUsername(username) {
    return USERS_DB.find(user => user.username === username && user.activo);
}

function findUserById(id) {
    return USERS_DB.find(user => user.id === id && user.activo);
}

async function validatePassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
}

function generateAccessId() {
    return 'ACC-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase();
}

function generateQRId() {
    return 'QR' + Date.now().toString().slice(-6) + Math.random().toString(36).substr(2, 3).toUpperCase();
}

// Estadísticas simuladas
function getStats() {
    return {
        totalAccesses: ACCESSES_DB.length,
        totalVisitors: QR_CODES_DB.filter(qr => qr.status === 'active').length,
        qrGenerated: QR_CODES_DB.length,
        notificationsSent: NOTIFICATIONS_DB.length,
        todayAccesses: ACCESSES_DB.filter(acc => {
            const today = new Date();
            const accDate = new Date(acc.timestamp);
            return accDate.toDateString() === today.toDateString();
        }).length
    };
}

module.exports = {
    USERS_DB,
    ACCESSES_DB,
    QR_CODES_DB,
    NOTIFICATIONS_DB,
    findUserByUsername,
    findUserById,
    validatePassword,
    generateAccessId,
    generateQRId,
    getStats
};
