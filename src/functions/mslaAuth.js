// Azure Functions setup
const { app } = require("@azure/functions");

// Local imports
const { unauthorized, forbidden, ok } = require("../utils/response");
const { verifyMsToken } = require("../services/auth/verifyMsToken");

// Define the Azure Function ========================
app.http("mslaAuth", {
    route: "msla-auth",
    methods: ["POST"],
    authLevel: "anonymous",

    handler: async (req, context) => {
        try {
            const authHeader = req.headers.get("authorization");

            if (!authHeader || !authHeader.startsWith("Bearer ")) {
                return unauthorized("MISSING_TOKEN", {
                    message: "Authorization header falta o es inválido",
                });
            }

            const token = authHeader.replace("Bearer ", "");

            const result = await verifyMsToken(token);

            if (result.code === 401) {
                return unauthorized(result.message, result);
            }

            if (result.code === 403) {
                return forbidden(result.message, result);
            }

            return ok({
                code: "AUTH_OK",
                message: "Token valid",
                user: result.user,
            });

        } catch (err) {
            context.log.error("ERROR EN MSLA AUTH:");
            context.log.error(err);

            return unauthorized("AUTH_FAILED", {
                message: err.message,
            });
        }
    },
});
