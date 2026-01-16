// Local imports
const { getFromTable } = require("../services/storage/storage");


// CONSTANTS ==============================================================
const TABLE_NAME = "allowedUsers";
const PARTITION_KEY = "allowed-users";



// FUNCIONES ==============================================================
// Funcion principal del middleware
async function isUserAllowed(email) {
    // aquí debemos tomar el email recibido y verificar si está en la lista de permitidos
    // la lista es una tabla en table storage
    // el Partition Key es: allowed-users
    // el Row Key es el email del usuario
    if (!email) return false;
    // email ya viene nortmalizado en lowercase desde el middleware
    try {
        const isAllowed = await getFromTable({
            tableName: TABLE_NAME,
            partitionKey: PARTITION_KEY,
            rowKey: normalizedEmail
        });
        console.log(`[DEBUG] isUserAllowed: Usuario ${normalizedEmail} está en la allowlist ${isAllowed}`); 
        // Si no truena, la entidad existe
        return true;
    } catch (err) {
        if (err.statusCode === 404) {
            // Usuario no encontrado en allowlist
            return false;
        }
        console.error("[isUserAllowed] ERROR al obtener el cliente de tabla:", err);
        throw err;
    }
}



module.exports = { isUserAllowed };