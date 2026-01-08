// Node imports
const { BlobServiceClient } = require("@azure/storage-blob");
// Local imports
const { getOpenAIClient } = require("../foundry/foundryAgentManagerTool");
const { getFromTable, storeInTable } = require("../storage/storage");


// Blob Service Client setup =======================
const blobServiceClient = BlobServiceClient.fromConnectionString(
    process.env.STORAGE_CONN
);


// FUNCIONES =========================================
// Función principal para borrar un archivo de un índice
async function deleteFile(body) {
    const { fileRowKey } = body;
    const vectorIndexId = process.env.AZURE_OPENAI_PLAYGROUND_INDEX_ID;
    if (!vectorIndexId) {
        throw new Error("vectorIndexId es requerido en las variables de entorno");
    }

    // 1. Obtener metadata del archivo
    const fileRecord = await getFromTable({
        tableName: process.env.INDEXFILES_TABLE,
        partitionKey: vectorIndexId,
        rowKey: fileRowKey
    });

    if (!fileRecord) {
        throw new Error("FILE_NOT_FOUND");
    }

    if (fileRecord.status === "DELETED") {
        return { deleted: true, alreadyDeleted: true };
    }

    // 2. Borrar del vector store (si existe)
    if (fileRecord.vectorStoreFileId) {
        const openAIClient = await getOpenAIClient();
        await openAIClient.vectorStores.files.delete(
            fileRecord.vectorStoreFileId,
            { vector_store_id: vectorIndexId }
        )
    }

    // 3. Borrar del blob
    const containerClient = blobServiceClient.getContainerClient(
        fileRecord.blobContainer
    );
    const blobClient = containerClient.getBlockBlobClient(
        fileRecord.blobName
    );

    await blobClient.deleteIfExists();

    // 4. Soft delete lógico en Table Storage
    await storeInTable({
        tableName: process.env.INDEXFILES_TABLE,
        entity: {
            partitionKey: vectorIndexId,
            rowKey: fileRowKey,
            status: "DELETED",
            deletedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            vectorStoreFileId: null
        },
        mode: "merge"
    });

    return {
        deleted: true,
        fileRowKey
    };
}



module.exports = {
    deleteFile
};
