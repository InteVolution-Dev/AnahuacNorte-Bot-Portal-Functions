// Azure imports
const { BlobServiceClient } = require("@azure/storage-blob");
// Local imports
const { getAgentByName, updateAgentDefinition } = require("../foundry/foundryAgentManagerTool");



// CONSTANTES ==============================
const CONFIG_CONTAINER = process.env.CONFIG_CONTAINER;
const SYSTEM_PROMPT_BLOB = process.env.SYSTEM_PROMPT_BLOB;
const AGENT_NAME = process.env.FOUNDRY_AGENT_NAME;



// Blob client setup ==============================
const blobServiceClient = BlobServiceClient.fromConnectionString(
    process.env.STORAGE_CONN
);




// FUNCIONES =========================================
// Función auxiliar para actualizar el system prompt en el agente de Foundry
async function updateSystemPromptAgent(promptText) {
    // Primero obtenemos el proyecto de Foundry
    const agent = await getAgentByName(AGENT_NAME);
    const latestDef = agent.versions.latest.definition;
    // Ahora persistimos el nuevo flujo en el cliente de Foundry (esto CREA una nueva versión)
    const updatedAgent = await updateAgentDefinition(
        AGENT_NAME,
        {
            ...latestDef,
            instructions: promptText.trim()
        }
    );

    return {
        updated: true,
        updatedAt: new Date().toISOString()
    };
}


// Función auxiliar para actualizar el system prompt en su blob container
async function updateSystemPromptBlob(promptText) {
    const containerClient = blobServiceClient.getContainerClient(CONFIG_CONTAINER);

    // Crear contenedor si no existe
    await containerClient.createIfNotExists();

    const blobClient = containerClient.getBlockBlobClient(SYSTEM_PROMPT_BLOB);

    const content = promptText.trim();

    await blobClient.upload(
        content,
        Buffer.byteLength(content),
        {
            blobHTTPHeaders: {
                blobContentType: "text/plain; charset=utf-8"
            }
        }
    );

    return {
        updated: true,
        container: CONFIG_CONTAINER,
        blobName: SYSTEM_PROMPT_BLOB,
        length: content.length,
        updatedAt: new Date().toISOString()
    };
}


// Función principal para actualizar el system prompt
async function updateSystemPrompt(body) {
    const { promptText } = body;  // promptTest ya debe ser un string por validacion con AJV
    
    const updatedAgent = await updateSystemPromptAgent(promptText);
    
    const response = await updateSystemPromptBlob(promptText);
    
    return {
        blobUpdate: response,
        updatedAgent
    }
}



module.exports = {
    updateSystemPrompt
};
