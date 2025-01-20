const express = require("express");
const path = require("path");

const app = express();

const PORT = 8080;

const staticPath = path.join(__dirname, "webapp");

app.use(express.static(staticPath));

app.get("*", (req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

process.on("uncaughtException", (err) => {
    console.error("Error no controlado:", err);
    process.exit(1); // Salida del proceso en caso de error crítico
});
