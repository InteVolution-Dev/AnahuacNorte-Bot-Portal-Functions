async function verifyMsToken(token) {
    // TODO:
    // - Obtener JWKS
    // - Validar firma RS256
    // - Validar audience
    // - Validar issuer
    // - Validar tenant
    // - Validar scopes / roles

    return {
        code: 501,
        message: "Not implemented",
    };
}

module.exports = {
    verifyMsToken,
};
