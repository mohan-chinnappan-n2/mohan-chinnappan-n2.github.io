import { Logger } from '@salesforce/core';
import { ConnectionConfig, Error as ApiError } from '../..';
import { CompositeRequest } from './CompositeRequest';
import { CompositeSubrequest } from './CompositeSubrequest';
export declare class CompositeSubresponse {
    private static HEADER_LOCATION;
    private static KEY_ID;
    readonly httpHeaders: {
        [key: string]: string;
    };
    readonly httpStatusCode: number;
    readonly referenceId: string;
    private readonly _errors;
    private readonly _body;
    constructor(compositeSubresponse: CompositeSubresponse);
    get body(): {
        [key: string]: any;
    };
    get errors(): ReadonlyArray<ApiError>;
    get id(): string;
    get isSuccess(): boolean;
    get location(): string;
}
/**
 * Used to avoid string access to json object below.
 */
interface CompositeResponseJsonObject {
    compositeResponse: CompositeSubresponse[];
}
export declare class CompositeResponse {
    readonly compositeSubresponses: ReadonlyArray<CompositeSubresponse>;
    constructor(compositeResponseJsonObject: CompositeResponseJsonObject);
    getCompositeSubresponse(compositeSubrequest: CompositeSubrequest): CompositeSubresponse;
}
interface GraphResponseJson {
    graphId: string;
    isSuccessful: boolean;
    graphResponse: CompositeResponseJsonObject;
}
export declare class GraphResponse {
    readonly graphId: string;
    readonly isSuccessful: boolean;
    compositeResponse: CompositeResponse;
    constructor(graphResponseJson: GraphResponseJson);
}
export declare class CompositeGraphResponse {
    readonly graphResponses: ReadonlyArray<GraphResponse>;
    constructor(json: string);
}
export declare class CompositeApi {
    private readonly _connectionConfig;
    private readonly logger;
    constructor(_connectionConfig: ConnectionConfig, logger: Logger);
    invoke(compositeRequest: CompositeRequest): Promise<CompositeResponse>;
    invokeGraph(compositeRequests: CompositeRequest[]): Promise<CompositeGraphResponse>;
}
export {};
