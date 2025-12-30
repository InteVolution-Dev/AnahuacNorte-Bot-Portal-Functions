// Local imports
const {
    getAgentByName,
    getOpenAIClient,
    continueConversation,
    createResponseInConversation
} = require("../foundry/foundryAgentManagerTool");


// CONSTANTES ==============================
const AGENT_NAME = process.env.FOUNDRY_AGENT_NAME;


// ====================================================
// Continúa una conversación existente
// ====================================================
async function continueChat(body) {
    try {
        const { conversationId, userMessage } = body;

        if (!conversationId) {
            throw new Error(
                "conversationId es requerido para continuar el chat"
            );
        }

        if (!userMessage) {
            throw new Error("userMessage es requerido");
        }

        console.log("[PLAYGROUND] Continuing chat:", conversationId);

        const openAIClient = await getOpenAIClient();

        // 🔹 IMPORTANTE:
        // En Foundry v2 NO agregas el mensaje manualmente.
        // El Responses API se encarga del contexto completo.
        const response = await continueConversation(
            openAIClient,
            conversationId,
            userMessage
        );

        console.log(`[DEBUG] Response from Foundry: ${JSON.stringify(response, null, 2)}`);
        console.log("\nGenerating second response...");
        // Retrieve agent details
        const retrievedAgent = await getAgentByName(AGENT_NAME);
        const response2 = await createResponseInConversation(
            openAIClient,
            conversationId,
            retrievedAgent
        );
        console.log(`Response output: ${response2.output_text}`);
        return {
            conversationId,
            response: response2.output_text,
        };
    } catch (err) {
        console.error("[PLAYGROUND][continueChat] Error");
        throw err;
    }
}

module.exports = {
    continueChat,
};
