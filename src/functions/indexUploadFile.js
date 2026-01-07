// Azure Functions imports
const { app } = require('@azure/functions');
// Local imports
const { ok, badRequest } = require("../utils/response");
const { uploadFiles } = require("../services/indexes/uploadFiles");
const schema = require("../schemas/indexUploadFile.schema");



// Define the Azure Function ========================
app.http('upload-files', {
    route: 'indexes/upload-files',
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        try {
            
            console.log("[UPLOAD FILES] Upload files request received");
            const contentType = request.headers.get("content-type") || "";

            if (!contentType.includes("multipart/form-data")) {
                return badRequest("INVALID_CONTENT_TYPE", { message: "El tipo de contenido debe ser multipart/form-data" });
            }

            const formData = await request.formData();
            const files = formData.getAll("files");

            if (!files || files.length === 0) {
                throw new Error("Al menos un archivo es requerido");
            }

            const indexId = process.env.AZURE_OPENAI_PLAYGROUND_INDEX_ID;
            if (!indexId) {
                throw new Error("indexId es requerido");
            }

            

            const result = await uploadFiles({
                indexId,
                files
            });
            
            return ok(result);
        } catch (err) {
            context.error("[UPLOAD FILES] Error:", err);
            return badRequest("UPLOAD_FILES_FAILED", { message: err.message });
        }
    }
});