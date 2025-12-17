// Azure libraries
const { TableClient } = require("@azure/data-tables");


//  Función para obtener un cliente de tabla de Azure Table Storage
function getTableClient(tableName) {
    const connectionString = process.env.STORAGE_CONN;

    if (!connectionString) {
        throw new Error("Missing STORAGE_CONN in environment variables.");
    }

    return TableClient.fromConnectionString(connectionString, tableName);
};


// Función para almacenar (o actualizar) una entidad en Table Storage
async function storeInTable({ tableName, entity, mode = "insert" }) {
    const connectionString = process.env.STORAGE_CONN;

    const tableClient = TableClient.fromConnectionString(connectionString, tableName);
    await tableClient.createTable();  // Crear la tabla si no existe, no truena si ya existe

    if (mode === "replace") {
        console.log("[DEBUG] Replacing entity in Table Storage:", entity);
        await tableClient.updateEntity(entity, "Replace");  // Actualizamos la entidad existente
    } else if (mode === "merge") {
        console.log("[DEBUG] Merging entity in Table Storage:", entity);
        await tableClient.updateEntity(entity, "Merge");  // Hacemos merge de la entidad existente
    } else {
        // Por defecto hacemos un insert
        await tableClient.createEntity(entity);  // Insertamos la entidad
    }

    return entity;
};


// Función para traer una entidad de Table Storage
async function getFromTable({ tableName, rowKey }) {
    try {
        const client = TableClient.fromConnectionString(process.env.STORAGE_CONN, tableName);

        const entity = await client.getEntity("flows", rowKey);
        return entity;
    } catch (err) {
        console.error("[STORAGE] ERROR AL RECUPERAR ENTIDAD DE TABLE STORAGE:", {
            tableName,
            rowKey,
            error: err.message
        });
        throw err;
    }
};

// Función para eliminar una entidad de Table Storage
async function deleteFromTable({ tableName, rowKey }) {
    const client = TableClient.fromConnectionString(process.env.STORAGE_CONN, tableName);

    await client.deleteEntity("flows", rowKey);

    return { deleted: true };
};


// Función para eliminar entidades de Table Storage por título
async function deleteFromTableByTitle({ tableName, title }) {
    const client = TableClient.fromConnectionString(process.env.STORAGE_CONN, tableName);

    // Listar entidades que coincidan con title
    const entities = client.listEntities({
        queryOptions: {
            filter: `PartitionKey eq 'flows' and title eq '${title}'`
        }
    });

    let deletedCount = 0;

    for await (const entity of entities) {
        await client.deleteEntity(entity.partitionKey, entity.rowKey);
        deletedCount++;
    }

    return { deletedCount };
};


module.exports = { 
    storeInTable,
    getTableClient,
    getFromTable,
    deleteFromTable,
    deleteFromTableByTitle
};