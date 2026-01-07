// Node imports
const crypto = require("crypto");
// Azure imports
const { BlobServiceClient } = require("@azure/storage-blob");
// Local imports
const { getOpenAIClient } = require("../foundry/foundryAgentManagerTool");
const { storeInTable } = require("../storage/storage");


// CONSTANTES ======================================
const BLOB_CONTAINER_NAME = process.env.INDEXFILES_CONTAINER_NAME;


// BLOB STORAGE & TABLE STORAGE SETTINGS ---------------
const blobServiceClient = BlobServiceClient.fromConnectionString(
    process.env.STORAGE_CONN
);



// FUNCIONES ==========================================
// Función auxiliar para subir un archivo a Blob Storage
async function uploadFileToBlob(file, indexId) {
    const containerName = BLOB_CONTAINER_NAME;
    const containerClient = blobServiceClient.getContainerClient(containerName);

    // asegúrate de que exista (safe call)
    await containerClient.createIfNotExists();

    const extension = file.name.split(".").pop();
    const blobName = `${indexId}/${crypto.randomUUID()}_${file.name}`;

    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    const buffer = Buffer.from(await file.arrayBuffer());

    await blockBlobClient.uploadData(buffer, {
        blobHTTPHeaders: {
            blobContentType: file.type || "application/octet-stream",
        },
    });

    return {
        blobContainer: containerName,
        blobName,
        originalName: file.name,
        contentType: file.type,
        size: file.size,
        extension,
    };
}


// Función auxiliar para almacenar metadatos de archivo en Table Storage
async function storeFileMetadata({ indexId, blobInfo }) {
    const entity = {
        partitionKey: indexId,
        rowKey: crypto.randomUUID(),

        blobContainer: blobInfo.blobContainer,
        blobName: blobInfo.blobName,
        originalName: blobInfo.originalName,
        extension: blobInfo.extension,
        contentType: blobInfo.contentType,
        size: blobInfo.size,

        vectorStoreFileId: null,

        status: "UPLOADED",
        errorMessage: null,

        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    await storeInTable({
        tableName: process.env.INDEXFILES_TABLE,
        entity
    });

    return entity;
}


// Función auxiliar para subir archivos al vector store
async function uploadFilesToVectorStore({ indexId, file }) {
    try {
        console.log(
            `[DEBUG] uploadFiles called with indexId: ${indexId} and 1 file`
        );
        const openAIClient = await getOpenAIClient();

        console.log(
            `[DEBUG] Processing file: ${file.name}, size: ${file.size} bytes`
        );
        // Azure Functions File → Buffer
        const buffer = Buffer.from(await file.arrayBuffer());
        console.log(
            `[DEBUG] Converted file to buffer, length: ${buffer.length} bytes`
        );

        const uploaded =
            await openAIClient.vectorStores.files.uploadAndPoll(
                indexId,
                new File([buffer], file.name, {
                    type: file.type || "application/octet-stream",
                })
            );
        console.log(
            `[DEBUG] Uploaded file: ${file.name}, response:`,
            uploaded
        );

        return {
            indexId,
            originalName: file.name,
            vectorStoreFileId: uploaded.id,
            status: uploaded.status,
        };
    } catch (err) {
        console.error("[uploadFiles] Error uploading files:", err);
        throw err;
    }
}


// Función auxiliar para almacenar metadatos de archivo en Table Storage
async function updateFileRecord({
    indexId,
    rowKey,
    vectorStoreFileId,
    status,
    errorMessage = null,
}) {
    const entity = {
        partitionKey: indexId,
        rowKey,
        status,
        updatedAt: new Date().toISOString()
    };

    if (vectorStoreFileId) {
        entity.vectorStoreFileId = vectorStoreFileId;
    }

    if (errorMessage) {
        entity.errorMessage = errorMessage;
    }

    await storeInTable({
        tableName: process.env.INDEXFILES_TABLE,
        entity,
        mode: "merge"
    });
}


// Función principal para subir archivos y registrar en Table Storage
async function uploadFiles({ indexId, files }) {
    const uploaded = [];
    for (const file of files) {
        const blobInfo = await uploadFileToBlob(file, indexId);
        console.log(`[DEBUG] Uploaded file to Blob Storage:`, blobInfo);
        const record = await storeFileMetadata({
            indexId,
            blobInfo,
        });

        try {
            const vectorResult = await uploadFilesToVectorStore({
                indexId,
                file,
            });
            console.log(`[DEBUG] Uploaded file to Vector Store:`, vectorResult);
            await updateFileRecord({
                indexId,
                rowKey: record.rowKey,
                vectorStoreFileId: vectorResult.vectorStoreFileId,
                status: "INDEXED",
            });
            record.vectorStoreFileId = vectorResult.vectorStoreFileId;
            record.status = "INDEXED";
        } catch (err) {
            await updateFileRecord({
                indexId,
                rowKey: record.rowKey,
                status: "FAILED",
                errorMessage: err.message,
            });
            record.status = "FAILED";
            record.errorMessage = err.message;
        }
        uploaded.push(record);
    }

    return uploaded;
}

module.exports = {
    uploadFiles,
};
