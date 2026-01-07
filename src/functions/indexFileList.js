// Azure Functions imports
const { app } = require("@azure/functions");
// Local imports
const { ok, badRequest } = require("../utils/response");
const { listIndexedFiles } = require("../services/indexes/listIndexedFiles");



// Define the Azure Function ========================
app.http("list-index-files", {
    route: "indexes/files",
    methods: ["GET"],
    authLevel: "anonymous",
    handler: async (request, context) => {
        try {
            const indexId = process.env.AZURE_OPENAI_PLAYGROUND_INDEX_ID;
            if (!indexId) {
                return badRequest("INDEX_ID_REQUIRED", {
                    message: "indexId is required"
                });
            }

            const result = await listIndexedFiles({ indexId });
            return ok(result);

        } catch (err) {
            context.error("[LIST INDEX FILES] Error:", err);
            return badRequest("LIST_INDEX_FILES_FAILED", {
                message: err.message
            });
        }
    }
});
