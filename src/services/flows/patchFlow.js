const { getFoundryAgent, updateOpenAPITool } = require("../foundry/foundryAgentManagerTool");
const { storeInTable } = require("../storage/storage");



// Funciones auxiliares para actualizar el Flow en Table Storage
async function savePatchedFlowToTableStorage(body) {
    const entity = {
        partitionKey: "flows",
        rowKey: body.storedFlowRowKey,
        active: Boolean(body.active),
        updatedAt: new Date().toISOString(),
    };

    await storeInTable({
        tableName: process.env.FLOWS_TABLE_NAME,
        entity,
        mode: "merge" // Si no especificamos, por defecto hace insert
    });
}

// Función principal para actualizar un Flow a partir de un OpenAPI JSON
async function patchFlow(body) {
    try {
        if (!body.storedFlowRowKey) {
            throw new Error("rowKey (id) is required to update a flow");
        }

        // 1. TODO: Obtener agente

        // 2. Actualizar entidad en Table Storage (UPSERT)
        const updatedFlowInStorage = await savePatchedFlowToTableStorage(body);

        return {
            id: body.storedFlowRowKey,
            active: body.active,
            updated: true
        };

    } catch (err) {
        console.error("ERROR AL ACTUALIZAR FLOW:");
        console.error(err);
        throw err;
    }
}

module.exports = { patchFlow };
