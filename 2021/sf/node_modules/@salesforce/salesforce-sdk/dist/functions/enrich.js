"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enrichFn = void 0;
const logger_1 = require("@salesforce/core/lib/logger");
const functions_1 = require("../functions");
const unit_of_work_1 = require("../api/unit-of-work");
const ConnectionConfig_1 = require("../api/ConnectionConfig");
const utils_1 = require("../utils");
const DataApi_1 = require("../api/DataApi");
// convert CloudEvent.time to milliseconds since 1970 UTC
function timeMillis(cloudEventTime) {
    if (cloudEventTime == null) {
        return new Date().getTime();
    }
    return Date.parse(cloudEventTime);
}
/**
 * Construct InvocationEvent from invocation request.
 *
 * @param fnPayload -- function payload
 * @param headers -- request headers with lower-cased keys
 * @param cloudEvent -- parsed request input CloudEvent
 * @return an InvocationEvent
 */
function createEvent(cloudEvent, headers) {
    return new functions_1.InvocationEvent(cloudEvent.data, cloudEvent.datacontenttype, cloudEvent.schemaurl, cloudEvent.id, cloudEvent.source, timeMillis(cloudEvent.time), cloudEvent.type, headers);
}
/**
* Construct User object from the request context.
*
* @param userContext -- userContext object representing invoking org and user
* @return user
*/
function createUser(userContext) {
    return new functions_1.User(userContext.userId, userContext.username, userContext.onBehalfOfUserId);
}
/**
* Construct Secrets object with logger.
*
*
* @param logger -- logger to use in case of secret load errors
* @return secrets loader/cache
*/
function createSecrets(logger) {
    return new functions_1.Secrets(logger);
}
/**
 * Construct Org object from the request context.
 *
 * @param logger
 * @param reqContext
 * @param accessToken
 * @return org
 */
function createOrg(logger, reqContext, accessToken) {
    const userContext = reqContext.userContext;
    if (!userContext) {
        const message = `UserContext not provided: ${JSON.stringify(reqContext)}`;
        throw new Error(message);
    }
    const apiVersion = reqContext.apiVersion || process.env.FX_API_VERSION;
    if (!apiVersion) {
        const message = `API Version not provided: ${JSON.stringify(reqContext)}`;
        throw new Error(message);
    }
    const user = createUser(userContext);
    logger.info(`accessToken${accessToken ? ' ' : ' NOT '}provided.`);
    let unitOfWorkGraph;
    const config = new ConnectionConfig_1.ConnectionConfig(accessToken, apiVersion, userContext.salesforceBaseUrl);
    const unitOfWork = new unit_of_work_1.UnitOfWork(config, logger);
    if (apiVersion >= utils_1.APIVersion.V50) {
        unitOfWorkGraph = new unit_of_work_1.UnitOfWorkGraph(config, logger);
    }
    const dataApi = new DataApi_1.DataApi(config, logger);
    return new functions_1.Org(apiVersion, userContext.salesforceBaseUrl, userContext.orgDomainUrl, userContext.orgId, user, dataApi, unitOfWork, unitOfWorkGraph);
}
/**
* Construct Context from function payload.
*
* @param id                   -- request payload id
* @param logger               -- logger
* @param secrets              -- secrets convenience class
* @param reqContext           -- reqContext from the request, contains salesforce stuff (user reqContext, etc)
* @param accessToken          -- accessToken for function org access, if provided
* @param functionInvocationId -- FunctionInvocationRequest ID, if applicable
* @return context
*/
function createContext(id, logger, secrets, reqContext, accessToken) {
    const org = reqContext ? createOrg(logger, reqContext, accessToken) : undefined;
    const context = new functions_1.Context(id, logger, org, secrets);
    return context;
}
/**
 * Construct logger from request ID
 *
 * @param requestID -- optional request ID
 * @return Logger
 */
function createLogger(requestID) {
    const logger = new logger_1.Logger({
        name: 'Salesforce Function Logger',
        format: logger_1.LoggerFormat.LOGFMT,
        stream: process.stderr
    });
    const level = process.env.DEBUG ? logger_1.LoggerLevel.DEBUG : logger_1.LoggerLevel.INFO;
    logger.setLevel(level);
    if (requestID) {
        logger.addField('request_id', requestID);
    }
    return logger;
}
/**
 * Wraps a user function expecting serialized SDK objects into a raw
 * function that matches the expectations of the upstream invoker. Enriches
 * the function by providing serialized InvocationEvent, Context, and a Logger.
 *
 * @param fn -- A function written by the end user with an arity of 3 that
 *        expects to recieve serialized SDK objects as arguments
 *
 * @return enrichedFn -- A wrapped, enriched version of the SDK function
 *        provided that is enriched with SDK serialization. It expects a
 *        CloudEvent and Headers object, which are provided by the upstream
 *        invoker.
 */
exports.enrichFn = function (fn) {
    // The wrapped/enriched function
    return function (cloudEvent, headers) {
        // Validate the input request
        if (!(cloudEvent && headers)) {
            throw new Error('Request Data not provided');
        }
        // Initialize logger with request ID
        const logger = createLogger(cloudEvent.id);
        //use secret here in lieu of DEBUG runtime environment var until we have deployment time support of config var
        const secrets = createSecrets(logger);
        const debugSecret = secrets.getValue('sf-debug', 'DEBUG');
        logger.info(`DEBUG flag is ${debugSecret ? debugSecret : 'unset'}`);
        if (debugSecret || logger_1.LoggerLevel.DEBUG === logger.getLevel() || process.env.DEBUG) {
            //for dev preview, we log the ENTIRE raw request, may need to filter sensitive properties out later
            //the hard part of filtering is to know which property name to filter
            //change the logger level, so any subsequent user function's logger.debug would log as well
            logger.setLevel(logger_1.LoggerLevel.DEBUG);
            logger.debug(`headers=${JSON.stringify(headers)}`);
            logger.debug(cloudEvent);
        }
        const ceCtx = cloudEvent.sfcontext;
        const ceFnCtx = cloudEvent.sffncontext;
        if (!ceCtx) {
            logger.warn('Context not provided in data: context is partially initialized');
        }
        let accessToken;
        if (ceFnCtx) {
            accessToken = ceFnCtx.accessToken;
        }
        const invocationEvent = createEvent(cloudEvent, headers);
        const context = createContext(cloudEvent.id, logger, secrets, ceCtx, accessToken);
        return fn(invocationEvent, context, logger);
    };
};
//# sourceMappingURL=enrich.js.map