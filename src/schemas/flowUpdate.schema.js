module.exports = {
    type: "object",
    required: ["openApiJson", "flowName", "storedFlowRowKey"],
    properties: {
        flowName: { type: "string" },
        storedFlowRowKey: { type: "string" },
        openApiJson: {
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
                                        parameters: {
                                            type: "array",
                                            items: {
                                                type: "object",
                                                required: ["name", "in", "schema"],
                                                properties: {
                                                    name: { type: "string" },
                                                    in: {
                                                        type: "string",
                                                        enum: ["path", "query", "header", "cookie"]
                                                    },
                                                    required: { type: "boolean" },
                                                    description: { type: "string" },
                                                    schema: {
                                                        type: "object",
                                                        required: ["type"],
                                                        properties: {
                                                            type: {
                                                                type: "string",
                                                                enum: ["string", "number", "integer", "boolean"]
                                                            }
                                                        },
                                                        additionalProperties: true
                                                    }
                                                },
                                                additionalProperties: false
                                            }
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
                            minProperties: 1,
                            additionalProperties: false,
                            patternProperties: {
                                "^[a-zA-Z0-9_]+$": {
                                    type: "object",
                                    required: ["type"],
                                    properties: {
                                        type: {
                                            type: "string",
                                            enum: ["apiKey", "http"],
                                        },
                                        in: {
                                            type: "string",
                                            enum: ["header", "query"],
                                        },
                                        name: { type: "string" },
                                        scheme: {
                                            type: "string",
                                            enum: ["bearer"],
                                        },
                                        value: { type: "string" },
                                    },
                                    additionalProperties: false,
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
};
