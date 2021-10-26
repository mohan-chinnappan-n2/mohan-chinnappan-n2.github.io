import { Method, SObject } from '../..';
export declare class CompositeSubrequest {
    readonly httpHeaders: {
        [key: string]: string;
    };
    readonly method: Method;
    readonly referenceId: string;
    readonly url: string;
    readonly body: {
        [key: string]: any;
    };
    readonly sObjectType: string;
    readonly apiVersion: string;
    constructor(builder: CompositeSubrequestBuilder);
    toJSON(): object;
}
export declare abstract class CompositeSubrequestBuilder {
    private _apiVersion;
    readonly method: Method;
    readonly values: {
        [key: string]: any;
    };
    readonly httpHeaders: {
        [key: string]: string;
    };
    protected _referenceId: string;
    protected _rootReferenceId: string;
    private _id;
    private _sObjectType;
    private _url;
    protected constructor(_apiVersion: string, method: Method, values?: {
        [key: string]: any;
    });
    getApiVersion(): string;
    getId(): string;
    getReferenceId(): string;
    getSObjectType(): string;
    getUrl(): string;
    id(id: string): CompositeSubrequestBuilder;
    sObjectType(sObjectType: string): CompositeSubrequestBuilder;
    sObject(sObject: SObject): CompositeSubrequestBuilder;
    addValue(key: string, value: any): CompositeSubrequestBuilder;
    addValues(values: {
        [key: string]: any;
    }): CompositeSubrequestBuilder;
    named(name: string): CompositeSubrequestBuilder;
    apiVersion(apiVersion: string): CompositeSubrequestBuilder;
    header(key: string, value: string): CompositeSubrequestBuilder;
    headers(headers: {
        [key: string]: string;
    }): CompositeSubrequestBuilder;
    build(): CompositeSubrequest;
    protected _getBaseUrl(): string;
    protected _getExistingUrl(): string;
    protected abstract _internalGetUrl(): string;
}
declare abstract class NoBodyCompositeSubrequestBuilder extends CompositeSubrequestBuilder {
    constructor(apiVersion: string, method: Method);
    addValue(key: string, value: any): CompositeSubrequestBuilder;
    addValues(values: {
        [key: string]: any;
    }): CompositeSubrequestBuilder;
}
export declare class DeleteCompositeSubrequestBuilder extends NoBodyCompositeSubrequestBuilder {
    constructor(apiVersion: string);
    protected _internalGetUrl(): string;
}
export declare class DescribeCompositeSubrequestBuilder extends NoBodyCompositeSubrequestBuilder {
    constructor(apiVersion: string);
    sObject(sObject: SObject): CompositeSubrequestBuilder;
    protected _internalGetUrl(): string;
}
export declare class HttpGETCompositeSubrequestBuilder extends NoBodyCompositeSubrequestBuilder {
    constructor(apiVersion: string);
    protected _internalGetUrl(): string;
}
export declare class InsertCompositeSubrequestBuilder extends CompositeSubrequestBuilder {
    constructor(apiVersion: string);
    id(id: string): CompositeSubrequestBuilder;
    sObject(sObject: SObject): CompositeSubrequestBuilder;
    protected _internalGetUrl(): string;
}
export declare class PatchCompositeSubrequestBuilder extends CompositeSubrequestBuilder {
    constructor(apiVersion: string);
    sObject(sObject: SObject): CompositeSubrequestBuilder;
    protected _internalGetUrl(): string;
}
export declare class PutCompositeSubrequestBuilder extends CompositeSubrequestBuilder {
    constructor(apiVersion: string);
    sObject(sObject: SObject): CompositeSubrequestBuilder;
    protected _internalGetUrl(): string;
}
export {};
