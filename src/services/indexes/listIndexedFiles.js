// Local imports
const { queryTable } = require("../storage/storage");


// CONSTANTES
const TABLE_NAME = process.env.INDEXFILES_TABLE;



// FUNCIONES ==========================================
// Función principal para listar archivos indexados
async function listIndexedFiles({ indexId }) {
    if (!indexId) {
        throw new Error("indexId is required");
    }

    const filter = [
        `PartitionKey eq '${indexId}'`,
        `(status eq 'INDEXED' or status eq 'FAILED' or status eq 'DEPLOYED')`
    ].join(" and ");

    const entities = await queryTable({
        tableName: TABLE_NAME,
        filter
    });

    return {
        indexId,
        count: entities.length,
        files: entities.map(e => ({
            id: e.rowKey,
            originalName: e.originalName,
            blobContainer: e.blobContainer,
            blobName: e.blobName,
            status: e.status,
            size: e.size,
            contentType: e.contentType,
            extension: e.extension,
            vectorStoreFileId: e.vectorStoreFileId,
            createdAt: e.createdAt,
            updatedAt: e.updatedAt
        }))
    };
}

module.exports = {
    listIndexedFiles
};
