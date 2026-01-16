// Azure Functions setup
const { app } = require('@azure/functions');
// Middleware for authentication
const { withAuth } = require("../middleware/withAuth.js");
// Local imports
const { listFlows } = require("../services/flows/listFlows.js");
const { badRequest, ok } = require("../utils/response");



// Define the Azure Function ========================
app.http('flowList', {
    route: 'flows-list',
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: withAuth(async (req, context) => {
        try {
            const response = await listFlows();
            if (response.status && response.status !== 200) {
                return badRequest("ERROR_LISTING_FLOWS", response.jsonBody);
            }
            return ok(response);
        } catch (err) {
            console.error("ERROR EN FLOW LIST:");
            console.error(err);
            return badRequest("FLOW_LIST_FAILED", { message: err.message });
        }
    })
});
