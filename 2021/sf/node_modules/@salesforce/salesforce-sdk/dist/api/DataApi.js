"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataApi = void 0;
const jsforce_1 = require("jsforce");
var jsforce_2 = require("jsforce");
Object.defineProperty(exports, "Query", { enumerable: true, get: function () { return jsforce_2.Query; } });
Object.defineProperty(exports, "Connection", { enumerable: true, get: function () { return jsforce_2.Connection; } });
class DataApi {
    constructor(connConfig, logger) {
        this.connConfig = connConfig;
        this.logger = logger;
    }
    /**
     * Execute the given SOQL by using "/query" API.
     * See [jsforce types](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/jsforce) for details on Query and QueryResult
     *
     * @param soql - SOQL to be executed.
     * @return Query<QueryResult<T>>
     */
    query(soql) {
        return this.connect().query(soql);
    }
    /**
     * Query further records using nextRecordsURL.
     * See [jsforce types](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/jsforce) for details on QueryResult
     *
     * @param locator - query locator.
     * @return Promise<QueryResult<T>>
     */
    queryMore(locator) {
        return this.connect().query(locator);
    }
    /**
     * Insert an SObject.
     * See [jsforce types](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/jsforce) for details on RecordResult
     *
     * @param sobject - sobject to insert
     * @returns Promise<(RecordResult)>
     */
    insert(sobject) {
        return this.connect()
            .sobject(sobject.sObjectType)
            .insert(sobject.asMap());
    }
    /**
     * Update an SObject.
     * See [jsforce types](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/jsforce) for details on RecordResult
     *
     * @param sobject - sobject to update
     * @returns Promise<RecordResult>
     */
    update(sobject) {
        return this.connect()
            .sobject(sobject.sObjectType)
            .update(sobject.asMap());
    }
    /**
     * Publish Platform Event.
     * See [jsforce types](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/jsforce) for details on RecordResult
     *
     * @param event - Platform Event to insert
     * @returns Promise<(RecordResult)>
     */
    publishPlatformEvent(event) {
        return this.insert(event);
    }
    /**
     * Invoke given endpoint.
     *
     * Endpoint can be:
     *   - absolute URL,
     *   - relative path from root ('/services/data/v32.0/sobjects/Account/describe'), or
     *   - relative path from version root ('/sobjects/Account/describe').
     *
     * @param method
     * @param url
     * @param body
     * @param headers
     */
    request(method, url, body, headers) {
        return this.connect()
            .request({
            body,
            headers,
            method,
            url,
        });
    }
    connect() {
        if (!this.conn) {
            this.conn = new jsforce_1.Connection({
                accessToken: this.connConfig.accessToken,
                instanceUrl: this.connConfig.instanceUrl,
                version: this.connConfig.apiVersion,
            });
            this.logger.trace('connected to instanceUrl=%s version=%s', this.connConfig.instanceUrl, this.connConfig.apiVersion);
        }
        return this.conn;
    }
}
exports.DataApi = DataApi;
//# sourceMappingURL=DataApi.js.map