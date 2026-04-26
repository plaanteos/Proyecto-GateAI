const { createConnection } = require('mssql');
require('dotenv').config();

/**
 * Configuración de conexión a SQL Server (LocalDB)
 */
const config = {
    server: process.env.DATABASE_SERVER || '(localdb)\\MSSQLLocalDB',
    database: process.env.DATABASE_NAME || 'Database-uniontech-mejorada',
    options: {
        encrypt: process.env.DATABASE_ENCRYPT === 'true' || false,
        trustServerCertificate: process.env.DATABASE_TRUST_SERVER_CERTIFICATE === 'true' || true,
        enableArithAbort: true,
        requestTimeout: 30000,
        connectionTimeout: 30000,
        trustedConnection: process.env.DATABASE_TRUSTED_CONNECTION === 'true' || true,
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

let pool = null;

/**
 * Obtener la conexión a la base de datos
 */
async function getConnection() {
    try {
        if (!pool) {
            const sql = require('mssql');
            pool = await sql.connect(config);
            console.log('✅ Conexión exitosa a SQL Server:', config.database);
        }
        return pool;
    } catch (error) {
        console.error('❌ Error de conexión a SQL Server:', error.message);
        throw error;
    }
}

/**
 * Cerrar la conexión a la base de datos
 */
async function closeConnection() {
    try {
        if (pool) {
            await pool.close();
            pool = null;
            console.log('🔒 Conexión cerrada correctamente');
        }
    } catch (error) {
        console.error('❌ Error al cerrar conexión:', error.message);
    }
}

/**
 * Ejecutar una consulta SQL
 */
async function executeQuery(query, params = {}) {
    try {
        const pool = await getConnection();
        const request = pool.request();
        
        // Agregar parámetros si existen
        Object.keys(params).forEach(key => {
            request.input(key, params[key]);
        });
        
        const result = await request.query(query);
        return result;
    } catch (error) {
        console.error('❌ Error ejecutando consulta:', error.message);
        throw error;
    }
}

/**
 * Obtener un registro por ID
 */
async function getById(table, id, idColumn = 'id') {
    try {
        const query = `SELECT * FROM ${table} WHERE ${idColumn} = @id`;
        const result = await executeQuery(query, { id });
        return result.recordset[0] || null;
    } catch (error) {
        console.error(`❌ Error obteniendo registro de ${table}:`, error.message);
        throw error;
    }
}

/**
 * Obtener todos los registros de una tabla
 */
async function getAll(table, orderBy = 'id') {
    try {
        const query = `SELECT * FROM ${table} ORDER BY ${orderBy}`;
        const result = await executeQuery(query);
        return result.recordset;
    } catch (error) {
        console.error(`❌ Error obteniendo registros de ${table}:`, error.message);
        throw error;
    }
}

/**
 * Insertar un nuevo registro
 */
async function insert(table, data) {
    try {
        const keys = Object.keys(data);
        const values = keys.map(key => `@${key}`).join(', ');
        const columns = keys.join(', ');
        
        const query = `
            INSERT INTO ${table} (${columns}) 
            OUTPUT INSERTED.* 
            VALUES (${values})
        `;
        
        const result = await executeQuery(query, data);
        return result.recordset[0];
    } catch (error) {
        console.error(`❌ Error insertando en ${table}:`, error.message);
        throw error;
    }
}

/**
 * Actualizar un registro
 */
async function update(table, id, data, idColumn = 'id') {
    try {
        const keys = Object.keys(data);
        const setClause = keys.map(key => `${key} = @${key}`).join(', ');
        
        const query = `
            UPDATE ${table} 
            SET ${setClause}
            OUTPUT INSERTED.*
            WHERE ${idColumn} = @id
        `;
        
        const params = { ...data, id };
        const result = await executeQuery(query, params);
        return result.recordset[0];
    } catch (error) {
        console.error(`❌ Error actualizando ${table}:`, error.message);
        throw error;
    }
}

/**
 * Eliminar un registro
 */
async function deleteRecord(table, id, idColumn = 'id') {
    try {
        const query = `DELETE FROM ${table} WHERE ${idColumn} = @id`;
        const result = await executeQuery(query, { id });
        return result.rowsAffected[0] > 0;
    } catch (error) {
        console.error(`❌ Error eliminando de ${table}:`, error.message);
        throw error;
    }
}

/**
 * Verificar si las tablas existen en la base de datos
 */
async function checkTables() {
    try {
        const query = `
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_type = 'BASE TABLE' 
            AND table_schema = 'dbo'
            ORDER BY table_name
        `;
        
        const result = await executeQuery(query);
        const tables = result.recordset.map(row => row.table_name);
        
        console.log('📋 Tablas encontradas en la base de datos:');
        tables.forEach(table => console.log(`  - ${table}`));
        
        return tables;
    } catch (error) {
        console.error('❌ Error verificando tablas:', error.message);
        throw error;
    }
}

/**
 * Verificar estructura de una tabla específica
 */
async function getTableStructure(tableName) {
    try {
        const query = `
            SELECT 
                column_name,
                data_type,
                is_nullable,
                column_default,
                character_maximum_length
            FROM information_schema.columns 
            WHERE table_name = @tableName
            ORDER BY ordinal_position
        `;
        
        const result = await executeQuery(query, { tableName });
        return result.recordset;
    } catch (error) {
        console.error(`❌ Error obteniendo estructura de ${tableName}:`, error.message);
        throw error;
    }
}

module.exports = {
    getConnection,
    closeConnection,
    executeQuery,
    getById,
    getAll,
    insert,
    update,
    deleteRecord,
    checkTables,
    getTableStructure,
    config
};
