# 🔧 GUÍA DE SOLUCIÓN DE PROBLEMAS - CONEXIÓN SQL SERVER

## ✅ VERIFICACIONES EN SQL SERVER MANAGEMENT STUDIO (SSMS)

### 1. **Verificar que SQL Server esté ejecutándose**
   - Abrir SQL Server Configuration Manager
   - Services → SQL Server (MSSQLSERVER) debe estar "Running"
   - SQL Server Browser debe estar "Running"

### 2. **Habilitar autenticación mixta (Windows + SQL Server)**
   ```sql
   -- En SSMS, ejecutar:
   -- 1. Click derecho en servidor → Properties → Security
   -- 2. Seleccionar "SQL Server and Windows Authentication mode"
   -- 3. Reiniciar SQL Server service
   ```

### 3. **Crear/Verificar usuario uniontech_user**
   ```sql
   -- 1. Crear login si no existe:
   USE master;
   CREATE LOGIN uniontech_user WITH PASSWORD = 'UnionTech2025!';
   
   -- 2. Crear usuario en la base de datos:
   USE [Database-uniontech-mejorada];
   CREATE USER uniontech_user FOR LOGIN uniontech_user;
   
   -- 3. Asignar permisos:
   ALTER ROLE db_owner ADD MEMBER uniontech_user;
   ```

### 4. **Habilitar TCP/IP en SQL Server**
   - SQL Server Configuration Manager
   - SQL Server Network Configuration → Protocols
   - TCP/IP → Enable
   - Reiniciar SQL Server

### 5. **Verificar puerto 1433**
   ```sql
   -- Verificar que SQL Server escuche en puerto 1433:
   SELECT DISTINCT local_net_address, local_tcp_port 
   FROM sys.dm_exec_connections 
   WHERE local_net_address IS NOT NULL;
   ```

### 6. **Configurar Firewall de Windows**
   - Permitir puerto 1433 TCP entrante
   - Permitir "SQL Server Browser" en programas

---

## 🎯 COMANDOS DE VERIFICACIÓN RÁPIDA

### Verificar conexión desde Command Line:
```bash
sqlcmd -S localhost -U uniontech_user -P UnionTech2025! -d Database-uniontech-mejorada -Q "SELECT @@VERSION"
```

### Verificar tablas existentes:
```sql
SELECT name FROM sys.tables ORDER BY name;
```

### Verificar permisos del usuario:
```sql
SELECT 
    p.principal_id,
    p.name AS principal_name,
    p.type_desc AS principal_type,
    r.role_principal_id,
    r.name AS role_name
FROM sys.database_role_members rm
JOIN sys.database_principals p ON rm.member_principal_id = p.principal_id
JOIN sys.database_principals r ON rm.role_principal_id = r.principal_id
WHERE p.name = 'uniontech_user';
```

---

## ⚡ SOLUCIONES RÁPIDAS COMUNES

### Error: "Login failed for user"
- Verificar contraseña en .env
- Asegurar que el usuario existe en SQL Server
- Verificar autenticación mixta habilitada

### Error: "A network-related or instance-specific error"
- Verificar que SQL Server esté ejecutándose
- Comprobar TCP/IP habilitado
- Verificar firewall

### Error: "Cannot open database"
- Verificar que la base de datos existe
- Comprobar permisos del usuario en la base de datos
- Verificar nombre exacto de la base de datos

---

## 📱 CONFIGURACIÓN ALTERNATIVA (.env)

Si usas instancia nombrada de SQL Server:
```env
DATABASE_SERVER=localhost\\SQLEXPRESS
DATABASE_NAME=Database-uniontech-mejorada
DATABASE_PORT=1433
```

Si usas Windows Authentication:
```env
DATABASE_SERVER=localhost
DATABASE_NAME=Database-uniontech-mejorada
# No incluir USERNAME/PASSWORD para Windows Auth
DATABASE_TRUSTED_CONNECTION=true
```
