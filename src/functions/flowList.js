const { app } = require('@azure/functions');
const { getTableClient } = require('../../shared/storage');

app.http('flowList', {
    route: 'flows-list',
    methods: ['GET'],
    authLevel: 'anonymous',

    handler: async (req, context) => {
        try {
            const table = getTableClient("flows");

            const iterator = table.listEntities({
                queryOptions: {
                    filter: `PartitionKey eq 'flows'`
                }
            });

            const flows = [];

            for await (const entity of iterator) {
                flows.push({
                    id: entity.RowKey,
                    name: entity.name ?? null,
                    description: entity.description ?? null,
                    active:
                        entity.active === true ||
                        entity.active === "true" ||
                        entity.active === "1",
                    updatedAt: entity.updatedAt ?? null,
                    steps: entity.json ? JSON.parse(entity.json) : []
                });
            }

            return {
                status: 200,
                jsonBody: { flows }
            };

        } catch (err) {
            context.log.error("Error in flowList:", err);

            return {
                status: 500,
                jsonBody: {
                    error: "Internal Server Error",
                    details: err.message
                }
            };
        }
    }
});
