const express = require('express');
const router = express.Router();

// Ruta simple de prueba
router.get('/test', (req, res) => {
  res.json({ message: 'Auth test funcionando' });
});

module.exports = router;
