const { getFoundryAgent, updateOpenAPITool } = require("../foundry/foundryAgentManagerTool");
const { storeInTable } = require("../storage/storage");



// Funciones auxiliares para actualizar el Flow en Table Storage
async function saveUpdatedFlowToTableStorage(body) {
    try {
        const cleanedPayloadJson = { ...body.openApiJson };
        delete cleanedPayloadJson.active; // eliminamos active del payload JSON

        const entity = {
            partitionKey: "flows",
            rowKey: body.storedFlowRowKey,
            title: body.openApiJson.info.title,
            baseUrl: body.openApiJson.servers?.[0]?.url ?? "",
            description: body.openApiJson.info.description,
            version: body.openApiJson.info.version,
            active: Boolean(body.openApiJson.active),
            updatedAt: new Date().toISOString(),
            payloadJson: JSON.stringify(cleanedPayloadJson)
        };

        await storeInTable({
            tableName: process.env.FLOWS_TABLE_NAME,
            entity,
            mode: "merge" // Si no especificamos, por defecto hace insert
        });
    } catch (err) {
        console.error("ERROR AL GUARDAR FLOW ACTUALIZADO EN TABLE STORAGE:");
        console.error(err);
        throw err;
    }
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
