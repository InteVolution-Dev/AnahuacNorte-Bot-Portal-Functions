// Azure Functions setup
const { app } = require("@azure/functions");

// Local imports
const { ok, badRequest } = require("../utils/response");
const { deployToProduction } = require("../services/deploy/deployService");

// Define the Azure Function ========================
app.http("deploy", {
    route: "deploy",
    methods: ["POST"],
    authLevel: "anonymous",

    handler: async (req, context) => {
        console.log("[DEPLOY] Deploy request received");

        try {
            const result = await deployToProduction();

            return ok(result);
        } catch (err) {
            context.error("[DEPLOY] Error during deploy", err);

            return badRequest("FLOW_PATCH_FAILED", { message: err.message });
        }
    },
});
