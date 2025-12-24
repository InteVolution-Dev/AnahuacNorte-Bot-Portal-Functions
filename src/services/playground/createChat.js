// Local imports
const { getAgentByName, getOpenAIClient, createNewConversation, createResponseInConversation } = require("../foundry/foundryAgentManagerTool");

// CONSTANTES ==============================
const AGENT_NAME = process.env.FOUNDRY_AGENT_NAME;
// Create AI Project client


// FUNCIONES ==============================
// Función para crear un nuevo chat en el playground
async function createChat(body) {
    try {
        console.log("[PLAYGROUND MANAGER TOOL] Creating chat with body:", body);
        const userMessage = body.userMessage || "Hello, this is a test message from PlaygroundManagerTool.";
        // Retrieve agent details
        const retrievedAgent = await getAgentByName(AGENT_NAME);
        console.log("[DEBUG] Agent details:", JSON.stringify(retrievedAgent, null, 2));
        // Use the retrieved agent to create a conversation and generate a response
        const openAIClient = await getOpenAIClient();
        // Create conversation
        const conversation =  await createNewConversation(openAIClient, userMessage);
        // Create response in conversation
        const response = await createResponseInConversation(openAIClient, conversation.id, userMessage, AGENT_NAME);

        return {
            conversationId: conversation.id,
            response: response.output_text
        };
    } catch (err) {
        console.error("ERROR EN PLAYGROUND MANAGER TOOL - createChat:");
        console.error(err);
        throw err;
    }
}



module.exports = {
    createChat,
};
