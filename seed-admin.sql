-- Seed: usuario super_admin inicial
-- Usuario: admin | Contraseña: Admin2026!

INSERT INTO "Personas" (documento_identidad, nombre, apellido, email, activo)
VALUES ('ADMIN001', 'Super', 'Admin', 'admin@uniontech.com', true)
ON CONFLICT (documento_identidad) DO NOTHING;

INSERT INTO "Usuarios" (persona_id, username, password_hash, rol_id, activo)
SELECT p.id,
       'admin',
       '$2b$10$3XrAODH9owtG7f3QIooPN.wfkwivbXh77LVtq66g1uCtKFCRZly5S',
       r.id,
       true
FROM "Personas" p
JOIN "Roles" r ON r.nombre = 'super_admin'
WHERE p.documento_identidad = 'ADMIN001'
ON CONFLICT (username) DO NOTHING;
