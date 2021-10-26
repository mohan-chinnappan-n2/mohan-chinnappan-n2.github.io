"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !exports.hasOwnProperty(p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Context = exports.Org = exports.User = exports.InvocationEvent = void 0;
/**
 * Represents a function invocation event.
 */
class InvocationEvent {
    constructor(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data, dataContentType, dataSchema, id, source, time, type, headers) {
        this.data = data;
        this.dataContentType = dataContentType;
        this.dataSchema = dataSchema;
        this.id = id;
        this.source = source;
        this.time = time;
        this.type = type;
        this.headers = headers;
    }
}
exports.InvocationEvent = InvocationEvent;
/**
 * Represents invoking user.
 */
class User {
    constructor(id, username, onBehalfOfUserId) {
        this.id = id;
        this.username = username;
        this.onBehalfOfUserId = onBehalfOfUserId;
    }
}
exports.User = User;
/**
 * Represents invoking org and user.
 *
 * For convenience and if the request provides org access, API instances
 * are initialized and set on this object.
 */
class Org {
    constructor(apiVersion, baseUrl, domainUrl, id, user, data, unitOfWork, unitOfWorkGraph) {
        this.apiVersion = apiVersion;
        this.baseUrl = baseUrl;
        this.domainUrl = domainUrl;
        this.id = id;
        this.user = user;
        this.data = data;
        this.unitOfWork = unitOfWork;
        this.unitOfWorkGraph = unitOfWorkGraph;
    }
    /**
     * @see [[DataApi]]
     */
    async request(method, url, body, headers) {
        if (!this.data) {
            throw new Error('Data API not provided.');
        }
        return await this.data.request(method, url, body, headers);
    }
}
exports.Org = Org;
/**
 * Respresents the context of the function invocation.
 *
 * If the request originates from an org, the org object repesents
 * the invoking org and user.
 */
class Context {
    constructor(id, logger, org, secrets) {
        this.id = id;
        this.logger = logger;
        this.org = org;
        this.secrets = secrets;
    }
}
exports.Context = Context;
__exportStar(require("./Secrets"), exports);
__exportStar(require("./enrich"), exports);
//# sourceMappingURL=index.js.map