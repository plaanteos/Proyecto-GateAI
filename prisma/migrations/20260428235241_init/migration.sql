-- CreateTable
CREATE TABLE "public"."Personas" (
    "id" SERIAL NOT NULL,
    "documento_identidad" VARCHAR(50) NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "apellido" VARCHAR(100) NOT NULL,
    "fecha_nacimiento" DATE,
    "telefono" VARCHAR(20),
    "email" VARCHAR(100),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fecha_registro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Personas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Roles" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,
    "descripcion" VARCHAR(200),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "Roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Permisos" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "descripcion" VARCHAR(200),
    "modulo" VARCHAR(50) NOT NULL,
    "accion" VARCHAR(50) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "Permisos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RolPermisos" (
    "id" SERIAL NOT NULL,
    "rol_id" INTEGER NOT NULL,
    "permiso_id" INTEGER NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "RolPermisos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UsuarioPermisos" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "permiso_id" INTEGER NOT NULL,
    "otorgado_por" INTEGER,
    "revocado_por" INTEGER,
    "fecha_revocacion" TIMESTAMP(3),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "UsuarioPermisos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Usuarios" (
    "id" SERIAL NOT NULL,
    "persona_id" INTEGER NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "password_hash" VARCHAR(200) NOT NULL,
    "rol_id" INTEGER NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Edificios" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "direccion" VARCHAR(200) NOT NULL,
    "ciudad" VARCHAR(100),
    "codigo_postal" VARCHAR(20),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fecha_registro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Edificios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Puertas_Acceso" (
    "id" SERIAL NOT NULL,
    "edificio_id" INTEGER NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "ubicacion" VARCHAR(100),
    "tipo_acceso" VARCHAR(10) NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Puertas_Acceso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Credenciales" (
    "id" SERIAL NOT NULL,
    "persona_id" INTEGER NOT NULL,
    "tipo_credencial" VARCHAR(20) NOT NULL,
    "identificador" VARCHAR(100) NOT NULL,
    "fecha_emision" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_expiracion" TIMESTAMP(3),
    "estado" VARCHAR(20) NOT NULL DEFAULT 'activa',
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Credenciales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Niveles_Acceso" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "descripcion" VARCHAR(200),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Niveles_Acceso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Persona_Nivel_Acceso" (
    "persona_id" INTEGER NOT NULL,
    "nivel_id" INTEGER NOT NULL,
    "fecha_asignacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "asignado_por" INTEGER,

    CONSTRAINT "Persona_Nivel_Acceso_pkey" PRIMARY KEY ("persona_id","nivel_id")
);

-- CreateTable
CREATE TABLE "public"."Nivel_Acceso_Puerta" (
    "nivel_id" INTEGER NOT NULL,
    "puerta_id" INTEGER NOT NULL,
    "horario_acceso" VARCHAR(50),

    CONSTRAINT "Nivel_Acceso_Puerta_pkey" PRIMARY KEY ("nivel_id","puerta_id")
);

-- CreateTable
CREATE TABLE "public"."Registros_Acceso" (
    "id" SERIAL NOT NULL,
    "credencial_id" INTEGER NOT NULL,
    "puerta_id" INTEGER NOT NULL,
    "fecha_hora" TIMESTAMP(3) NOT NULL,
    "tipo_evento" VARCHAR(10) NOT NULL,
    "motivo_denegacion" VARCHAR(200),
    "metodo_validacion" VARCHAR(20),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Registros_Acceso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Fotos" (
    "id" SERIAL NOT NULL,
    "persona_id" INTEGER NOT NULL,
    "tipo_foto" VARCHAR(10) NOT NULL,
    "url" VARCHAR(200) NOT NULL,
    "hash" VARCHAR(64),
    "fecha_subida" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Fotos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Invitaciones" (
    "id" SERIAL NOT NULL,
    "persona_id" INTEGER NOT NULL,
    "fecha_invitacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_expiracion" TIMESTAMP(3),
    "restricciones" VARCHAR(200),
    "tipo_invitacion" VARCHAR(20) DEFAULT 'visitante',
    "estado" VARCHAR(10) NOT NULL DEFAULT 'pendiente',
    "documentos_requeridos" TEXT,
    "documentos_completados" BOOLEAN NOT NULL DEFAULT false,
    "estado_documentos" VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Invitaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Auditoria" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER,
    "accion" VARCHAR(100) NOT NULL,
    "descripcion" VARCHAR(500),
    "tabla_afectada" VARCHAR(100),
    "registro_id" INTEGER,
    "valores_anteriores" JSONB,
    "valores_nuevos" JSONB,
    "ip_address" VARCHAR(50),
    "user_agent" VARCHAR(500),
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EmpleadosMantenimiento" (
    "id" SERIAL NOT NULL,
    "persona_id" INTEGER NOT NULL,
    "empresa_mantenimiento" VARCHAR(200) NOT NULL,
    "tipo_empleado" VARCHAR(20) NOT NULL,
    "especialidad" VARCHAR(50) NOT NULL,
    "estado" VARCHAR(20) NOT NULL DEFAULT 'ACTIVO',
    "fecha_inicio" TIMESTAMP(3) NOT NULL,
    "fecha_fin" TIMESTAMP(3),
    "fecha_desactivacion" TIMESTAMP(3),
    "motivo_desactivacion" VARCHAR(200),
    "horario_permitido" JSONB,
    "zonas_permitidas" JSONB,
    "documentos_verificacion" JSONB,
    "created_by" INTEGER,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "EmpleadosMantenimiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CredencialesMantenimiento" (
    "id" SERIAL NOT NULL,
    "empleado_id" INTEGER NOT NULL,
    "codigo_qr" VARCHAR(200) NOT NULL,
    "qr_data" JSONB,
    "tipo_credencial" VARCHAR(20) NOT NULL,
    "estado" VARCHAR(20) NOT NULL DEFAULT 'ACTIVA',
    "fecha_expiracion" TIMESTAMP(3),
    "fecha_vencimiento_real" TIMESTAMP(3),
    "motivo_vencimiento" VARCHAR(100),
    "zonas_permitidas" JSONB,
    "horario_permitido" JSONB,
    "usos_permitidos" INTEGER NOT NULL DEFAULT -1,
    "usos_realizados" INTEGER NOT NULL DEFAULT 0,
    "ultimo_acceso" TIMESTAMP(3),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "CredencialesMantenimiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AccesosMantenimiento" (
    "id" SERIAL NOT NULL,
    "credencial_id" INTEGER NOT NULL,
    "puerta_id" INTEGER NOT NULL,
    "tipo_acceso" VARCHAR(10) NOT NULL,
    "fecha_acceso" TIMESTAMP(3) NOT NULL,
    "fecha_salida" TIMESTAMP(3),
    "duracion_visita" INTEGER,
    "metodo_validacion" VARCHAR(20) NOT NULL,
    "ip_address" VARCHAR(50),
    "dispositivo" VARCHAR(200),
    "coordenadas" JSONB,
    "foto_acceso" VARCHAR(500),
    "observaciones" VARCHAR(500),
    "observaciones_salida" VARCHAR(500),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccesosMantenimiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SystemStats" (
    "id" SERIAL NOT NULL,
    "metric_name" VARCHAR(100) NOT NULL,
    "metric_value" DOUBLE PRECISION NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DocumentosInvitacion" (
    "id" SERIAL NOT NULL,
    "invitacion_id" INTEGER NOT NULL,
    "tipo_documento" VARCHAR(50) NOT NULL,
    "nombre_archivo" VARCHAR(255) NOT NULL,
    "ruta_archivo" VARCHAR(500) NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "tamanio_bytes" BIGINT NOT NULL,
    "hash_archivo" VARCHAR(64) NOT NULL,
    "estado" VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
    "verificado_por" INTEGER,
    "fecha_verificacion" TIMESTAMP(3),
    "observaciones" VARCHAR(500),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "DocumentosInvitacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Personas_documento_identidad_key" ON "public"."Personas"("documento_identidad");

-- CreateIndex
CREATE UNIQUE INDEX "Roles_nombre_key" ON "public"."Roles"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Permisos_nombre_key" ON "public"."Permisos"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "RolPermisos_rol_id_permiso_id_key" ON "public"."RolPermisos"("rol_id", "permiso_id");

-- CreateIndex
CREATE UNIQUE INDEX "UsuarioPermisos_usuario_id_permiso_id_key" ON "public"."UsuarioPermisos"("usuario_id", "permiso_id");

-- CreateIndex
CREATE UNIQUE INDEX "Usuarios_username_key" ON "public"."Usuarios"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Credenciales_identificador_key" ON "public"."Credenciales"("identificador");

-- CreateIndex
CREATE UNIQUE INDEX "CredencialesMantenimiento_codigo_qr_key" ON "public"."CredencialesMantenimiento"("codigo_qr");

-- AddForeignKey
ALTER TABLE "public"."RolPermisos" ADD CONSTRAINT "RolPermisos_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "public"."Roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RolPermisos" ADD CONSTRAINT "RolPermisos_permiso_id_fkey" FOREIGN KEY ("permiso_id") REFERENCES "public"."Permisos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UsuarioPermisos" ADD CONSTRAINT "UsuarioPermisos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "public"."Usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UsuarioPermisos" ADD CONSTRAINT "UsuarioPermisos_permiso_id_fkey" FOREIGN KEY ("permiso_id") REFERENCES "public"."Permisos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Usuarios" ADD CONSTRAINT "Usuarios_persona_id_fkey" FOREIGN KEY ("persona_id") REFERENCES "public"."Personas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Usuarios" ADD CONSTRAINT "Usuarios_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "public"."Roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Puertas_Acceso" ADD CONSTRAINT "Puertas_Acceso_edificio_id_fkey" FOREIGN KEY ("edificio_id") REFERENCES "public"."Edificios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Credenciales" ADD CONSTRAINT "Credenciales_persona_id_fkey" FOREIGN KEY ("persona_id") REFERENCES "public"."Personas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Persona_Nivel_Acceso" ADD CONSTRAINT "Persona_Nivel_Acceso_persona_id_fkey" FOREIGN KEY ("persona_id") REFERENCES "public"."Personas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Persona_Nivel_Acceso" ADD CONSTRAINT "Persona_Nivel_Acceso_nivel_id_fkey" FOREIGN KEY ("nivel_id") REFERENCES "public"."Niveles_Acceso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Persona_Nivel_Acceso" ADD CONSTRAINT "Persona_Nivel_Acceso_asignado_por_fkey" FOREIGN KEY ("asignado_por") REFERENCES "public"."Personas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."Nivel_Acceso_Puerta" ADD CONSTRAINT "Nivel_Acceso_Puerta_nivel_id_fkey" FOREIGN KEY ("nivel_id") REFERENCES "public"."Niveles_Acceso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Nivel_Acceso_Puerta" ADD CONSTRAINT "Nivel_Acceso_Puerta_puerta_id_fkey" FOREIGN KEY ("puerta_id") REFERENCES "public"."Puertas_Acceso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Registros_Acceso" ADD CONSTRAINT "Registros_Acceso_credencial_id_fkey" FOREIGN KEY ("credencial_id") REFERENCES "public"."Credenciales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Registros_Acceso" ADD CONSTRAINT "Registros_Acceso_puerta_id_fkey" FOREIGN KEY ("puerta_id") REFERENCES "public"."Puertas_Acceso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Fotos" ADD CONSTRAINT "Fotos_persona_id_fkey" FOREIGN KEY ("persona_id") REFERENCES "public"."Personas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Invitaciones" ADD CONSTRAINT "Invitaciones_persona_id_fkey" FOREIGN KEY ("persona_id") REFERENCES "public"."Personas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Auditoria" ADD CONSTRAINT "Auditoria_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "public"."Usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EmpleadosMantenimiento" ADD CONSTRAINT "EmpleadosMantenimiento_persona_id_fkey" FOREIGN KEY ("persona_id") REFERENCES "public"."Personas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CredencialesMantenimiento" ADD CONSTRAINT "CredencialesMantenimiento_empleado_id_fkey" FOREIGN KEY ("empleado_id") REFERENCES "public"."EmpleadosMantenimiento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AccesosMantenimiento" ADD CONSTRAINT "AccesosMantenimiento_credencial_id_fkey" FOREIGN KEY ("credencial_id") REFERENCES "public"."CredencialesMantenimiento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AccesosMantenimiento" ADD CONSTRAINT "AccesosMantenimiento_puerta_id_fkey" FOREIGN KEY ("puerta_id") REFERENCES "public"."Puertas_Acceso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentosInvitacion" ADD CONSTRAINT "DocumentosInvitacion_invitacion_id_fkey" FOREIGN KEY ("invitacion_id") REFERENCES "public"."Invitaciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentosInvitacion" ADD CONSTRAINT "DocumentosInvitacion_verificado_por_fkey" FOREIGN KEY ("verificado_por") REFERENCES "public"."Usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
