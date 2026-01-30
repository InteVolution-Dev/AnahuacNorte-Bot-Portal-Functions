// Azure Function setup
const { app } = require("@azure/functions");
// Middleware
const { withAuth } = require("../middleware/withAuth.js");
// Utils
const { ok, badRequest } = require("../utils/response");
// Foundry
const { getAgentByName } = require("../services/foundry/foundryAgentManagerTool");

app.http("agentGetTest", {
    route: "agent-get-test",
    methods: ["GET"],
    authLevel: "anonymous",

    handler: withAuth(async (req, context) => {
        try {
            const agentName = process.env.FOUNDRY_AGENT_NAME;


            const agent = await getAgentByName(agentName);

            return ok({
                success: true,
                agentName,
                agentVersion: agent?.versions?.latest?.version,
            });

        } catch (err) {
            context.error("[AGENT GET TEST] Failed");
            context.error("Error name:", err?.name);
            context.error("Error code:", err?.code);
            context.error(err);

            return badRequest("AGENT_GET_FAILED", {
                name: err?.name,
                code: err?.code,
                message: err?.message,
            });
        }
    }),
});
