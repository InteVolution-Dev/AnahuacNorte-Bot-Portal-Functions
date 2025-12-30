const { getAgentByName, updateAgentDefinition, replaceOpenApiTool, buildOpenApiTool } = require("../foundry/foundryAgentManagerTool");
const { storeInTable } = require("../storage/storage");



// CONSTANTES ==================================
const AGENT_NAME = process.env.FOUNDRY_AGENT_NAME;



// FUNCTIONES ===================================
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

        const { flowName, openApiJson } = body;

        // 1. Obtener agente
        const agent = await getAgentByName(AGENT_NAME);
        const latestDef = agent.versions.latest.definition;
        console.log(`[DEBUG]  latestDef del agente "${AGENT_NAME}":`, JSON.stringify(latestDef, null, 2));
        const currentTools = latestDef.tools ?? [];
        console.log(`[DEBUG]  currentTools del agente "${AGENT_NAME}":`, JSON.stringify(currentTools, null, 2));
        // Actualizar las herramientas:
        // 2. Construir nueva tool OpenAPI
        const updatedOpenApiTool = await buildOpenApiTool(openApiJson);
        console.log(`[DEBUG]  Nueva herramienta OpenAPI construida:`, JSON.stringify(updatedOpenApiTool, null, 2));
        
        // 3. Reemplazar la tool existente
        const updatedTools = await replaceOpenApiTool(
            currentTools,
            updatedOpenApiTool
        );
        console.log(`[DEBUG] Herramientas actualizadas del agente:`, JSON.stringify(updatedTools, null, 2));
        
        // 4. Update del agente (nueva versión)
        const updatedAgent = await updateAgentDefinition(
            AGENT_NAME,
            {
                ...latestDef,
                tools: updatedTools
            }
        );

        console.log(
            "[DEBUG] Agente actualizado tras modificar la herramienta:",
            JSON.stringify(updatedAgent, null, 2)
        );


        // 5. Actualizar entidad en Table Storage (UPSERT)
        await saveUpdatedFlowToTableStorage(body);

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
