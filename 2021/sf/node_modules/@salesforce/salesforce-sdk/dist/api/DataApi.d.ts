import { Query, QueryResult, RecordResult } from 'jsforce';
import { Logger } from '@salesforce/core';
import { ConnectionConfig, PlatformEvent, SObject } from './..';
export { Query, QueryResult, Connection, RecordResult, SuccessResult, ErrorResult } from 'jsforce';
export declare class DataApi {
    private connConfig;
    private logger;
    private conn;
    constructor(connConfig: ConnectionConfig, logger: Logger);
    /**
     * Execute the given SOQL by using "/query" API.
     * See [jsforce types](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/jsforce) for details on Query and QueryResult
     *
     * @param soql - SOQL to be executed.
     * @return Query<QueryResult<T>>
     */
    query<T extends SObject = SObject>(soql: string): Query<QueryResult<T>>;
    /**
     * Query further records using nextRecordsURL.
     * See [jsforce types](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/jsforce) for details on QueryResult
     *
     * @param locator - query locator.
     * @return Promise<QueryResult<T>>
     */
    queryMore<T extends SObject = SObject>(locator: string): Promise<QueryResult<T>>;
    /**
     * Insert an SObject.
     * See [jsforce types](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/jsforce) for details on RecordResult
     *
     * @param sobject - sobject to insert
     * @returns Promise<(RecordResult)>
     */
    insert(sobject: SObject): Promise<RecordResult>;
    /**
     * Update an SObject.
     * See [jsforce types](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/jsforce) for details on RecordResult
     *
     * @param sobject - sobject to update
     * @returns Promise<RecordResult>
     */
    update(sobject: SObject): Promise<RecordResult>;
    /**
     * Publish Platform Event.
     * See [jsforce types](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/jsforce) for details on RecordResult
     *
     * @param event - Platform Event to insert
     * @returns Promise<(RecordResult)>
     */
    publishPlatformEvent(event: PlatformEvent): Promise<RecordResult>;
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
    request(method: string, url: string, body: string, headers?: object): Promise<object>;
    private connect;
}
