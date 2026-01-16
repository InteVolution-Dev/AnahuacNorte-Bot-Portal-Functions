// Local imports
const { verifyToken } = require("./verifyToken");
const { isUserAllowed } = require("./isUserAllowed");
const { unauthorized, forbidden, error } = require("../utils/response");


// CONSTANTS ==============================================================
const EXPECTED_DOMAIN = "@anahuac.mx";



// Funcion principal del middleware
const withAuth = (handler) => {
    return async (req, context) => {
        try {
            const auth = req.headers.get("authorization");

            if (!auth || !auth.startsWith("Bearer ")) {
                return unauthorized("MISSING_TOKEN", {
                    message: "Authorization header missing or invalid"
                });
            }

            const token = auth.replace("Bearer ", "");
            const claims = await verifyToken(token);
            const email =
                claims.preferred_username ||
                claims.upn ||
                claims.email;
            
            const normalizedEmail = email ? email.toLowerCase() : null;

            if (!normalizedEmail || !normalizedEmail.endsWith(EXPECTED_DOMAIN)) {
                return forbidden("INVALID_DOMAIN", {
                    message: "User domain is not allowed"
                });
            }

            const isAllowed = await isUserAllowed(normalizedEmail);
            if (!isAllowed) {
                return forbidden("USER_NOT_ALLOWED", {
                    message: "El usuario no está en la lista de administradores admitidos."
                });
            }

            // inyectar identidad al handler
            req.user = {
                oid: claims.oid,
                email: normalizedEmail,
                tid: claims.tid,
                name: claims.name
            };

            return handler(req, context);

        } catch (err) {
            context.log("AUTH_MIDDLEWARE_ERROR", err);

            return error("AUTH_MIDDLEWARE_ERROR", {
                message: err.message
            }, err.statusCode || 500);
        }
    };
};

module.exports = { withAuth };
