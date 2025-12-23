// Azure SDK imports
const { DefaultAzureCredential } = require("@azure/identity");
const { AIProjectClient } = require("@azure/ai-projects");
// Local imports
const { getFoundryAgent, createAgentThread, createAgentMessage, createAgentRun, retrieveAgentMessages } = require("../foundry/foundryAgentManagerTool");


// CONSTANTES ==============================


// FUNCIONES ==============================
// Función para crear un nuevo chat en el playground
async function createChat(body) {
    console.log("[PLAYGROUND MANAGER TOOL] Creating chat with body:", body);
    const userMessage = body.userMessage || "Hello, this is a test message from PlaygroundManagerTool. My name is Daniel.";
    // Retrieve Agent by name (latest version)
    const playgroundAssistantId = process.env.FOUNDRY_ASSISTANT_ID;
    const retrievedAgent = await getFoundryAgent(playgroundAssistantId);
    console.log("Retrieved latest agent - name:", retrievedAgent);
    // Use the retrieved agent to create a conversation and generate a response
    const thread = await createAgentThread();
    console.log(`Created thread, ID: ${thread.id}`);
    // Create conversation with initial user message
    const message = await createAgentMessage(thread.id, "user", userMessage);
    console.log(`Created message in thread ${thread.id}, ID: ${message.id}`);
    console.log("Message content:", message.content);
    // Create run
    console.log(`[DEBUG] Creating run for thread:" ${thread.id} and agent: ${retrievedAgent.id}`);
    let run = await createAgentRun(thread.id, retrievedAgent.id);
    console.log(`[DEBUG] Run completed with status: ${run.status}`);
    // Retrieve messages
    const messages = await retrieveAgentMessages(thread.id);

    // Display messages
    for await (const m of messages) {
        const content = m.content.find((c) => c.type === "text" && "text" in c);
        if (content) {
            console.log(`[DEBUG] Mensaje de ${m.role}: ${content.text.value}`);
        }
    }

    return {
        threadId: thread.id,
        messageId: message.id,
    };
}



module.exports = {
    createChat,
};
