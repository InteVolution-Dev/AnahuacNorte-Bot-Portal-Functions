// Third party imports
const { DefaultAzureCredential } = require("@azure/identity");
const { AIProjectClient } = require("@azure/ai-projects");


// Configuración del cliente de Foundry y Table Storage
const credential = new DefaultAzureCredential();
const projectClient = new AIProjectClient(process.env.FOUNDRY_ENDPOINT, credential);


// Funciones auxiliares. TODO: hacer que todas las llamadas a "getFoundryAgent" manden el foundryAssistantId
async function getFoundryAgent(foundryAssistanId = process.env.FOUNDRY_ASSISTANT_ID){
    try {
        // Obtener Assistant API Agent
        const retrievedAgent = await projectClient.agents.getAgent(foundryAssistanId);
        // console.log("[DEBUG] Agente recuperado:", JSON.stringify(retrievedAgent , null, 2));
        return retrievedAgent;

    } catch (err) {
        console.error("ERROR AL RECUPERAR AGENTE:");
        console.error(err);
        throw err;
    }
};


// Función para crear un hilo (para conversaciones)
async function createAgentThread(){
    try {
        const thread = await projectClient.agents.threads.create();
        return thread;
    } catch (err) {
        console.error("ERROR AL CREAR THREAD DE AGENTE:");
        console.error(err);
        throw err;
    }
};


// Función para crear un mensaje dentro de un hilo de agente
async function createAgentMessage(threadId, role, content){
    try {
        const message = await projectClient.agents.messages.create(threadId, role, content);
        console.log(`Created message, ID: ${message.id}`);
        return message;
    } catch (err) {
        console.error("ERROR AL CREAR MENSAJE DE AGENTE:");
        console.error(err);
        throw err;
    }
};


// Functión para echar a correr una conversación (run) en un hilo de agente
async function createAgentRun(threadId, agentId){
    try {
        let run = await projectClient.agents.runs.create(threadId, agentId);
        console.log(`[DEBUG] Created run with ID: ${run.id} and initial status: ${run.status}`);
        while (run.status === "queued" || run.status === "in_progress") {
            // Wait for a second
            await new Promise((resolve) => setTimeout(resolve, 1000));
            run = await projectClient.agents.runs.get(threadId, run.id);
            console.log(`[DEBUG] RE-SCAN Run status: ${run.status}`);
        }

        if (run.status === "failed") {
            console.error(`Run failed: `, run.lastError);
        }
        
        return run;
    } catch (err) {
        console.error("ERROR AL CREAR RUN DE AGENTE:");
        console.error(err);
        throw err;
    }
};


// Función para desplegar los mensajes de un hilo de conversación
async function retrieveAgentMessages(threadId){
    try {
        const messages = projectClient.agents.messages.list(threadId, { order: "asc" });
        return messages;
    } catch (err) {
        console.error("ERROR AL RECUPERAR MENSAJES DE AGENTE:");
        console.error(err);
        throw err;
    }
};


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
};


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
};


// Función para actualizar una herramienta (tool) OpenAPI de un agente en Foundry
async function updateOpenAPITool(agent, body){
    try {
        // Reconstruir tool OpenAPI desde payload
        const cleanedOpenApiJson = { ...body.openApiJson };
        delete cleanedOpenApiJson.active;

        const newTool = {
            type: "openapi",
            openapi: {
                name: cleanedOpenApiJson.info.title,
                description: cleanedOpenApiJson.info.description,
                spec: cleanedOpenApiJson,
                auth: { type: "anonymous" }
            }
        };

        // 3. Reemplazar tool en Foundry
        const filteredTools = (agent.tools || []).filter(t =>
            !(t.type === "openapi" && t.openapi?.name === newTool.openapi.name)
        );

        const updatedAgent = await projectClient.agents.updateAgent(agent.id, {
            tools: [...filteredTools, newTool]
        });

        return updatedAgent;
    } catch(err) {
        console.error("ERROR AL ACTUALIZAR HERRAMIENTA OPENAPI:");
        console.error(err);
        throw err;
    }
};


async function configureAgent({agentId, indexId, openApiTools = []}){
    if (!agentId ) {
        throw new Error("agentId es requerido para configurar al agente.");
    }

    // Constuimos las OpenAPI tools
    const tools = [];
    for (const flow of openApiTools) {
        tools.push({
            type: "openapi",
            openapi: {
                name: flow.openApiJson.info?.title ?? "UnnamedOpenAPITool",
                description: flow.openApiJson.info?.description ?? "OpenAPI specification",
                spec: flow.openApiJson,
                auth: {
                    type: "anonymous"
                }
            }
        });
    }

    // Agregar index si existe
    if (indexId) {
        tools.push({
            type: "file_search",
            file_search: {
                vector_store_ids: [indexId]
            }
        });
    }

    // Update completo del agente
    const updatedAgent = await projectClient.agents.updateAgent(agentId, {
        tools
    });

    console.log(`[FOUNDY] Agent ${agentId} configured with ${tools.length} tools (index: ${Boolean(indexId)})`);
    return updatedAgent;
};



module.exports = {
    configureAgent,
    getFoundryAgent,
    deleteOpenAPITool,
    updateOpenAPITool,
    registerOpenAPITool,
    createAgentThread,
    createAgentMessage,
    createAgentRun,
    retrieveAgentMessages
};