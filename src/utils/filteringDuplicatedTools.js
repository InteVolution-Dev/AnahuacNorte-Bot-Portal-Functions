module.exports = (existingTools = [], newFlowToolName) => {
    // Evitar duplicados por nombre
    return existingTools.filter(
        t => !(t.type === "openapi" && t.openapi?.name === newFlowToolName)
    );
}