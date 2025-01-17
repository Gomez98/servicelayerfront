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
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

// Manejo de errores en caso de que algo falle
process.on("uncaughtException", (err) => {
    console.error("Error no controlado:", err);
    process.exit(1); // Salida del proceso en caso de error crítico
});
