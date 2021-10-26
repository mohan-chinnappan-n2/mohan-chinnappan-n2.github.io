"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectionConfig = void 0;
class ConnectionConfig {
    constructor(accessToken, apiVersion, instanceUrl) {
        this.apiVersion = apiVersion;
        this.instanceUrl = instanceUrl;
        // Avoid serialization (default enumerable: false)
        Object.defineProperty(this, 'accessToken', { value: accessToken, writable: false });
    }
    get accessToken() {
        return this.accessToken;
    }
}
exports.ConnectionConfig = ConnectionConfig;
//# sourceMappingURL=ConnectionConfig.js.map