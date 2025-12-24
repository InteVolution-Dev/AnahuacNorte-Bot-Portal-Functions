module.exports = {
    type: "object",
    required: ["conversationId", "userMessage"],
    properties: {
        conversationId: { type: "string"},
        userMessage: { type: "string"},
    },
    additionalProperties: false,
}