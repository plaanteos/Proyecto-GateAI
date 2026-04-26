-- Crear la base de datos Database-uniontech-mejorada si no existe
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'Database-uniontech-mejorada')
BEGIN
    CREATE DATABASE [Database-uniontech-mejorada];
    PRINT 'Base de datos Database-uniontech-mejorada creada exitosamente.';
END
ELSE
BEGIN
    PRINT 'La base de datos Database-uniontech-mejorada ya existe.';
END

-- Cambiar al contexto de la nueva base de datos
USE [Database-uniontech-mejorada];
GO

PRINT 'Conectado a la base de datos Database-uniontech-mejorada.';
PRINT 'Fecha actual: ' + CAST(GETDATE() AS NVARCHAR(50));
PRINT 'Usuario actual: ' + SYSTEM_USER;
GO
