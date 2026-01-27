// foundryExplicitCredential.js
class ExplicitTokenCredential {
    constructor(token) {
        this.token = token;
    }

    async getToken() {
        return {
            token: this.token,
            expiresOnTimestamp: Date.now() + 60 * 60 * 1000 // 1h safety window
        };
    }
}

module.exports = { ExplicitTokenCredential };
