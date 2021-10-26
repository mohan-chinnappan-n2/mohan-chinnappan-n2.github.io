"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Secrets = void 0;
const fs = require("fs");
const path = require("path");
/**
 * Cache entry for a secret Map
 */
class CacheEntry {
    constructor(secretName, lastChecked, lastModified, values) {
        this.secretName = secretName;
        this.lastChecked = lastChecked;
        this.lastModified = lastModified;
        this.values = values;
    }
    getSecretName() {
        return this.secretName;
    }
    getValues() {
        return this.values;
    }
    getLastModified() {
        return this.lastModified;
    }
    getLastChecked() {
        return this.lastChecked;
    }
    static readDirEntries(logger, dirPath, dirEntries) {
        // only descend a single directory level, *not* recursive
        const ret = new Map();
        for (const key of dirEntries) {
            // Ignore dotfiles or dotdirs in secret dir
            if (!key.startsWith('.')) {
                const fullPath = path.join(dirPath, key);
                try {
                    // Only load secrets from readable *files*, ignore directories
                    const pathStat = fs.statSync(fullPath);
                    if (pathStat.isFile()) {
                        const buf = fs.readFileSync(fullPath);
                        // make the map result available to both index ([]) and Map.get
                        ret[key] = buf.toString();
                        ret.set(key, ret[key]);
                    }
                }
                catch (reason) {
                    // Silently ignore unreadable files
                    logger.debug(`Failed path=${fullPath} file load: ${reason}`);
                }
            }
        }
        return ret;
    }
    static load(logger, secretName, dirPath) {
        const now = Date.now();
        try {
            // only load secrets from a parent `secret` dir that exists, is a directory, and
            // has not changed since the last time we loaded secrets from that dir.
            const dirStat = fs.statSync(dirPath);
            if (dirStat.isDirectory()) {
                const ents = CacheEntry.readDirEntries(logger, dirPath, fs.readdirSync(dirPath));
                return new CacheEntry(secretName, now, dirStat.mtimeMs, ents);
            }
        }
        catch (reason) {
            // hide dir stat/listing error from caller, just log and return back w/undefined values
            logger.debug(`Failed secret ${secretName} dir listing: ${reason}`);
        }
        return new CacheEntry(secretName, now, undefined, undefined);
    }
}
/**
 * Convenience class to access/cache Evergreen secrets.
 */
class Secrets {
    /**
     * Construct with logger and optional base path.
     * @param logger logger to use if unable to load/decode secret.
     * @param basePath
     */
    constructor(logger, basePath = Secrets.DEFAULT_BASE_PATH) {
        this.logger = logger;
        this.basePath = basePath;
        // A "secret" has a toplevel name and consists of one or more key/value pairs
        this.cache = new Map();
    }
    /**
     * Get a secret object.
     *
     * @param secretName name of the secret to load.
     * @returns secret key/value object if successful, undefined on failure or missing.
     */
    get(secretName) {
        let ent = this.cache[secretName];
        if (!ent) {
            ent = this.loadCacheEntry(secretName);
        }
        return ent.getValues();
    }
    /**
     * Get a secret value.
     *
     * @param secretName name of the secret to load.
     * @param keyName key within the secret
     * @returns secret value if successfully looked up, undefined if secret or key does not exist
     */
    getValue(secretName, keyName) {
        const secret = this.get(secretName);
        if (secret && secret.has(keyName)) {
            return secret.get(keyName);
        }
        return undefined;
    }
    loadCacheEntry(secretName) {
        const secDirPath = path.join(this.basePath, secretName, Secrets.SUFFIX_PATH);
        const ent = CacheEntry.load(this.logger, secretName, secDirPath);
        this.cache[secretName] = ent;
        return ent;
    }
}
exports.Secrets = Secrets;
/** default path prefix for secrets */
Secrets.DEFAULT_BASE_PATH = '/platform/services';
/** path suffix to load a secrets file  */
Secrets.SUFFIX_PATH = 'secret';
//# sourceMappingURL=Secrets.js.map