// Azure Functions setup
const { app } = require("@azure/functions");
// Third party imports
const Ajv = require("ajv");
const addFormats = require("ajv-formats");
// Local imports
const { badRequest, created } = require("../utils/response");
const { createFlow } = require("../services/flows/createFlow.js");
const schema = require("../schemas/flowCreate.schema");


// AJV setup ========================================
const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

const validate = ajv.compile(schema);


// Define the Azure Function ========================
app.http("flowCreate", {
    route: "create-flow",
    methods: ["POST"],
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
            const response = await createFlow(body);
            return created(response);
        } catch (err) {
            console.error("ERROR EN FLOW CREATE:");
            console.error(err);
            return badRequest("FLOW_CREATE_FAILED", { message: err.message });
        }
    },
});
