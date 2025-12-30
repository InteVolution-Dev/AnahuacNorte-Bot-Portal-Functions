// Local imports
const filteringDuplicatedTools = require("../../utils/filteringDuplicatedTools.js");
const { storeInTable } = require("../storage/storage.js");
const {
    getAgentByName,
    buildOpenApiTool,
    updateAgentDefinition
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
    try {
        const AGENT_NAME = process.env.FOUNDRY_AGENT_NAME;
        
        // Primero obtenemos el proyecto de Foundry
        const agent = await getAgentByName(AGENT_NAME);
        const latestDef = agent.versions.latest.definition;  // Definición más reciente del agente
        // Construimos nueva tool que llegó en el body:
        const newFlowTool = await buildOpenApiTool(body);
        // Evitar duplicados por nombre
        const filteredTools = filteringDuplicatedTools(latestDef.tools, newFlowTool.openapi.name);

        const newTools = [...filteredTools, newFlowTool];
        
        // Ahora persistimos el nuevo flujo en el cliente de Foundry (esto CREA una nueva versión)
        const updatedAgent = await updateAgentDefinition(
            AGENT_NAME,
            {
                ...latestDef,
                tools: newTools
            }
        );

        // Luego guardamos el Flow en Table Storage
        const storedFlow = await saveFlowToTableStorage(body);

        return {
            flowName: newFlowTool.openapi.name,
            storedFlow
        };
    } catch (err) {
        console.error("ERROR EN CREATE FLOW:");
        console.error(err);
        throw err;
    }
}


module.exports = {
    createFlow,
};
