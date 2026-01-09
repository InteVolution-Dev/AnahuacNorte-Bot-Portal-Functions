global.crypto = require("crypto").webcrypto;

const { app } = require("@azure/functions");

app.setup({
    enableHttpStream: true,
});

// Cargar TODAS las Azure Functions (side-effect imports)
require("./src/functions/chatContinue");
require("./src/functions/chatCreate");

require("./src/functions/deploy");

require("./src/functions/flowCreate");
require("./src/functions/flowDelete");
require("./src/functions/flowList");
require("./src/functions/flowPatch");
require("./src/functions/flowUpdate");

require("./src/functions/healthCheck");

require("./src/functions/indexFileDelete");
require("./src/functions/indexFileList");
require("./src/functions/indexFileUpload");

require("./src/functions/promptUpdate");

require("./src/functions/systemPromptGet");
require("./src/functions/systemPromptUpdate");
