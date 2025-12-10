global.crypto = require("crypto").webcrypto;
const { app } = require('@azure/functions');

app.setup({
    enableHttpStream: true,
});
