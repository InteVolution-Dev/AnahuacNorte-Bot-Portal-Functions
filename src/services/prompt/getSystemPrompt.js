// Azure imports
const { BlobServiceClient } = require("@azure/storage-blob");



// CONSTANTES ==============================
const CONFIG_CONTAINER = process.env.CONFIG_CONTAINER;
const SYSTEM_PROMPT_BLOB = process.env.SYSTEM_PROMPT_BLOB;



// Blob client setup ======================
const blobServiceClient = BlobServiceClient.fromConnectionString(
    process.env.STORAGE_CONN
);



// FUNCIONES =========================================
// Función auxiliar Helper para leer stream
async function streamToString(readableStream) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        readableStream.on("data", (data) => chunks.push(data.toString()));
        readableStream.on("end", () => resolve(chunks.join("")));
        readableStream.on("error", reject);
    });
}


// Función principal para obtener el system prompt desde su blob container
async function getSystemPrompt() {
    const containerClient = blobServiceClient.getContainerClient(CONFIG_CONTAINER);
    const blobClient = containerClient.getBlobClient(SYSTEM_PROMPT_BLOB);

    const exists = await blobClient.exists();
    if (!exists) {
        return {
            exists: false,
            promptText: "",
            message: "System prompt not found"
        };
    }

    const downloadResponse = await blobClient.download();
    const promptText = await streamToString(downloadResponse.readableStreamBody);

    return {
        exists: true,
        promptText,
        length: promptText.length,
        updatedAt: downloadResponse.lastModified?.toISOString()
    };
}





module.exports = {
    getSystemPrompt
};
