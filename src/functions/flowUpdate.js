// Azure Function setup
const { app } = require("@azure/functions");
// Third party imports
const Ajv = require("ajv");
const addFormats = require("ajv-formats");
// Local imports
const { badRequest, ok } = require("../utils/response");
const { updateFlow } = require("../services/flows/updateFlow.js");
const schema = require("../schemas/flowUpdate.schema");


// AJV setup ========================================
const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

const validate = ajv.compile(schema);


// Define the Azure Function ========================
app.http("flowUpdate", {
    route: "update-flow",
    methods: ["PUT"],
    authLevel: "anonymous",

    handler: async (req, context) => {
        try {
            // Validate request body
            const body = await req.json();
            const valid = validate(body);
            if (!valid) {
                return badRequest("INVALID_PAYLOAD", {
                    errors: validate.errors,
                });
            }
            // Call the main functionality
            const response = await updateFlow(body);
            return ok(response);
        } catch (err) {
            console.error("[FLOW UPDATE] Error:", err);
            return badRequest("UPDATE_FAILED", { message: err.message });
        }
    }
});

