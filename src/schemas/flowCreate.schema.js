module.exports = {
    type: "object",
    required: ["openapi", "active", "info", "servers", "paths"],
    properties: {
        openapi: { type: "string" },
        active: { type: "boolean" },
        info: {
            type: "object",
            required: ["title", "description", "version"],
            properties: {
                title: { type: "string" },
                description: { type: "string" },
                version: { type: "string" },
            },
            additionalProperties: false,
        },
        servers: {
            type: "array",
            minItems: 1,
            items: {
                type: "object",
                required: ["url"],
                properties: {
                    url: { type: "string", format: "uri" },
                },
                additionalProperties: false,
            },
        },
        paths: {
            type: "object",
            minProperties: 1,
            patternProperties: {
                "^/.*": {
                    type: "object",
                    // Cada path puede tener GET, POST, PUT, DELETE…
                    patternProperties: {
                        "^(get|post|put|delete|patch)$": {
                            type: "object",
                            required: ["summary", "operationId"],
                            properties: {
                                summary: { type: "string" },
                                operationId: { type: "string" },
                                description: { type: "string" },
                                security: {
                                    type: "array",
                                    items: { type: "object" },
                                },
                                requestBody: {
                                    type: "object",
                                    required: ["required", "content"],
                                    properties: {
                                        required: { type: "boolean" },
                                        content: {
                                            type: "object",
                                            properties: {
                                                "application/json": {
                                                    type: "object",
                                                    properties: {
                                                        schema: {
                                                            type: "object",
                                                            properties: {
                                                                type: {
                                                                    type: "string",
                                                                },
                                                                properties: {
                                                                    type: "object",
                                                                },
                                                                required: {
                                                                    type: "array",
                                                                    items: {
                                                                        type: "string",
                                                                    },
                                                                },
                                                            },
                                                        },
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                                responses: {
                                    type: "object",
                                    minProperties: 1,
                                    patternProperties: {
                                        "^[0-9]{3}$": {
                                            type: "object",
                                            required: ["description"],
                                            properties: {
                                                description: { type: "string" },
                                                content: {
                                                    type: "object",
                                                    properties: {
                                                        "application/json": {
                                                            type: "object",
                                                            properties: {
                                                                schema: {
                                                                    type: "object",
                                                                },
                                                            },
                                                        },
                                                    },
                                                },
                                            },
                                        },
                                    },
                                    additionalProperties: false,
                                },
                            },
                            additionalProperties: false,
                        },
                    },
                    additionalProperties: false,
                },
            },
            additionalProperties: false,
        },
        components: {
            type: "object",
            properties: {
                securitySchemes: {
                    type: "object",
                    properties: {
                        ApiKeyAuth: {
                            type: "object",
                            required: ["type", "in", "name"],
                            properties: {
                                type: { type: "string" },
                                in: { type: "string" },
                                name: { type: "string" },
                            },
                        },
                    },
                },
            },
            additionalProperties: false
        },
    },
    additionalProperties: false
};
