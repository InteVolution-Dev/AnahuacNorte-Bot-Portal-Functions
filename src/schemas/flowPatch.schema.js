module.exports = {
    type: "object",
    required: ["storedFlowRowKey", "active"],
    properties: {
        storedFlowRowKey: { type: "string" },
        active: { type: "boolean" },
    },
    additionalProperties: false,
};
