// jwksCache.js
const { createRemoteJWKSet } = require("jose");

const TENANT_ID = process.env.AZURE_TENANT_ID;

const JWKS = createRemoteJWKSet(
    new URL(
        `https://login.microsoftonline.com/${TENANT_ID}/discovery/v2.0/keys`
    )
);

module.exports = { JWKS };
