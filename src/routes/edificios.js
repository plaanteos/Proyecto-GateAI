const express = require('express');
const router = express.Router();

// GET /api/edificios - Listar todos los edificios
router.get('/', async (req, res) => {
  try {
    const edificios = await req.prisma.edificios.findMany({
      include: {
        puertas_acceso: true
      }
    });
    res.json(edificios);
  } catch (error) {
    console.error('Error obteniendo edificios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/edificios - Crear nuevo edificio
router.post('/', async (req, res) => {
  try {
    const { nombre, direccion, ciudad, codigo_postal } = req.body;
    
    const nuevoEdificio = await req.prisma.edificios.create({
      data: { nombre, direccion, ciudad, codigo_postal }
    });
    
    res.status(201).json(nuevoEdificio);
  } catch (error) {
    console.error('Error creando edificio:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
