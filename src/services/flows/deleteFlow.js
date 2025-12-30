// Local imports
const { getAgentByName, updateAgentDefinition } = require("../foundry/foundryAgentManagerTool.js");
const { deleteFromTable } = require("../storage/storage.js");



// Función para eliminar un flujo (tool) de un agente en Foundry y de Table Storage
async function deleteFlow(body){
    try {
        const AGENT_NAME = process.env.FOUNDRY_AGENT_NAME;
    
        // El body debe contener el flowName (nombre de la tool a eliminar)
        const { flowName, storedFlowRowKey } = body;
        
        // 0. Primero obtenemos el agente de Foundry y su última versión (definition)
        const agent = await getAgentByName(AGENT_NAME);
        const latestDef = agent.versions.latest.definition;

        // 1. Obtenemos las tools actuales
        const currentTools = latestDef.tools ?? [];

        // 2. Filtramos tools (remover OpenAPI con ese nombre)
        const filteredTools = currentTools.filter(tool => {
            return !(
                tool.type === "openapi" &&
                tool.openapi?.name === flowName
            );
        });

        if (filteredTools.length === currentTools.length) {
            console.warn(`[WARN] Flow '${flowName}' no existe en el agente.`);
        }

        // Luego llamamos a "updateAgentDefinition" para persistir los cambios
        const updatedAgent = await updateAgentDefinition(
            AGENT_NAME,
            {
                ...latestDef,
                tools: filteredTools
            }
        )

        // Actualizamos de la tabla de Flows para eliminar el flujo
        const tableDeletionResult = await deleteFromTable({
            tableName: process.env.FLOWS_TABLE_NAME,
            rowKey: storedFlowRowKey
        });

        console.log(`[DEBUG] Flow '${flowName}' eliminado exitosamente: ${JSON.stringify(tableDeletionResult)}`);
        return {updatedAgent, tableDeletionResult};
    } catch (err) {
        console.error("ERROR EN DELETE FLOW:");
        console.error(err);
        throw err;
    }
}

module.exports = { deleteFlow };