// Third party imports
const { DefaultAzureCredential } = require("@azure/identity");
const { AIProjectClient } = require("@azure/ai-projects");
// Local imports
const { storeInTable } = require("../storage/storage");


// Configuración del cliente de Foundry y Table Storage
const credential = new DefaultAzureCredential();
const projectClient = new AIProjectClient(process.env.FOUNDRY_ENDPOINT, credential);


// Funciones auxiliares
async function getFoundryAgent(){
    try {
        // Obtener Assistant API Agent
        const retrievedAgent = await projectClient.agents.getAgent(process.env.FOUNDRY_ASSISTANT_ID);
        console.log("[DEBUG] Agente recuperado:", JSON.stringify(retrievedAgent , null, 2));
        return retrievedAgent ;

    } catch (err) {
        console.error("ERROR AL RECUPERAR AGENTE:");
        console.error(err);
        throw err;
    }
}


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


async function saveFlowToTableStorage(){
    await storeInTable();
    return;
}


// Funcion principal para crear un Flow a partir de un OpenAPI JSON
async function createFlow(body){
    // Primero obtenemos el proyecto de Foundry
    const agent = await getFoundryAgent();
    // Ahora persistimos el nuevo flujo en el cliente de Foundry
    await registerOpenAPITool(agent, body);
    // Luego guardamos el Flow en Table Storage
    // await saveFlowToTableStorage();
    // Deberíamos devolver en la respuesta el objeto almacenado en la tabla junto con su ID y un status de creado si todo salió bien
    return agent;
}

module.exports = {
    createFlow,
};