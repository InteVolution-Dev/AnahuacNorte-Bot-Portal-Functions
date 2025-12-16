// Azure Function setup
const { app } = require("@azure/functions");
// Third party imports
const Ajv = require("ajv");
const addFormats = require("ajv-formats");
// Local imports
const { badRequest, ok } = require("../utils/response");
const { patchFlow } = require("../services/flows/patchFlow.js");
const schema = require("../schemas/flowPatch.schema");


// AJV setup ========================================
const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

const validate = ajv.compile(schema);


// Define the Azure Function ========================
app.http("flowPatch", {
    route: "patch-flow",
    methods: ["PATCH"],
    authLevel: "anonymous",

    handler: async (req, context) => {
        // Validate request body
        const body = await req.json();
        const valid = validate(body);
        if (!valid) {
            return badRequest("INVALID_PAYLOAD", {
                errors: validate.errors,
            });
        }
        // Call the main functionality
        const response = await patchFlow(body);
        return ok(response);
    }
});

