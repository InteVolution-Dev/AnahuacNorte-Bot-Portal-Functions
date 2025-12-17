const { getFoundryAgent, registerOpenAPITool, deleteOpenAPITool } = require("../foundry/foundryAgentManagerTool");
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

        // 0. Obtener el flow desde Table Storage
        const storedFlow = await getFromTable({
            tableName: process.env.FLOWS_TABLE_NAME,
            rowKey: body.storedFlowRowKey
        });

        // 0.5 Parse el payloadJson del entity (flow almacenado)
        let openApiJson;
        try {
            openApiJson = JSON.parse(storedFlow.payloadJson);
        } catch {
            throw new Error("Flujo almacenado tiene un payloadJson inválido");
        }

        // 1. Obtener agente
        const agent = await getFoundryAgent();
        console.log("[DEBUG] Agente de Foundry obtenido:", JSON.stringify(agent, null, 2));

        // 2. Verificar si el Flow debe estar activo o no en Foundry
        if (body.active) {
            // 2.1 Registrar herramienta OpenAPI en Foundry
            const updatedAgent = await registerOpenAPITool(agent, openApiJson);
            console.log("[DEBUG] Agente actualizado con nueva herramienta OpenAPI:", JSON.stringify(updatedAgent, null, 2));
        } else {
            // 2.5 Eliminar herramienta OpenAPI previa si existe
            const existingTool = (agent.tools || []).find(tool => tool.type === "openapi" && tool.openapi?.spec?.info?.title === openApiJson.info?.title);
            if (!existingTool) {
                console.log("[DEBUG] No se encontró herramienta OpenAPI previa para eliminar.");
                throw new Error("No existe el flujo en la herramienta del agente.");
            }
            await deleteOpenAPITool(agent, openApiJson.info?.title);
            console.log(`[DEBUG] Herramienta OpenAPI eliminada: ${existingTool.openapi.name}`);
        }

        // 3. Actualizar entidad en Table Storage (UPSERT)
        const updatedFlowInStorage = await savePatchedFlowToTableStorage(body);

        return {
            id: body.storedFlowRowKey,
            active: body.active,
            updated: true
        };

    } catch (err) {
        console.error("[PATCH FLOW] Failed", {
            rowKey: body?.storedFlowRowKey,
            message: err.message
        });
        throw err;
    }
}

module.exports = { patchFlow };
