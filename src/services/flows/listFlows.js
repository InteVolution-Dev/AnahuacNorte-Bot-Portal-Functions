// Local imports
const { getTableClient } = require('../storage/storage.js');


// Función para listar los flujos (tools) de un agente en Foundry
async function listFlows() {
    try {
        const table = getTableClient(process.env.FLOWS_TABLE_NAME);

        const iterator = table.listEntities({
            queryOptions: {
                filter: `PartitionKey eq 'flows'`,
            },
        });
        
        const flows = [];

        for await (const entity of iterator) {
            console.log(`[DEBUG] Entidad recuperada: ${JSON.stringify(entity, null, 2)}`);
            flows.push({
                id: entity.rowKey,
                name: entity.title ?? null,
                description: entity.description ?? null,
                active:
                    entity.active === true ||
                    entity.active === "true" ||
                    entity.active === "1" ||
                    entity.active === 1,
                updatedAt: entity.updatedAt ?? null,
                paths: entity.payloadJson
                    ? JSON.parse(entity.payloadJson).paths
                    : {},
                components: entity.payloadJson
                    ? JSON.parse(entity.payloadJson).components
                    : {},
            });
        }

        return {flows};
    } catch (err) {
        context.log.error("Error in flowList:", err);

        return {
            status: 500,
            jsonBody: {
                error: "Internal Server Error",
                details: err.message,
            },
        };
    }
}

module.exports = { listFlows };
