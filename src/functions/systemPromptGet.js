// Azure Functions imports
const { app } = require('@azure/functions');
// Middleware for authentication
const { withAuth } = require("../middleware/withAuth.js");
// Local imports
const { ok, badRequest } = require("../utils/response");
const { getSystemPrompt } = require("../services/prompt/getSystemPrompt");



// Define the Azure Function ========================
app.http('getSystemPrompt', {
    route: 'system-prompt',
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: withAuth( async (request, context) => {
        try {
            console.log("[UPDATE SYSTEM PROMPT] Update system prompt request received");

            const response = await getSystemPrompt();

            return ok(response);
        } catch (err) {
            context.error("[UPDATE SYSTEM PROMPT] Error:", err);
            return badRequest("UPDATE_SYSTEM_PROMPT_FAILED", { message: err.message });
        }
    })
});