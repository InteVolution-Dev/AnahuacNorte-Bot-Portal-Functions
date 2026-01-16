// Azure Functions imports
const { app } = require('@azure/functions');
// Third party imports
const Ajv = require("ajv");
const addFormats = require("ajv-formats");
// Middleware for authentication
const { withAuth } = require("../middleware/withAuth.js");
// Local imports
const { ok, badRequest } = require("../utils/response");
const { updateSystemPrompt } = require("../services/prompt/updateSystemPrompt");
const schema = require("../schemas/systemPromptUpdate.schema");



// AJV setup ========================================
const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

const validate = ajv.compile(schema);



// Define the Azure Function ========================
app.http('updateSystemPrompt', {
    route: 'system-prompt',
    methods: ['PUT'],
    authLevel: 'anonymous',
    handler: withAuth( async (request, context) => {
        try {
            console.log("[UPDATE SYSTEM PROMPT] Update system prompt request received");
            // Validate request body
            const body = await request.json();
            const valid = validate(body);
            if (!valid) {
                return badRequest("INVALID_PAYLOAD", {
                    errors: validate.errors,
                });
            }
            const response = await updateSystemPrompt(body);
            
            return ok(response);
        } catch (err) {
            context.error("[UPDATE SYSTEM PROMPT] Error:", err);
            return badRequest("UPDATE_SYSTEM_PROMPT_FAILED", { message: err.message });
        }
    })
});