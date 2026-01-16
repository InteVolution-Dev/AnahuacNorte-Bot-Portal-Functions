// Azure Functions imports
const { app } = require("@azure/functions");
// Middleware for authentication
const { withAuth } = require("../middleware/withAuth.js");
// Local imports
const { ok, badRequest } = require("../utils/response");


// Define the Azure Function ========================
app.http("update-config", {
    route: "config/update",
    methods: ["POST"],
    authLevel: "anonymous",

    handler: withAuth( async (req, context) => {
        console.log("[CONFIG UPDATE] Config update request received");
        try {
            // Aquí iría la lógica para actualizar la configuración
            console.log("[CONFIG UPDATE] Updating configuration with data:", req.body);
            // Simular actualización exitosa
            return ok({ message: "Configuration updated successfully" });
        } catch (err) {
            console.log("[CONFIG UPDATE] Error during configuration update", err);
            return badRequest("CONFIG_UPDATE_FAILED", { message: err.message });
        }
    })
});