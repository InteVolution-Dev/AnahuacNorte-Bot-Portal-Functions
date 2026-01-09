global.crypto = require("crypto").webcrypto;

const { app } = require("@azure/functions");

app.setup({
    enableHttpStream: true,
});

// Cargar TODAS las Azure Functions (side-effect imports)
require("./functions/chatContinue");
require("./functions/chatCreate");

require("./functions/deploy");

require("./functions/flowCreate");
require("./functions/flowDelete");
require("./functions/flowList");
require("./functions/flowPatch");
require("./functions/flowUpdate");

require("./functions/healthCheck");

require("./functions/indexFileDelete");
require("./functions/indexFileList");
require("./functions/indexFileUpload");

require("./functions/promptUpdate");

require("./functions/systemPromptGet");
require("./functions/systemPromptUpdate");
