-- ============================================================
-- UnionTech - Base de Datos PostgreSQL
-- Sincronizado con prisma/schema.prisma
-- Ejecutar con: psql -U postgres -f BD_UNIONTECH.sql
-- ============================================================

-- Crear base de datos (ejecutar conectado a postgres)
-- CREATE DATABASE uniontech_db;
-- \c uniontech_db

-- ============================================================
-- TIPOS ENUM
-- ============================================================
DO $$ BEGIN
  CREATE TYPE tipo_acceso_enum AS ENUM ('entrada', 'salida', 'ambos');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE tipo_credencial_enum AS ENUM ('qr', 'facial', 'dni');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE estado_credencial_enum AS ENUM ('pendiente', 'activa', 'revocada', 'expirada');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE tipo_evento_enum AS ENUM ('entrada', 'salida', 'denegado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE metodo_validacion_enum AS ENUM ('facial', 'qr', 'dni');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE tipo_foto_enum AS ENUM ('dni', 'rostro');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- TABLAS BASE (sin dependencias)
-- ============================================================

CREATE TABLE IF NOT EXISTS "Roles" (
  id          SERIAL PRIMARY KEY,
  nombre      VARCHAR(50) UNIQUE NOT NULL,
  descripcion VARCHAR(200),
  activo      BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Permisos" (
  id          SERIAL PRIMARY KEY,
  nombre      VARCHAR(100) UNIQUE NOT NULL,
  descripcion VARCHAR(200),
  modulo      VARCHAR(50) NOT NULL,
  accion      VARCHAR(50) NOT NULL,
  activo      BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Edificios" (
  id             SERIAL PRIMARY KEY,
  nombre         VARCHAR(100) NOT NULL,
  direccion      VARCHAR(200) NOT NULL,
  ciudad         VARCHAR(100),
  codigo_postal  VARCHAR(20),
  activo         BOOLEAN DEFAULT TRUE,
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP,
  deleted_at     TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Niveles_Acceso" (
  id          SERIAL PRIMARY KEY,
  nombre      VARCHAR(100) NOT NULL,
  descripcion VARCHAR(200),
  activo      BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP,
  deleted_at  TIMESTAMP
);

-- ============================================================
-- PERSONAS Y USUARIOS
-- ============================================================

CREATE TABLE IF NOT EXISTS "Personas" (
  id                  SERIAL PRIMARY KEY,
  documento_identidad VARCHAR(50) UNIQUE NOT NULL,
  nombre              VARCHAR(100) NOT NULL,
  apellido            VARCHAR(100) NOT NULL,
  fecha_nacimiento    DATE,
  telefono            VARCHAR(20),
  email               VARCHAR(100),
  activo              BOOLEAN DEFAULT TRUE,
  fecha_registro      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP,
  deleted_at          TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Usuarios" (
  id            SERIAL PRIMARY KEY,
  persona_id    INTEGER NOT NULL REFERENCES "Personas"(id),
  username      VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(200) NOT NULL,
  rol_id        INTEGER NOT NULL REFERENCES "Roles"(id),
  activo        BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP,
  deleted_at    TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "RolPermisos" (
  id         SERIAL PRIMARY KEY,
  rol_id     INTEGER NOT NULL REFERENCES "Roles"(id),
  permiso_id INTEGER NOT NULL REFERENCES "Permisos"(id),
  activo     BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP,
  UNIQUE(rol_id, permiso_id)
);

CREATE TABLE IF NOT EXISTS "UsuarioPermisos" (
  id               SERIAL PRIMARY KEY,
  usuario_id       INTEGER NOT NULL REFERENCES "Usuarios"(id),
  permiso_id       INTEGER NOT NULL REFERENCES "Permisos"(id),
  otorgado_por     INTEGER,
  revocado_por     INTEGER,
  fecha_revocacion TIMESTAMP,
  activo           BOOLEAN DEFAULT TRUE,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP,
  UNIQUE(usuario_id, permiso_id)
);

-- ============================================================
-- CONTROL DE ACCESOS
-- ============================================================

CREATE TABLE IF NOT EXISTS "Puertas_Acceso" (
  id          SERIAL PRIMARY KEY,
  edificio_id INTEGER NOT NULL REFERENCES "Edificios"(id),
  nombre      VARCHAR(100) NOT NULL,
  ubicacion   VARCHAR(100),
  tipo_acceso VARCHAR(10) NOT NULL CHECK (tipo_acceso IN ('entrada', 'salida', 'ambos')),
  activa      BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP,
  deleted_at  TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Credenciales" (
  id               SERIAL PRIMARY KEY,
  persona_id       INTEGER NOT NULL REFERENCES "Personas"(id),
  tipo_credencial  VARCHAR(20) NOT NULL CHECK (tipo_credencial IN ('qr', 'facial', 'dni')),
  identificador    VARCHAR(100) UNIQUE NOT NULL,
  fecha_emision    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_expiracion TIMESTAMP,
  estado           VARCHAR(20) NOT NULL DEFAULT 'activa'
                   CHECK (estado IN ('pendiente', 'activa', 'revocada', 'expirada')),
  activa           BOOLEAN DEFAULT TRUE,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP,
  deleted_at       TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Persona_Nivel_Acceso" (
  persona_id       INTEGER NOT NULL REFERENCES "Personas"(id) ON DELETE CASCADE,
  nivel_id         INTEGER NOT NULL REFERENCES "Niveles_Acceso"(id) ON DELETE CASCADE,
  fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  asignado_por     INTEGER REFERENCES "Personas"(id),
  PRIMARY KEY (persona_id, nivel_id)
);

CREATE TABLE IF NOT EXISTS "Nivel_Acceso_Puerta" (
  nivel_id       INTEGER NOT NULL REFERENCES "Niveles_Acceso"(id),
  puerta_id      INTEGER NOT NULL REFERENCES "Puertas_Acceso"(id),
  horario_acceso VARCHAR(50),
  PRIMARY KEY (nivel_id, puerta_id)
);

CREATE TABLE IF NOT EXISTS "Registros_Acceso" (
  id                SERIAL PRIMARY KEY,
  credencial_id     INTEGER NOT NULL REFERENCES "Credenciales"(id),
  puerta_id         INTEGER NOT NULL REFERENCES "Puertas_Acceso"(id),
  fecha_hora        TIMESTAMP NOT NULL,
  tipo_evento       VARCHAR(10) NOT NULL CHECK (tipo_evento IN ('entrada', 'salida', 'denegado')),
  motivo_denegacion VARCHAR(200),
  metodo_validacion VARCHAR(20) CHECK (metodo_validacion IN ('facial', 'qr', 'dni')),
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Fotos" (
  id           SERIAL PRIMARY KEY,
  persona_id   INTEGER NOT NULL REFERENCES "Personas"(id),
  tipo_foto    VARCHAR(10) NOT NULL CHECK (tipo_foto IN ('dni', 'rostro')),
  url          VARCHAR(200) NOT NULL,
  hash         VARCHAR(64),
  fecha_subida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- INVITACIONES Y DOCUMENTOS
-- ============================================================

CREATE TABLE IF NOT EXISTS "Invitaciones" (
  id                     SERIAL PRIMARY KEY,
  persona_id             INTEGER NOT NULL REFERENCES "Personas"(id),
  fecha_invitacion       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_expiracion       TIMESTAMP,
  restricciones          VARCHAR(200),
  tipo_invitacion        VARCHAR(20) DEFAULT 'visitante',
  estado                 VARCHAR(10) DEFAULT 'pendiente',
  documentos_requeridos  TEXT,
  documentos_completados BOOLEAN DEFAULT FALSE,
  estado_documentos      VARCHAR(20) DEFAULT 'PENDIENTE',
  created_at             TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at             TIMESTAMP,
  deleted_at             TIMESTAMP
);

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

-- ============================================================
-- MANTENIMIENTO
-- ============================================================

CREATE TABLE IF NOT EXISTS "EmpleadosMantenimiento" (
  id                    SERIAL PRIMARY KEY,
  persona_id            INTEGER NOT NULL REFERENCES "Personas"(id),
  empresa_mantenimiento VARCHAR(200) NOT NULL,
  tipo_empleado         VARCHAR(20) NOT NULL
                        CHECK (tipo_empleado IN ('TEMPORAL', 'RECURRENTE', 'PERMANENTE')),
  especialidad          VARCHAR(50) NOT NULL
                        CHECK (especialidad IN ('JARDINERIA','PLOMERIA','ELECTRICIDAD','LIMPIEZA','SEGURIDAD','GENERAL')),
  estado                VARCHAR(20) DEFAULT 'ACTIVO',
  fecha_inicio          TIMESTAMP NOT NULL,
  fecha_fin             TIMESTAMP,
  fecha_desactivacion   TIMESTAMP,
  motivo_desactivacion  VARCHAR(200),
  horario_permitido     JSONB,
  zonas_permitidas      JSONB,
  documentos_verificacion JSONB,
  created_by            INTEGER,
  metadata              JSONB,
  created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "CredencialesMantenimiento" (
  id                     SERIAL PRIMARY KEY,
  empleado_id            INTEGER NOT NULL REFERENCES "EmpleadosMantenimiento"(id),
  codigo_qr              VARCHAR(200) UNIQUE NOT NULL,
  qr_data                JSONB,
  tipo_credencial        VARCHAR(20) NOT NULL,
  estado                 VARCHAR(20) DEFAULT 'ACTIVA',
  fecha_expiracion       TIMESTAMP,
  fecha_vencimiento_real TIMESTAMP,
  motivo_vencimiento     VARCHAR(100),
  zonas_permitidas       JSONB,
  horario_permitido      JSONB,
  usos_permitidos        INTEGER DEFAULT -1,
  usos_realizados        INTEGER DEFAULT 0,
  ultimo_acceso          TIMESTAMP,
  metadata               JSONB,
  created_at             TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at             TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "AccesosMantenimiento" (
  id                   SERIAL PRIMARY KEY,
  credencial_id        INTEGER NOT NULL REFERENCES "CredencialesMantenimiento"(id),
  puerta_id            INTEGER NOT NULL REFERENCES "Puertas_Acceso"(id),
  tipo_acceso          VARCHAR(10) NOT NULL CHECK (tipo_acceso IN ('ENTRADA', 'SALIDA')),
  fecha_acceso         TIMESTAMP NOT NULL,
  fecha_salida         TIMESTAMP,
  duracion_visita      INTEGER,
  metodo_validacion    VARCHAR(20) NOT NULL,
  ip_address           VARCHAR(50),
  dispositivo          VARCHAR(200),
  coordenadas          JSONB,
  foto_acceso          VARCHAR(500),
  observaciones        VARCHAR(500),
  observaciones_salida VARCHAR(500),
  metadata             JSONB,
  created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- AUDITORÍA Y MÉTRICAS
-- ============================================================

CREATE TABLE IF NOT EXISTS "Auditoria" (
  id               SERIAL PRIMARY KEY,
  usuario_id       INTEGER REFERENCES "Usuarios"(id),
  accion           VARCHAR(100) NOT NULL,
  descripcion      VARCHAR(500),
  tabla_afectada   VARCHAR(100),
  registro_id      INTEGER,
  valores_anteriores JSONB,
  valores_nuevos   JSONB,
  ip_address       VARCHAR(50),
  user_agent       VARCHAR(500),
  fecha            TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "SystemStats" (
  id           SERIAL PRIMARY KEY,
  metric_name  VARCHAR(100) NOT NULL,
  metric_value DOUBLE PRECISION NOT NULL,
  metadata     JSONB,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- ÍNDICES DE RENDIMIENTO
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_personas_documento    ON "Personas"(documento_identidad);
CREATE INDEX IF NOT EXISTS idx_personas_email        ON "Personas"(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_username     ON "Usuarios"(username);
CREATE INDEX IF NOT EXISTS idx_usuarios_persona      ON "Usuarios"(persona_id);
CREATE INDEX IF NOT EXISTS idx_credenciales_activas  ON "Credenciales"(identificador, activa);
CREATE INDEX IF NOT EXISTS idx_credenciales_persona  ON "Credenciales"(persona_id);
CREATE INDEX IF NOT EXISTS idx_registros_credencial  ON "Registros_Acceso"(credencial_id, fecha_hora);
CREATE INDEX IF NOT EXISTS idx_registros_puerta      ON "Registros_Acceso"(puerta_id, fecha_hora);
CREATE INDEX IF NOT EXISTS idx_registros_fecha       ON "Registros_Acceso"(fecha_hora DESC);
CREATE INDEX IF NOT EXISTS idx_auditoria_usuario     ON "Auditoria"(usuario_id, fecha);
CREATE INDEX IF NOT EXISTS idx_auditoria_fecha       ON "Auditoria"(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_invitaciones_persona  ON "Invitaciones"(persona_id);
CREATE INDEX IF NOT EXISTS idx_invitaciones_estado   ON "Invitaciones"(estado);
CREATE INDEX IF NOT EXISTS idx_emp_mant_estado       ON "EmpleadosMantenimiento"(estado);
CREATE INDEX IF NOT EXISTS idx_cred_mant_qr          ON "CredencialesMantenimiento"(codigo_qr);
CREATE INDEX IF NOT EXISTS idx_accesos_mant_fecha    ON "AccesosMantenimiento"(fecha_acceso DESC);

-- ============================================================
-- DATOS INICIALES (roles y permisos del sistema)
-- ============================================================

INSERT INTO "Roles" (nombre, descripcion) VALUES
  ('super_admin', 'Administrador total del sistema'),
  ('admin',       'Administrador con acceso completo'),
  ('security',    'Personal de seguridad'),
  ('receptionist','Recepcionista'),
  ('maintenance', 'Personal de mantenimiento'),
  ('user',        'Usuario estándar')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO "Permisos" (nombre, descripcion, modulo, accion) VALUES
  ('users.read',         'Ver usuarios',               'users',        'read'),
  ('users.create',       'Crear usuarios',             'users',        'create'),
  ('users.update',       'Editar usuarios',            'users',        'update'),
  ('users.delete',       'Eliminar usuarios',          'users',        'delete'),
  ('visitors.read',      'Ver visitantes',             'visitors',     'read'),
  ('visitors.create',    'Crear visitantes',           'visitors',     'create'),
  ('visitors.update',    'Editar visitantes',          'visitors',     'update'),
  ('visitors.delete',    'Eliminar visitantes',        'visitors',     'delete'),
  ('access.read',        'Ver accesos',                'access',       'read'),
  ('access.validate',    'Validar accesos',            'access',       'validate'),
  ('access.manage',      'Gestionar accesos',          'access',       'manage'),
  ('buildings.read',     'Ver edificios',              'buildings',    'read'),
  ('buildings.create',   'Crear edificios',            'buildings',    'create'),
  ('buildings.update',   'Editar edificios',           'buildings',    'update'),
  ('buildings.delete',   'Eliminar edificios',         'buildings',    'delete'),
  ('maintenance.read',   'Ver mantenimiento',          'maintenance',  'read'),
  ('maintenance.create', 'Crear empleados mantto.',    'maintenance',  'create'),
  ('maintenance.update', 'Editar empleados mantto.',   'maintenance',  'update'),
  ('maintenance.delete', 'Eliminar empleados mantto.', 'maintenance',  'delete'),
  ('reports.read',       'Ver reportes',               'reports',      'read'),
  ('reports.export',     'Exportar reportes',          'reports',      'export'),
  ('security.read',      'Ver logs de seguridad',      'security',     'read'),
  ('security.manage',    'Gestionar seguridad',        'security',     'manage'),
  ('dashboard.read',     'Ver dashboard',              'dashboard',    'read'),
  ('dashboard.realtime', 'Dashboard en tiempo real',   'dashboard',    'realtime'),
  ('notifications.send', 'Enviar notificaciones',      'notifications','send'),
  ('qr.generate',        'Generar códigos QR',         'qr',           'generate'),
  ('qr.validate',        'Validar códigos QR',         'qr',           'validate')
ON CONFLICT (nombre) DO NOTHING;


CREATE TABLE `Personas` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `rol_id` INT NOT NULL,
  `documento_identidad` VARCHAR(50) UNIQUE NOT NULL,
  `nombre` VARCHAR(100) NOT NULL,
  `apellido` VARCHAR(100) NOT NULL,
  `username` VARCHAR(50) UNIQUE NOT NULL,
  `password_hash` VARCHAR(200) NOT NULL,
  `fecha_nacimiento` DATE,
  `telefono` VARCHAR(20),
  `email` VARCHAR(100),
  `activo` BIT DEFAULT 1,
  `fecha_registro` DATETIME DEFAULT (CURRENT_TIMESTAMP),
  `created_at` DATETIME DEFAULT (CURRENT_TIMESTAMP),
  `updated_at` DATETIME,
  `deleted_at` DATETIME
);

CREATE TABLE `Roles` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre` VARCHAR(50) UNIQUE NOT NULL,
  `descripcion` VARCHAR(200)
);

CREATE TABLE `Edificios` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre` VARCHAR(100) NOT NULL,
  `direccion` VARCHAR(200) NOT NULL,
  `ciudad` VARCHAR(100),
  `codigo_postal` VARCHAR(20),
  `activo` BIT DEFAULT 1,
  `fecha_registro` DATETIME DEFAULT (CURRENT_TIMESTAMP),
  `created_at` DATETIME DEFAULT (CURRENT_TIMESTAMP),
  `updated_at` DATETIME,
  `deleted_at` DATETIME
);

CREATE TABLE `Puertas_Acceso` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `edificio_id` INT NOT NULL,
  `nombre` VARCHAR(100) NOT NULL,
  `piso` int NOT NULL,
  `tipo_acceso` ENUM ('entrada', 'salida', 'ambos') NOT NULL,
  `activa` BIT DEFAULT 1,
  `created_at` DATETIME DEFAULT (CURRENT_TIMESTAMP),
  `updated_at` DATETIME,
  `deleted_at` DATETIME
);

CREATE TABLE `Credenciales` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `persona_id` INT NOT NULL,
  `tipo_credencial` ENUM ('qr', 'facial', 'dni') NOT NULL,
  `identificador` VARCHAR(100) UNIQUE NOT NULL,
  `fecha_emision` DATETIME DEFAULT (CURRENT_TIMESTAMP),
  `fecha_expiracion` DATETIME,
  `estado` ENUM ('pendiente', 'activa', 'revocada', 'expirada') NOT NULL DEFAULT 'activa',
  `activa` BIT DEFAULT 1,
  `created_at` DATETIME DEFAULT (CURRENT_TIMESTAMP),
  `updated_at` DATETIME,
  `deleted_at` DATETIME
);

CREATE TABLE `Persona_Acceso` (
  `asignado_por` INT,
  `persona_id` INT NOT NULL,
  `puerta_id` INT NOT NULL,
  `fecha_asignacion` DATETIME DEFAULT (CURRENT_TIMESTAMP),
  PRIMARY KEY (`persona_id`, `puerta_id`)
);

CREATE TABLE `Registros_Acceso` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `credencial_id` INT NOT NULL,
  `puerta_id` INT NOT NULL,
  `fecha_hora` DATETIME NOT NULL,
  `tipo_evento` ENUM ('entrada', 'salida', 'denegado') NOT NULL,
  `motivo_denegacion` VARCHAR(200),
  `metodo_validacion` ENUM ('facial', 'qr', 'dni'),
  `created_at` DATETIME DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE `Fotos` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `persona_id` INT NOT NULL,
  `tipo_foto` ENUM ('dni', 'rostro') NOT NULL,
  `url` VARCHAR(200) NOT NULL,
  `hash` VARCHAR(64),
  `fecha_subida` DATETIME DEFAULT (CURRENT_TIMESTAMP),
  `created_at` DATETIME DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE `Auditoria` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `usuario_id` INT,
  `accion` VARCHAR(100) NOT NULL,
  `descripcion` VARCHAR(500),
  `fecha` DATETIME DEFAULT (CURRENT_TIMESTAMP)
);

CREATE INDEX `idx_personas_documento` ON `Personas` (`documento_identidad`);
CREATE INDEX `idx_credenciales_activas` ON `Credenciales` (`identificador`, `activa`);
CREATE INDEX `idx_registros_acceso_credencial` ON `Registros_Acceso` (`credencial_id`, `fecha_hora`);
CREATE INDEX `idx_registros_acceso_puerta` ON `Registros_Acceso` (`puerta_id`, `fecha_hora`);
CREATE INDEX `idx_auditoria_usuario` ON `Auditoria` (`usuario_id`, `fecha`);

ALTER TABLE `Personas` ADD FOREIGN KEY (`rol_id`) REFERENCES `Roles` (`id`);
ALTER TABLE `Puertas_Acceso` ADD FOREIGN KEY (`edificio_id`) REFERENCES `Edificios` (`id`);
ALTER TABLE `Credenciales` ADD FOREIGN KEY (`persona_id`) REFERENCES `Personas` (`id`);
ALTER TABLE `Persona_Acceso` ADD FOREIGN KEY (`persona_id`) REFERENCES `Personas` (`id`);
ALTER TABLE `Persona_Acceso` ADD FOREIGN KEY (`puerta_id`) REFERENCES `Puertas_Acceso` (`id`);
ALTER TABLE `Persona_Acceso` ADD FOREIGN KEY (`asignado_por`) REFERENCES `Personas` (`id`);
ALTER TABLE `Registros_Acceso` ADD FOREIGN KEY (`credencial_id`) REFERENCES `Credenciales` (`id`);
ALTER TABLE `Registros_Acceso` ADD FOREIGN KEY (`puerta_id`) REFERENCES `Puertas_Acceso` (`id`);
ALTER TABLE `Fotos` ADD FOREIGN KEY (`persona_id`) REFERENCES `Personas` (`id`);