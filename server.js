const express = require("express");
const path = require("path");

const app = express();

// Puerto donde se ejecutará el servidor
const PORT = 8080;

// Ruta para servir los archivos estáticos
const staticPath = path.join(__dirname, "webapp");

// Middleware para servir los archivos SAPUI5
app.use(express.static(staticPath));

// Ruta por defecto para cualquier archivo no encontrado
app.get("*", (req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
});

// Iniciar el servidor
app.listen(PORT, "0.0.0.0", () => {

});
