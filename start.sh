#!/bin/sh

echo "=== UNIONTECH STARTUP ==="
echo "NODE_ENV: $NODE_ENV"
echo "DATABASE_URL set: $([ -n "$DATABASE_URL" ] && echo 'YES' || echo 'NO')"

echo "--- Ejecutando migraciones ---"
npx prisma migrate deploy 2>&1 || echo "WARN: migrate deploy falló, continuando..."

echo "--- Creando usuario admin ---"
node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function seed() {
  try {
    // Verificar si ya existe admin
    const existing = await prisma.usuarios.findFirst({ where: { username: 'admin' } });
    if (existing) {
      console.log('✅ Usuario admin ya existe');
      return;
    }

    const hash = await bcrypt.hash('Admin2026!', 10);

    // Crear persona
    const persona = await prisma.personas.create({
      data: {
        nombre: 'Administrador',
        apellido: 'Sistema',
        documento_identidad: 'ADMIN001',
        email: 'admin@uniontech.com'
      }
    });

    // Obtener o crear rol super_admin
    let rol = await prisma.roles.findFirst({ where: { nombre: 'super_admin' } });
    if (!rol) {
      rol = await prisma.roles.create({ data: { nombre: 'super_admin', descripcion: 'Administrador del sistema' } });
    }

    // Crear usuario
    await prisma.usuarios.create({
      data: {
        username: 'admin',
        password_hash: hash,
        persona_id: persona.id,
        rol_id: rol.id,
        activo: true
      }
    });

    console.log('✅ Usuario admin creado: admin / Admin2026!');
  } catch (e) {
    console.warn('⚠️ No se pudo crear admin:', e.message);
  } finally {
    await prisma.\$disconnect();
  }
}

seed();
" 2>&1 || echo "WARN: Seed falló, continuando..."

echo "--- Iniciando servidor ---"
exec node src/server-complete.js
