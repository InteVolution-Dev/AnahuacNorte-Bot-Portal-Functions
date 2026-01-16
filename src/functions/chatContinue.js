// Azure Functions imports
const { app } = require("@azure/functions");
// Third party imports
const Ajv = require("ajv");
const addFormats = require("ajv-formats");
// Middleware for authentication
const { withAuth } = require("../middleware/withAuth.js");
// Local imports
const { ok, badRequest } = require("../utils/response");
const { continueChat } = require("../services/playground/continueChat");
const schema = require("../schemas/chatContinue.schema");


// AJV setup ========================================
const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

const validate = ajv.compile(schema);


// Define the Azure Function ========================
app.http("continue-chat", {
    route: "playground/chats/continue",
    methods: ["POST"],
    authLevel: "anonymous",

    handler: withAuth( async (req, context) => {
        console.log("[CHAT CONTINUE] Continue chat request received");
        try {
            // Validate request body
            const body = await req.json();
            const valid = validate(body);
            if (!valid) {
                return badRequest("INVALID_PAYLOAD", {
                    errors: validate.errors,
                });
            }
            const result = await continueChat(body);
            return ok(result);
        } catch (err) {
            console.log("[CHAT CONTINUE] Error during chat continuation", err);
            return badRequest("CHAT_CONTINUE_ERROR", {
                message: err.message,
            });
        }
    })
});