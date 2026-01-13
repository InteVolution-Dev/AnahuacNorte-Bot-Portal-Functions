global.crypto = require("crypto").webcrypto;

const { app } = require("@azure/functions");

app.setup({
    enableHttpStream: true,
});

// Cargar TODAS las Azure Functions (side-effect imports)

