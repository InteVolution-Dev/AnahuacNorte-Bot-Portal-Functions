// Azure Functions imports
const { app } = require("@azure/functions");
// Third party imports
const Ajv = require("ajv");
const addFormats = require("ajv-formats");
// Middleware for authentication
const { withAuth } = require("../middleware/withAuth.js");
// Local imports
const { ok, badRequest } = require("../utils/response");
const { createChat } = require("../services/playground/createChat");
const schema = require("../schemas/chatCreate.schema");


// AJV setup ========================================
const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

const validate = ajv.compile(schema);


// Define the Azure Function ========================
app.http("create-chat", {
    route: "playground/chats",
    methods: ["POST"],
    authLevel: "anonymous",

    handler: withAuth( async (req, context) => {
        console.log("[CHAT CREATE] Create chat request received");
        try {
            // Validate request body
            const body = await req.json();
            const valid = validate(body);
            if (!valid) {
                return badRequest("INVALID_PAYLOAD", {
                    errors: validate.errors,
                });
            }
            const result = await createChat(body);
            return ok(result);
        } catch (err) {
            console.log("[CHAT CREATE] Error during chat creation", err);

            return badRequest("CHAT_CREATE_FAILED", { message: err.message });
        }
    })
});