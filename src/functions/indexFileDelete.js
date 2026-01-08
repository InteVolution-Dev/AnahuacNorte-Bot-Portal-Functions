// Azure Functions imports
const { app } = require('@azure/functions');
// Third party imports
const Ajv = require("ajv");
const addFormats = require("ajv-formats");
// Local imports
const { ok, badRequest } = require("../utils/response");
const { deleteFile } = require("../services/indexes/deleteFile");
const schema = require("../schemas/deleteFile.schema");



// AJV setup ========================================
const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

const validate = ajv.compile(schema);



// Define the Azure Function ========================
app.http('delete-file', {
    route: 'indexes/delete-file',
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        try {
            console.log("[DELETE FILE] Delete file request received");
            // Validate request body
            const body = await request.json();
            const valid = validate(body);
            if (!valid) {
                return badRequest("INVALID_PAYLOAD", {
                    errors: validate.errors,
                });
            }
            const response = await deleteFile(body);
            
            return ok(response);
        } catch (err) {
            context.error("[DELETE FILE] Error:", err);
            return badRequest("DELETE_FILE_FAILED", { message: err.message });
        }
    }
});