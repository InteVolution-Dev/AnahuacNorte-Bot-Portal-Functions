// Azure Functions setup
const { app } = require("@azure/functions");
// Middleware for authentication
const { withAuth } = require("../middleware/withAuth.js");
// Local imports
const { ok, badRequest } = require("../utils/response");
const { deployToProduction } = require("../services/deploy/deployService");

// Define the Azure Function ========================
app.http("deploy", {
    route: "deploy",
    methods: ["POST"],
    authLevel: "anonymous",

    handler: withAuth(async (req, context) => {
        console.log("[DEPLOY] Deploy request received");

        try {
            const result = await deployToProduction();

            return ok(result);
        } catch (err) {
            console.log("[DEPLOY] Error during deploy", err);

            return badRequest("FLOW_PATCH_FAILED", { message: err.message });
        }
    })
});
