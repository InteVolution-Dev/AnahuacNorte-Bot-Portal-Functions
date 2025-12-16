const { getFoundryAgent, updateOpenAPITool } = require("../foundry/foundryAgentManagerTool");
const { storeInTable } = require("../storage/storage");



// Funciones auxiliares para actualizar el Flow en Table Storage
async function saveUpdatedFlowToTableStorage(body) {
    const entity = {
        partitionKey: "flows",
        rowKey: body.storedFlowRowKey,
        title: body.openApiJson.info.title,
        description: body.openApiJson.info.description,
        version: body.openApiJson.info.version,
        active: Boolean(body.openApiJson.active),
        updatedAt: new Date().toISOString(),
        payloadJson: JSON.stringify(body.openApiJson)
    };

    await storeInTable({
        tableName: process.env.FLOWS_TABLE_NAME,
        entity,
        mode: "replace" // Si no especificamos, por defecto hace insert
    });
}

// Función principal para actualizar un Flow a partir de un OpenAPI JSON
async function updateFlow(body) {
    try {
        if (!body.storedFlowRowKey) {
            throw new Error("rowKey (id) is required to update a flow");
        }

        // 1. Obtener agente
        const agent = await getFoundryAgent();

        // 2. Actualizar herramienta OpenAPI en Foundry
        const updatedAgent = await updateOpenAPITool(agent, body);
        console.log("[DEBUG] Agente actualizado tras modificar la herramienta:", JSON.stringify(updatedAgent, null, 2));
        
        // 3. Actualizar entidad en Table Storage (UPSERT)
        const updatedFlowInStorage = await saveUpdatedFlowToTableStorage(body);

        return {
            id: body.storedFlowRowKey,
            updated: true
        };

    } catch (err) {
        console.error("ERROR AL ACTUALIZAR FLOW:");
        console.error(err);
        throw err;
    }
}

module.exports = { updateFlow };
