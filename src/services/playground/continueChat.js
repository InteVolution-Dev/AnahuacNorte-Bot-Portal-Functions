// Local imports
const {
    getOpenAIClient,
    createResponseInConversation,
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
        const response = await createResponseInConversation(
            openAIClient,
            conversationId,
            userMessage,
            AGENT_NAME,
        );

        console.log(`[DEBUG] Response from Foundry: ${JSON.stringify(response, null, 2)}`);

        return {
            conversationId,
            response: response.output_text,
        };
    } catch (err) {
        console.error("[PLAYGROUND][continueChat] Error");
        throw err;
    }
}

module.exports = {
    continueChat,
};
