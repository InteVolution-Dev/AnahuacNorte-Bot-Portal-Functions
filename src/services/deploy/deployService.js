// Local imports
const { getFromTable, queryTable, storeInTable } = require("../storage/storage");
const { configureAgent } = require("../foundry/foundryAgentManagerTool");


// CONSTANTES ==============================
const FLOWS_TABLE_NAME = process.env.FLOWS_TABLE_NAME;
const FLOWS_PARTITION = process.env.FLOWS_PARTITION;
const AGENT_ENVS_TABLE = process.env.AGENT_ENVS_TABLE;
const AGENT_ENV_PARTITION = process.env.AGENT_ENV_PARTITION;
const INDEXES_TABLE = process.env.INDEXES_TABLE;
const INDEXES_PARTITION = process.env.INDEXES_PARTITION;


// FUNCIONES ==============================
// Función principal de despliegue a producción
async function deployToProduction() {
    console.log("[DEPLOY] Starting deployment to production");

    // Leer estado del playground
    const playgroundEnv = await getFromTable({
        tableName: AGENT_ENVS_TABLE,
        partitionKey: AGENT_ENV_PARTITION,
        rowKey: "playground",
    });

    if (!playgroundEnv) {
        throw new Error("PLAYGROUND_ENV_NOT_FOUND");
    }

    if (playgroundEnv.status && playgroundEnv.status !== "ACTIVE") {
        throw new Error("PLAYGROUND_ENV_INACTIVE");
    }

    if (!playgroundEnv.activeIndexRowKey) {
        throw new Error("PLAYGROUND_ENV_HAS_NO_ACTIVE_INDEX");
    }
    console.log("[DEPLOY] Playground env:", playgroundEnv);

    // Leer estado de producción
    const productionEnv = await getFromTable({
        tableName: AGENT_ENVS_TABLE,
        partitionKey: AGENT_ENV_PARTITION,
        rowKey: "prod",
    });

    if (!productionEnv) {
        throw new Error("PRODUCTION_ENV_NOT_FOUND");
    }

    if (productionEnv.status && productionEnv.status !== "ACTIVE") {
        throw new Error("PRODUCTION_ENV_INACTIVE");
    }

    if (!productionEnv.agentId) {
        throw new Error("PRODUCTION_ENV_HAS_NO_AGENT");
    }
    console.log("[DEPLOY] Production env:", productionEnv);

    console.log("[DEPLOY] Playground and Production environments loaded");

    // No-op check
    if ( productionEnv.activeIndexRowKey && productionEnv.activeIndexRowKey === playgroundEnv.activeIndexRowKey ) {
        console.log("[DEPLOY] No-op: production already in sync with playground");

        return {
            deployed: false,
            reason: "ALREADY_IN_SYNC",
            environment: "production",
            indexRowKey: productionEnv.activeIndexRowKey,
        };
    }

    // Resolver index a desplegar
    const indexRowKeyToDeploy = playgroundEnv.activeIndexRowKey;

    const indexEntity = await getFromTable({
        tableName: INDEXES_TABLE,
        partitionKey: INDEXES_PARTITION,
        rowKey: indexRowKeyToDeploy,
    });

    if (!indexEntity) {
        throw new Error("INDEX_NOT_FOUND to deploy: " + indexRowKeyToDeploy);
    }

    // status no nos aporta nada aún, pero por si acaso
    if (indexEntity.status && indexEntity.status !== "ACTIVE") {
        throw new Error("INDEX_DISABLED. Cannot deploy index: " + indexRowKeyToDeploy);
    }

    console.log(`[DEPLOY] Index resolved for production: ${indexRowKeyToDeploy} -> ${productionEnv.activeIndexRowKey}`);

    // Resolver flows activos
    // const activeFlows = ...
    const activeFlows = await queryTable({
        tableName: FLOWS_TABLE_NAME,
        filter: `desiredActive eq true and PartitionKey eq '${FLOWS_PARTITION}'`,
    });

    if (!activeFlows || activeFlows.length === 0) {
        console.log("[DEPLOY] No active flows found to deploy");
    };

    // Parsear OpenAPI payloads
    const openApiTools = [];
    for (const flow of activeFlows) {
        if (!flow.payloadJson) {
            console.warn(`[DEPLOY] Flow ${flow.rowKey} has no payloadJson, skipping`);
            continue;
        }

        let openApiJson;
        try {
            openApiJson = JSON.parse(flow.payloadJson);
        } catch (err) {
            throw new Error(`INVALID_OPENAPI_JSON_IN_FLOW_${flow.rowKey}`);
        }

        openApiTools.push({
            rowKey: flow.rowKey,
            openApiJson,
        });
    }

    // Actualizar agente productivo en Foundry
    await configureAgent({
        agentId: productionEnv.agentId,
        indexId: indexRowKeyToDeploy,
        openApiTools,
    });
    console.log(`[DEPLOY] Configured production agent ${productionEnv.agentId} with index ${indexRowKeyToDeploy} and ${openApiTools.length} OpenAPI tools`);


    // Persistir nuevo estado en agentenvs.production
    await storeInTable({
        tableName: AGENT_ENVS_TABLE,
        entity: {
            partitionKey: AGENT_ENV_PARTITION,
            rowKey: "prod",
            activeIndexRowKey: indexRowKeyToDeploy,
            lastDeployedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        mode: "merge",
    });


    console.log("[DEPLOY] Deployment completed successfully");

    return {
        deployed: true,
        environment: "production",
        deployedAt: new Date().toISOString(),
    };
}

module.exports = {
    deployToProduction,
};
