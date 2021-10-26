"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PutCompositeSubrequestBuilder = exports.PatchCompositeSubrequestBuilder = exports.InsertCompositeSubrequestBuilder = exports.HttpGETCompositeSubrequestBuilder = exports.DescribeCompositeSubrequestBuilder = exports.DeleteCompositeSubrequestBuilder = exports.CompositeSubrequestBuilder = exports.CompositeSubrequest = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const _ = require("lodash");
const __1 = require("../..");
class CompositeSubrequest {
    constructor(builder) {
        this.httpHeaders = builder.httpHeaders;
        this.method = builder.method;
        this.body = builder.values;
        this.apiVersion = builder.getApiVersion();
        this.referenceId = builder.getReferenceId();
        this.sObjectType = builder.getSObjectType();
        this.url = builder.getUrl();
    }
    toJSON() {
        const result = _.omit(this, ['sObjectType', 'apiVersion']);
        return result;
    }
}
exports.CompositeSubrequest = CompositeSubrequest;
class CompositeSubrequestBuilder {
    constructor(_apiVersion, method, values = {}) {
        this._apiVersion = _apiVersion;
        this.method = method;
        this.values = values;
        this.httpHeaders = {};
    }
    getApiVersion() {
        return this._apiVersion;
    }
    getId() {
        return this._id;
    }
    getReferenceId() {
        return this._referenceId;
    }
    getSObjectType() {
        return this._sObjectType;
    }
    getUrl() {
        return this._url;
    }
    id(id) {
        this._id = id;
        return this;
    }
    sObjectType(sObjectType) {
        this._sObjectType = sObjectType;
        return this;
    }
    sObject(sObject) {
        this.sObjectType(sObject.sObjectType);
        this.id(sObject.id);
        this.addValues(sObject.values);
        return this;
    }
    addValue(key, value) {
        this.values[key] = value;
        return this;
    }
    addValues(values) {
        Object.keys(values).forEach(key => {
            this.addValue(key, values[key]);
        });
        return this;
    }
    named(name) {
        this.addValue('Name', name);
        return this;
    }
    apiVersion(apiVersion) {
        this._apiVersion = apiVersion;
        return this;
    }
    header(key, value) {
        this.httpHeaders[key] = value;
        return this;
    }
    headers(headers) {
        Object.keys(headers).forEach(key => {
            this.header(key, headers[key]);
        });
        return this;
    }
    build() {
        if (!this._sObjectType) {
            throw new Error('Type is required');
        }
        // TODO: What is the preferred way to check for null
        if (!this._referenceId) {
            this._referenceId = __1.SObject.generateReferenceId(this._sObjectType);
        }
        this._url = this._internalGetUrl();
        return new CompositeSubrequest(this);
    }
    _getBaseUrl() {
        return `/services/data/v${this._apiVersion}/sobjects/${this._sObjectType}`;
    }
    _getExistingUrl() {
        let url = this._getBaseUrl() + '/';
        if (this._id) {
            url += this._id;
        }
        else if (this._rootReferenceId) {
            url += '@{' + this._rootReferenceId + '.id}';
        }
        else {
            url += '@{' + this._referenceId + '.id}';
        }
        return url;
    }
}
exports.CompositeSubrequestBuilder = CompositeSubrequestBuilder;
class NoBodyCompositeSubrequestBuilder extends CompositeSubrequestBuilder {
    constructor(apiVersion, method) {
        super(apiVersion, method, undefined /*This request can't accept any values*/);
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    addValue(key, value) {
        throw new Error(`This request doesn't have a body`);
    }
    addValues(values) {
        if (Object.keys(values).length > 0) {
            throw new Error(`This request doesn't have a body`);
        }
        return this;
    }
}
class DeleteCompositeSubrequestBuilder extends NoBodyCompositeSubrequestBuilder {
    constructor(apiVersion) {
        super(apiVersion, __1.Method.DELETE);
    }
    _internalGetUrl() {
        return this._getExistingUrl();
    }
}
exports.DeleteCompositeSubrequestBuilder = DeleteCompositeSubrequestBuilder;
class DescribeCompositeSubrequestBuilder extends NoBodyCompositeSubrequestBuilder {
    constructor(apiVersion) {
        super(apiVersion, __1.Method.GET);
    }
    sObject(sObject) {
        this._referenceId = sObject.referenceId;
        super.sObject(sObject);
        return this;
    }
    _internalGetUrl() {
        return `${this._getBaseUrl()}/describe`;
    }
}
exports.DescribeCompositeSubrequestBuilder = DescribeCompositeSubrequestBuilder;
class HttpGETCompositeSubrequestBuilder extends NoBodyCompositeSubrequestBuilder {
    constructor(apiVersion) {
        super(apiVersion, __1.Method.GET);
    }
    _internalGetUrl() {
        return this._getExistingUrl();
    }
}
exports.HttpGETCompositeSubrequestBuilder = HttpGETCompositeSubrequestBuilder;
class InsertCompositeSubrequestBuilder extends CompositeSubrequestBuilder {
    constructor(apiVersion) {
        super(apiVersion, __1.Method.POST);
    }
    id(id) {
        if (id) {
            throw new Error(`This request doesn't support an id`);
        }
        return this;
    }
    sObject(sObject) {
        this._referenceId = sObject.referenceId;
        super.sObject(sObject);
        return this;
    }
    _internalGetUrl() {
        return this._getBaseUrl();
    }
}
exports.InsertCompositeSubrequestBuilder = InsertCompositeSubrequestBuilder;
class PatchCompositeSubrequestBuilder extends CompositeSubrequestBuilder {
    constructor(apiVersion) {
        super(apiVersion, __1.Method.PATCH);
    }
    sObject(sObject) {
        this._rootReferenceId = sObject.referenceId;
        super.sObject(sObject);
        return this;
    }
    _internalGetUrl() {
        return this._getExistingUrl();
    }
}
exports.PatchCompositeSubrequestBuilder = PatchCompositeSubrequestBuilder;
class PutCompositeSubrequestBuilder extends CompositeSubrequestBuilder {
    constructor(apiVersion) {
        super(apiVersion, __1.Method.PUT);
    }
    sObject(sObject) {
        this._rootReferenceId = sObject.referenceId;
        super.sObject(sObject);
        return this;
    }
    _internalGetUrl() {
        return this._getExistingUrl();
    }
}
exports.PutCompositeSubrequestBuilder = PutCompositeSubrequestBuilder;
//# sourceMappingURL=CompositeSubrequest.js.map