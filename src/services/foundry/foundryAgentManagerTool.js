// Third party imports
const { DefaultAzureCredential } = require("@azure/identity");
const { AIProjectClient } = require("@azure/ai-projects");


// Configuración del cliente de Foundry y Table Storage
const credential = new DefaultAzureCredential();
const projectClient = new AIProjectClient(process.env.FOUNDRY_ENDPOINT, credential);


// Funciones auxiliares
async function getFoundryAgent(){
    try {
        // Obtener Assistant API Agent
        const retrievedAgent = await projectClient.agents.getAgent(process.env.FOUNDRY_ASSISTANT_ID);
        // console.log("[DEBUG] Agente recuperado:", JSON.stringify(retrievedAgent , null, 2));
        return retrievedAgent;

    } catch (err) {
        console.error("ERROR AL RECUPERAR AGENTE:");
        console.error(err);
        throw err;
    }
}


// Configuración del cliente de Foundry
async function registerOpenAPITool(agent, openapiJson){
    try {
        // Primero tengo que limpiar el JSON de OpenAPI
        const cleanedOpenApiJson = { ...openapiJson };
        delete cleanedOpenApiJson.active;
        // Ahora registro la herramienta en el agente
        const newTool = {
            type: "openapi",
            openapi: {
                name: cleanedOpenApiJson.info?.title ?? "UnnamedOpenAPITool",
                description: cleanedOpenApiJson.info?.description ?? "OpenAPI specification",
                spec: cleanedOpenApiJson,
                // auth es obligatorio según el type, así que ponemos un placeholder
                auth: {
                    type: "anonymous"  // luego lo afinamos para usar el ApiKeyAuth real
                },
                // defaultParams y functions son opcionales, de momento no los usamos
            }
        };
        const updated = await projectClient.agents.updateAgent(agent.id, {
            tools: [...(agent.tools || []), newTool]
        });

        console.log("OpenAPI tool added to agent.");
        return updated;
    } catch (err) {
        console.error("ERROR AL REGISTRAR HERRAMIENTA OPENAPI:");
        console.error(err);
        throw err;
    }
}


// Función para eliminar una herramienta (tool) OpenAPI de un agente en Foundry
async function deleteOpenAPITool(agent, toolName){
    try {
        // tool = flow
        const currentTools = agent.tools || [];

        // filtrar la tool a eliminar
        const newTools = currentTools.filter(t => {
            return !(t.type === "openapi" && t.openapi?.name === toolName);
        });

        if (newTools.length === currentTools.length) {
            console.warn(`[WARN] Tool ${toolName} no existe en el agente.`);
            return agent; // sin cambios
        }

        const updated = await projectClient.agents.updateAgent(agent.id, {
            tools: newTools
        });

        console.log(`[INFO] Tool '${toolName}' eliminada del agente.`);
        return updated;

    } catch (err) {
        console.error("ERROR AL ELIMINAR HERRAMIENTA OPENAPI:");
        console.error(err);
        throw err;
    }
}


module.exports = {
    getFoundryAgent,
    deleteOpenAPITool,
    registerOpenAPITool
};