// Local imports
const { getAgentByName, updateAgentDefinition, buildOpenApiTool } = require("../foundry/foundryAgentManagerTool");
const { storeInTable, getFromTable } = require("../storage/storage");
const filteringDuplicatedTools = require("../../utils/filteringDuplicatedTools");


// CONSTANTES ==================================
const AGENT_NAME = process.env.FOUNDRY_AGENT_NAME;


// FUNCIONES ===================================
// Funciones auxiliares para actualizar el Flow en Table Storage
async function savePatchedFlowToTableStorage(body) {
    try {
        const entity = {
            partitionKey: "flows",
            rowKey: body.storedFlowRowKey,
            desiredActive: Boolean(body.active),
            playgroundActive: Boolean(body.active),
            updatedAt: new Date().toISOString(),
        };

        await storeInTable({
            tableName: process.env.FLOWS_TABLE_NAME,
            entity,
            mode: "merge" // Si no especificamos, por defecto hace insert
        });
    } catch (err) {
        console.error("[STORE] ERROR AL ACTUALIZAR FLOW EN TABLE STORAGE:");
        console.error(err);
        throw err;
    }
}


// Función principal para actualizar un Flow a partir de un OpenAPI JSON
async function patchFlow(body) {
    try {
        if (!body.storedFlowRowKey) {
            throw new Error("rowKey (id) is required to update a flow");
        }

        // 0. Obtener el flow desde Table Storage
        const storedFlow = await getFromTable({
            tableName: process.env.FLOWS_TABLE_NAME,
            partitionKey: process.env.FLOWS_PARTITION,
            rowKey: body.storedFlowRowKey
        });
        console.log("[DEBUG] Flow almacenado obtenido:", JSON.stringify(storedFlow, null, 2));

        // 0.5 Parse el payloadJson del entity (flow almacenado)
        let openApiJson;
        try {
            openApiJson = JSON.parse(storedFlow.payloadJson);
        } catch {
            throw new Error("Flujo almacenado tiene un payloadJson inválido");
        }

        // 1. Obtener agente
        const agent = await getAgentByName(AGENT_NAME);
        console.log("[DEBUG] Agente de Foundry obtenido:", JSON.stringify(agent, null, 2));
        const latestDef = agent.versions.latest.definition;  // Definición más reciente del agente

        // 2. Verificar si el Flow debe estar activo o no en Foundry
        if (body.active) {
            // 2.1 Registrar herramienta OpenAPI en Foundry
            const newFlowTool = await buildOpenApiTool(openApiJson);
            // Evitar duplicados por nombre
            const filteredTools = filteringDuplicatedTools(latestDef.tools, newFlowTool.openapi.name);
            const updatedAgent = await updateAgentDefinition(
                AGENT_NAME,
                {
                    ...latestDef,
                    tools: [...filteredTools, newFlowTool],
                }
            );
            console.log("[DEBUG] Agente actualizado con nueva herramienta OpenAPI:", JSON.stringify(updatedAgent, null, 2));
        } else {
            // 2.2 Eliminar herramienta OpenAPI de Foundry
            const flowName = openApiJson.info?.title;
            const currentTools = latestDef.tools ?? [];
            const filteredTools = filteringDuplicatedTools(currentTools, flowName)

            if (filteredTools.length === currentTools.length) {
                console.warn(`[WARN] Flow '${flowName}' no estaba activo en Foundry.`);
            }

            await updateAgentDefinition(
                AGENT_NAME,
                {
                    ...latestDef,
                    tools: filteredTools
                }
            );
            console.log(`[DEBUG] Herramienta OpenAPI eliminada: ${flowName}`);
        }

        // 3. Actualizar entidad en Table Storage (UPSERT)
        await savePatchedFlowToTableStorage(body);

        return {
            id: body.storedFlowRowKey,
            active: body.active,
            updated: true
        };

    } catch (err) {
        const storedFlow = await getFromTable({
            tableName: process.env.FLOWS_TABLE_NAME,
            partitionKey: process.env.FLOWS_PARTITION,
            rowKey: body.storedFlowRowKey
        });
        if (!storedFlow.title) {
            console.warn("[WARN] Flow sin title, reconstruyendo desde payloadJson");
            const parsed = JSON.parse(storedFlow.payloadJson);
            storedFlow.title = parsed.info?.title;
        }
        console.error("[PATCH FLOW] Failed", {
            rowKey: body?.storedFlowRowKey,
            flowName: storedFlow?.title,
            message: err.message
        });
        throw err;
    }
}


module.exports = { patchFlow };
