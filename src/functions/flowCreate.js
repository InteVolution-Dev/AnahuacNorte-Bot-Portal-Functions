// Third party imports
const { app } = require("@azure/functions");
const Ajv = require("ajv");
const addFormats = require("ajv-formats");
// Local imports
const { badRequest, created } = require("../utils/response");
const schema = require("../schemas/flowCreate.schema");
const { buildFunctionToolFromOpenAPI } = require("../services/flows/flowBuilder");

// AJV setup
const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

const validate = ajv.compile(schema);

// Define the Azure Function
app.http("flowCreate", {
    route: "create-flow",
    methods: ["POST"],
    authLevel: "anonymous",

    handler: async (req, context) => {
        const body = await req.json();

        const valid = validate(body);

        if (!valid) {
            return badRequest("INVALID_PAYLOAD", {
                errors: validate.errors,
            });
        }

        // ...guardar en Table Storage, etc.
        const { functionTool, serviceProperties } = buildFunctionToolFromOpenAPI(
            
        )
        return created({ id: "flow-x" });
    },
});
