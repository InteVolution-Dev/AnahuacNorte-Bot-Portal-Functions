module.exports = {
    type: "object",
    properties: {
        flowName: { type: "string" },
        storedFlowRowKey: { type: "string" }
    },
    required: ["flowName", "storedFlowRowKey"],
    additionalProperties: false,
}