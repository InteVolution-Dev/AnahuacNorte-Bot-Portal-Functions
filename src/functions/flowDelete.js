// Azure Functions setup
const { app } = require("@azure/functions");
// Third party imports
const Ajv = require("ajv");
const addFormats = require("ajv-formats");
// Middleware for authentication
const { withAuth } = require("../middleware/withAuth.js");
// Local imports
const { badRequest, ok } = require("../utils/response");
const { deleteFlow } = require("../services/flows/deleteFlow.js");
const schema = require("../schemas/flowDelete.schema");


// AJV setup ========================================
const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

const validate = ajv.compile(schema);


// Define the Azure Function ========================
app.http("flowDelete", {
    route: "delete-flow",
    methods: ["DELETE"],
    authLevel: "anonymous",

    handler: withAuth( async (req, context) => {
        // Validate request body
        try {
            const body = await req.json();
            const valid = validate(body);
            if (!valid) {
                return badRequest("INVALID_PAYLOAD", {
                    errors: validate.errors,
                });
            }
            // Call the main functionality
            const response = await deleteFlow(body);
            return ok(response);
        } catch (err) {
            console.error("ERROR EN FLOW DELETE:");
            console.error(err);
            return badRequest("FLOW_DELETE_FAILED", { message: err.message });
        }
    })
});
