-- Migración: Documentos de Invitaciones
-- Motor: PostgreSQL
-- Fecha: 2026-04-28

CREATE TABLE IF NOT EXISTS "DocumentosInvitacion" (
    id                 SERIAL PRIMARY KEY,
    invitacion_id      INTEGER NOT NULL REFERENCES "Invitaciones"(id),
    tipo_documento     VARCHAR(50) NOT NULL,
    nombre_archivo     VARCHAR(255) NOT NULL,
    ruta_archivo       VARCHAR(500) NOT NULL,
    mime_type          VARCHAR(100) NOT NULL,
    tamanio_bytes      BIGINT NOT NULL,
    hash_archivo       VARCHAR(64) NOT NULL,
    estado             VARCHAR(20) DEFAULT 'PENDIENTE',
    verificado_por     INTEGER REFERENCES "Usuarios"(id),
    fecha_verificacion TIMESTAMP,
    observaciones      VARCHAR(500),
    metadata           JSONB,
    created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP,
    deleted_at         TIMESTAMP
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_docs_invitacion_id ON "DocumentosInvitacion"(invitacion_id);
CREATE INDEX IF NOT EXISTS idx_docs_estado        ON "DocumentosInvitacion"(estado);
CREATE INDEX IF NOT EXISTS idx_docs_hash          ON "DocumentosInvitacion"(hash_archivo);

-- Agregar columnas a Invitaciones si no existen
ALTER TABLE "Invitaciones"
  ADD COLUMN IF NOT EXISTS documentos_completados BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS estado_documentos      VARCHAR(20) DEFAULT 'PENDIENTE';


-- Crear tabla para documentos de invitaciones
CREATE TABLE DocumentosInvitacion (
    id INT IDENTITY(1,1) PRIMARY KEY,
    invitacion_id INT NOT NULL,
    tipo_documento NVARCHAR(50) NOT NULL, -- 'IDENTIFICACION', 'CONTRATO', 'SEGURO', 'CERTIFICACION'
    nombre_archivo NVARCHAR(255) NOT NULL,
    ruta_archivo NVARCHAR(500) NOT NULL,
    mime_type NVARCHAR(100) NOT NULL,
    tamanio_bytes BIGINT NOT NULL,
    hash_archivo NVARCHAR(64) NOT NULL, -- SHA-256 del archivo para verificación
    estado NVARCHAR(20) DEFAULT 'PENDIENTE', -- 'PENDIENTE', 'VERIFICADO', 'RECHAZADO'
    verificado_por INT NULL,
    fecha_verificacion DATETIME2 NULL,
    observaciones NVARCHAR(500) NULL,
    metadata NVARCHAR(MAX) NULL, -- JSON con metadata adicional
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 NULL,
    deleted_at DATETIME2 NULL,
    
    CONSTRAINT FK_DocumentosInvitacion_Invitacion 
        FOREIGN KEY (invitacion_id) REFERENCES Invitaciones(id),
    CONSTRAINT FK_DocumentosInvitacion_Verificador 
        FOREIGN KEY (verificado_por) REFERENCES Usuarios(id)
);

-- Crear índices para optimización
CREATE INDEX IX_DocumentosInvitacion_InvitacionId ON DocumentosInvitacion(invitacion_id);
CREATE INDEX IX_DocumentosInvitacion_TipoDocumento ON DocumentosInvitacion(tipo_documento);
CREATE INDEX IX_DocumentosInvitacion_Estado ON DocumentosInvitacion(estado);
CREATE INDEX IX_DocumentosInvitacion_FechaCreacion ON DocumentosInvitacion(created_at);

-- Extender tabla Invitaciones con campos adicionales
ALTER TABLE Invitaciones 
ADD documentos_requeridos NVARCHAR(MAX) NULL, -- JSON array con tipos de documentos requeridos
    documentos_completados BIT DEFAULT 0, -- Flag para indicar si todos los documentos están subidos
    estado_documentos NVARCHAR(20) DEFAULT 'PENDIENTE'; -- 'PENDIENTE', 'PARCIAL', 'COMPLETO', 'VERIFICADO'

-- Agregar índices a los nuevos campos
CREATE INDEX IX_Invitaciones_EstadoDocumentos ON Invitaciones(estado_documentos);
CREATE INDEX IX_Invitaciones_DocumentosCompletados ON Invitaciones(documentos_completados);

-- Comentarios para documentación
EXEC sp_addextendedproperty 'MS_Description', 'Documentos adjuntos a las invitaciones de visitantes', 'SCHEMA', 'dbo', 'TABLE', 'DocumentosInvitacion';
EXEC sp_addextendedproperty 'MS_Description', 'Tipo de documento: IDENTIFICACION, CONTRATO, SEGURO, CERTIFICACION', 'SCHEMA', 'dbo', 'TABLE', 'DocumentosInvitacion', 'COLUMN', 'tipo_documento';
EXEC sp_addextendedproperty 'MS_Description', 'Hash SHA-256 del archivo para verificación de integridad', 'SCHEMA', 'dbo', 'TABLE', 'DocumentosInvitacion', 'COLUMN', 'hash_archivo';