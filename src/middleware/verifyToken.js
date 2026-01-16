const fs = require("fs");
const path = require("path");
const { jwtVerify, createLocalJWKSet } = require("jose");

// === CONFIG =================================================
const TENANT_ID = process.env.AZURE_TENANT_ID;
const CLIENT_ID = process.env.AZURE_CLIENT_ID;

if (!TENANT_ID || !CLIENT_ID) {
    throw new Error("Missing AZURE_TENANT_ID or AZURE_CLIENT_ID");
}

// === JWKS LOCAL =============================================
const jwksPath = path.join(__dirname, "jwks.local.json");
const jwks = JSON.parse(fs.readFileSync(jwksPath, "utf8"));
const JWKS = createLocalJWKSet(jwks);

// === VERIFY FUNCTION ========================================
async function verifyToken(token) {
    const { payload } = await jwtVerify(token, JWKS, {
        audience: `api://${CLIENT_ID}`,
        issuer: `https://sts.windows.net/${TENANT_ID}/`,
    });

    // scope validation (igual que en Python)
    const scopes = (payload.scp || "").split(" ");
    if (!scopes.includes("access_as_user")) {
        throw new Error("Falta scope requerido access_as_user");
    }

    return payload;
}

module.exports = { verifyToken };
