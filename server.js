const express = require('express');

const app = express();

// Configurar rutas
app.get('/', (req, res) => {
  res.send('¡Tu frontend está funcionando detrás de Apache!');
});

// Iniciar servidor HTTP en el puerto 8080
const PORT = 8080;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
