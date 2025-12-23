// Azure Functions imports
const { app } = require("@azure/functions");
// Local imports
const { ok, badRequest } = require("../utils/response");
const { createChat } = require("../services/playground/playgroundManagerTool");


// Define the Azure Function ========================
app.http("create-chat", {
    route: "playground/create-chat",
    methods: ["POST"],
    authLevel: "anonymous",

    handler: async (req, context) => {
        console.log("[CHAT CREATE] Create chat request received");

        try {
            const result = await createChat(req.body);
            return ok(result);
        } catch (err) {
            console.log("[CHAT CREATE] Error during chat creation", err);

            return badRequest("CHAT_CREATE_FAILED", { message: err.message });
        }
    },
});