import { Logger } from '@salesforce/core';
import { DataApi, Secrets, UnitOfWork, UnitOfWorkGraph } from '..';
/**
 * Represents http headers that are part of the function invocation
 */
export declare type Headers = Map<string, ReadonlyArray<string>>;
/**
 * Represents a function invocation event.
 */
export declare class InvocationEvent {
    readonly data: any;
    readonly dataContentType: string;
    readonly dataSchema: string;
    readonly id: string;
    readonly source: string;
    readonly time: number;
    readonly type: string;
    readonly headers?: Headers;
    constructor(data: any, dataContentType: string, dataSchema: string, id: string, source: string, time: number, type: string, headers?: Headers);
}
/**
 * Represents invoking user.
 */
export declare class User {
    readonly id: string;
    readonly username: string;
    readonly onBehalfOfUserId?: string;
    constructor(id: string, username: string, onBehalfOfUserId?: string);
}
/**
 * Represents invoking org and user.
 *
 * For convenience and if the request provides org access, API instances
 * are initialized and set on this object.
 */
export declare class Org {
    readonly apiVersion: string;
    readonly baseUrl: string;
    readonly domainUrl: string;
    readonly id: string;
    readonly user: User;
    readonly data?: DataApi;
    readonly unitOfWork?: UnitOfWork;
    readonly unitOfWorkGraph?: UnitOfWorkGraph;
    constructor(apiVersion: string, baseUrl: string, domainUrl: string, id: string, user: User, data?: DataApi, unitOfWork?: UnitOfWork, unitOfWorkGraph?: UnitOfWorkGraph);
    /**
     * @see [[DataApi]]
     */
    request(method: string, url: string, body: string, headers?: object): Promise<object>;
}
/**
 * Respresents the context of the function invocation.
 *
 * If the request originates from an org, the org object repesents
 * the invoking org and user.
 */
export declare class Context {
    readonly id: string;
    readonly logger: Logger;
    readonly org?: Org;
    readonly secrets?: Secrets;
    constructor(id: string, logger: Logger, org?: Org, secrets?: Secrets);
}
export * from './Secrets';
export * from './enrich';
