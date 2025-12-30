// Third party imports
const { DefaultAzureCredential } = require("@azure/identity");
const { AIProjectClient } = require("@azure/ai-projects");

// Configuración del cliente de Foundry y Table Storage
const credential = new DefaultAzureCredential();
const projectClient = new AIProjectClient(
    process.env.FOUNDRY_ENDPOINT,
    credential
);



// FUNCIONES ===============================================
// Función para traer el agente por su nombre
async function getAgentByName(agentName = process.env.FOUNDRY_AGENT_NAME) {
    try {
        const retrievedAgent = await projectClient.agents.get(agentName);
        return retrievedAgent;
    } catch (err) {
        console.error("ERROR AL RECUPERAR AGENTE POR NOMBRE:");
        console.error(err);
        throw err;
    }
}


// Función para obtener el cliente de OpenAI desde Foundry
async function getOpenAIClient() {
    try {
        return await projectClient.getOpenAIClient();
    } catch (err) {
        console.error("ERROR AL OBTENER OPENAI CLIENT:");
        console.error(err);
        throw err;
    }
}


// Función para crear una nueva conversación
async function createNewConversation(openAIClient, userMessage) {
    try {
        // Create conversation with initial user message
        return await openAIClient.conversations.create({
            items: [
                {
                    type: "message",
                    role: "user",
                    content: userMessage,
                },
            ],
        });
    } catch (err) {
        console.error("ERROR AL OBTENER OPENAI CLIENT:");
        console.error(err);
        throw err;
    }
};


// Función para crear una respuesta en una conversación existente
async function createResponseInConversation(openAIClient, conversationId, userMessage, agentName = process.env.FOUNDRY_AGENT_NAME) {
    try {
        return await openAIClient.responses.create(
            {
                conversation: conversationId,
                input: userMessage,
            
            },
            {
                body: {
                    agent: {
                        name: agentName,
                        type: "agent_reference"
                    }
                }
            }
        );
    } catch (err) {
        console.error("ERROR AL CREAR RESPUESTA EN CONVERSACIÓN:");
        console.error(err);
        throw err;
    }
};


// Función para construir una herramienta (tool) OpenAPI
async function buildOpenApiTool(openApiJson) {
    const cleaned = { ...openApiJson };
    delete cleaned.active;

    return {
        type: "openapi",
        openapi: {
            name: cleaned.info?.title,
            description: cleaned.info?.description,
            spec: cleaned,
            auth: { type: "anonymous" }  // TODO: ajustar para usar ApiKeyAuth real
        }
    };
}


// Función para actualizar la definición de un agente en Foundry y generar una nueva versión
async function updateAgentDefinition(agentName, definition) {
    try {
        return await projectClient.agents.update(agentName, definition);
    } catch (err) {
        console.error("ERROR AL ACTUALIZAR DEFINICIÓN DEL AGENTE:");
        console.error(err);
        throw err;
    }
}


/** 
    * @deprecated
*/
// Configuración del cliente de Foundry
async function registerOpenAPITool(agent, openapiJson) {
    try {
        // Primero tengo que limpiar el JSON de OpenAPI
        const cleanedOpenApiJson = { ...openapiJson };
        delete cleanedOpenApiJson.active;
        // Ahora registro la herramienta en el agente
        const newTool = {
            type: "openapi",
            openapi: {
                name: cleanedOpenApiJson.info?.title ?? "UnnamedOpenAPITool",
                description:
                    cleanedOpenApiJson.info?.description ??
                    "OpenAPI specification",
                spec: cleanedOpenApiJson,
                // auth es obligatorio según el type, así que ponemos un placeholder
                auth: {
                    type: "anonymous", // luego lo afinamos para usar el ApiKeyAuth real
                },
                // defaultParams y functions son opcionales, de momento no los usamos
            },
        };
        const updated = await projectClient.agents.updateAgent(agent.id, {
            tools: [...(agent.tools || []), newTool],
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
async function deleteOpenAPITool(agent, toolName) {
    try {
        // tool = flow
        const currentTools = agent.tools || [];

        // filtrar la tool a eliminar
        const newTools = currentTools.filter((t) => {
            return !(t.type === "openapi" && t.openapi?.name === toolName);
        });

        if (newTools.length === currentTools.length) {
            console.warn(`[WARN] Tool ${toolName} no existe en el agente.`);
            return agent; // sin cambios
        }

        const updated = await projectClient.agents.updateAgent(agent.id, {
            tools: newTools,
        });

        console.log(`[INFO] Tool '${toolName}' eliminada del agente.`);
        return updated;
    } catch (err) {
        console.error("ERROR AL ELIMINAR HERRAMIENTA OPENAPI:");
        console.error(err);
        throw err;
    }
}


// Función para actualizar una herramienta (tool) OpenAPI de un agente en Foundry
async function updateOpenAPITool(agent, body) {
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
                auth: { type: "anonymous" },
            },
        };

        // 3. Reemplazar tool en Foundry
        const filteredTools = (agent.tools || []).filter(
            (t) =>
                !(
                    t.type === "openapi" &&
                    t.openapi?.name === newTool.openapi.name
                )
        );

        const updatedAgent = await projectClient.agents.updateAgent(agent.id, {
            tools: [...filteredTools, newTool],
        });

        return updatedAgent;
    } catch (err) {
        console.error("ERROR AL ACTUALIZAR HERRAMIENTA OPENAPI:");
        console.error(err);
        throw err;
    }
}


async function configureAgent({ agentId, indexId, openApiTools = [] }) {
    if (!agentId) {
        throw new Error("agentId es requerido para configurar al agente.");
    }

    // Constuimos las OpenAPI tools
    const tools = [];
    for (const flow of openApiTools) {
        tools.push({
            type: "openapi",
            openapi: {
                name: flow.openApiJson.info?.title ?? "UnnamedOpenAPITool",
                description:
                    flow.openApiJson.info?.description ??
                    "OpenAPI specification",
                spec: flow.openApiJson,
                auth: {
                    type: "anonymous",
                },
            },
        });
    }

    // Agregar index si existe
    if (indexId) {
        tools.push({
            type: "file_search",
            file_search: {
                vector_store_ids: [indexId],
            },
        });
    }

    // Update completo del agente
    const updatedAgent = await projectClient.agents.updateAgent(agentId, {
        tools,
    });

    console.log(
        `[FOUNDY] Agent ${agentId} configured with ${
            tools.length
        } tools (index: ${Boolean(indexId)})`
    );
    return updatedAgent;
}

module.exports = {
    getAgentByName,
    getOpenAIClient,
    createNewConversation,
    createResponseInConversation,
    buildOpenApiTool,
    updateAgentDefinition,
    configureAgent,
    deleteOpenAPITool,
    updateOpenAPITool,
};
