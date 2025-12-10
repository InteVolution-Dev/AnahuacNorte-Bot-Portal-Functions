const { TableClient } = require("@azure/data-tables");

function getTableClient(tableName) {
    const connectionString = process.env.STORAGE_CONN;

    if (!connectionString) {
        throw new Error("Missing STORAGE_CONN in environment variables.");
    }

    return TableClient.fromConnectionString(connectionString, tableName);
}

module.exports = { getTableClient };
