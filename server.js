const https = require('https');
const fs = require('fs');
const express = require('express');

const app = express();

// Configurar rutas (modifica según tu app)
app.get('/', (req, res) => {
  res.send('¡Tu frontend está funcionando en HTTPS!');
});

// Cargar certificados SSL
const options = {
  key: fs.readFileSync('/etc/letsencrypt/live/sv-hol0uzz7c3.cloud.elastika.pe/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/sv-hol0uzz7c3.cloud.elastika.pe/fullchain.pem')
};

// Iniciar servidor HTTPS en el puerto 443
https.createServer(options, app).listen(443, () => {
  console.log('Servidor HTTPS corriendo en el puerto 443');
});
