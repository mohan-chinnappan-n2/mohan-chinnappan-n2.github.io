import { Logger } from '@salesforce/core';
/**
 * Convenience class to access/cache Evergreen secrets.
 */
export declare class Secrets {
    private logger;
    private basePath;
    /** default path prefix for secrets */
    static readonly DEFAULT_BASE_PATH = "/platform/services";
    /** path suffix to load a secrets file  */
    static readonly SUFFIX_PATH = "secret";
    private cache;
    /**
     * Construct with logger and optional base path.
     * @param logger logger to use if unable to load/decode secret.
     * @param basePath
     */
    constructor(logger: Logger, basePath?: string);
    /**
     * Get a secret object.
     *
     * @param secretName name of the secret to load.
     * @returns secret key/value object if successful, undefined on failure or missing.
     */
    get(secretName: string): ReadonlyMap<string, string> | undefined;
    /**
     * Get a secret value.
     *
     * @param secretName name of the secret to load.
     * @param keyName key within the secret
     * @returns secret value if successfully looked up, undefined if secret or key does not exist
     */
    getValue(secretName: string, keyName: string): string | undefined;
    private loadCacheEntry;
}
