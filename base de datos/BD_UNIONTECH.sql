DROP DATABASE IF EXISTS `UnionTech`;
CREATE DATABASE `UnionTech`;
USE `UnionTech`;

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