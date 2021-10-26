export declare class ConnectionConfig {
    readonly apiVersion: string;
    readonly instanceUrl: string;
    constructor(accessToken: string, apiVersion: string, instanceUrl: string);
    get accessToken(): string;
}
