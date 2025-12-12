// Third party imports
const { AIProjectClient } = require("@azure/ai-projects");
// Local imports
const { getFoundryAgent, deleteOpenAPITool } = require("../foundry/foundryAgentManagerTool.js");
const { deleteFromTable } = require("../storage/storage.js");


// Funciones auxiliares




// Función para eliminar un flujo (tool) de un agente en Foundry y de Table Storage
async function deleteFlow(body){
    // El body debe contener el flowName (nombre de la tool a eliminar)
    const { flowName, storedFlowRowKey } = body;
    const agent = await getFoundryAgent();
    const updatedAgent = await deleteOpenAPITool(agent, flowName);
    if(!updatedAgent){
        // No borraría de Table Storage si no se borró de Foundry
        throw new Error("No se pudo eliminar la herramienta del agente en Foundry.");
    }
    const tableDeletionResult = await deleteFromTable({
        tableName: process.env.FLOWS_TABLE_NAME,
        rowKey: storedFlowRowKey
    });
    return updatedAgent;
}

module.exports = { deleteFlow };