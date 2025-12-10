/**
 * Standardized API response builder for Azure Functions.
 * Format:
 *   {
 *       data: {},
 *       meta: {},
 *       code: { http: Number, message: String }
 *   }
 */

function buildResponse(status, message, data = null, meta = {}) {
    return {
        status,
        jsonBody: {
            code: {
                http: status,
                message,
            },
            data,
            meta: {
                timestamp: new Date().toISOString(),
                ...meta,
            },
            
        },
    };
}

function ok(data = {}, meta = {}) {
    return buildResponse(200, "SUCCESS", data, meta);
}

function created(data = {}, meta = {}) {
    return buildResponse(201, "RESOURCE_CREATED", data, meta);
}

function badRequest(message = "BAD_REQUEST", meta = {}) {
    return buildResponse(400, message, null, meta);
}

function unauthorized(message = "UNAUTHORIZED", meta = {}) {
    return buildResponse(401, message, null, meta);
}

function notFound(message = "NOT_FOUND", meta = {}) {
    return buildResponse(404, message, null, meta);
}

function error(message = "INTERNAL_SERVER_ERROR", meta = {}, status = 500) {
    return buildResponse(status, message, null, meta);
}

module.exports = {
    ok,
    created,
    badRequest,
    unauthorized,
    notFound,
    error,
};
