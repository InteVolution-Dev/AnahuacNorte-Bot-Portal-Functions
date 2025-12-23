// Local imports
const { storeInTable } = require("../storage/storage.js");
const {
    getFoundryAgent,
    registerOpenAPITool,
} = require("../foundry/foundryAgentManagerTool.js");


// Funcion para sanitizar la entidad antes de guardarla en Table Storage
function sanitizeEntity(entity) {
    return Object.fromEntries(
        Object.entries(entity).filter(
            ([_, value]) =>
                value !== undefined &&
                value !== null &&
                (typeof value === "string" ||
                    typeof value === "number" ||
                    typeof value === "boolean")
        )
    );
}


// Funcion que guarda el Flow en Table Storage dándole un formato útil para futuras consultas
async function saveFlowToTableStorage(body) {
    try {
        const cleanedPayloadJson = { ...body };
        delete cleanedPayloadJson.active; // eliminamos active del payload JSON
        // Contract:
        // Foundry tool name === payloadJson.info.title
        const rawEntity = {
            partitionKey: "flows",
            rowKey: crypto.randomUUID(), // o shortid
            title: body.info?.title ?? "",
            description: body.info?.description ?? "No hay descripción",
            version: body.info?.version ?? "",
            desiredActive: Boolean(body.active),
            playgroundActive: true,
            productionActive: false,
            productionLastSyncedAt: null,
            baseUrl: body.servers?.[0]?.url ?? "", 
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            payloadJson: JSON.stringify(cleanedPayloadJson),
        };
        console.log("[DEBUG] Guardando Flow en Table Storage:", rawEntity);
        const entity = sanitizeEntity(rawEntity);
        const storedFlow = await storeInTable({
            tableName: process.env.FLOWS_TABLE_NAME,
            entity
        });
        return storedFlow;
    } catch (err) {
        console.error("ERROR AL GUARDAR FLOW EN TABLE STORAGE:");
        console.error(err);
        throw err;
    }
}

// Funcion principal para crear un Flow a partir de un OpenAPI JSON
async function createFlow(body) {
    // Primero obtenemos el proyecto de Foundry
    const agent = await getFoundryAgent();
    console.log("[DEBUG] Agente de Foundry obtenido:", JSON.stringify(agent, null, 2));
    // Ahora persistimos el nuevo flujo en el cliente de Foundry
    const updatedAgent = await registerOpenAPITool(agent, body);
    // Luego guardamos el Flow en Table Storage
    const storedFlow = await saveFlowToTableStorage(body);
    console.log(
        "[DEBUG] Flow almacenado en Table Storage:",
        JSON.stringify(storedFlow, null, 2)
    );
    // Deberíamos devolver en la respuesta el objeto almacenado en la tabla incluyendo su RowKey
    const rowKey = storedFlow.rowKey;
    updatedAgent.storedFlowRowKey = rowKey;
    console.log(
        "[DEBUG] Agente actualizado tras añadir la herramienta:",
        JSON.stringify(updatedAgent, null, 2)
    );
    return updatedAgent;
}

module.exports = {
    createFlow,
};
