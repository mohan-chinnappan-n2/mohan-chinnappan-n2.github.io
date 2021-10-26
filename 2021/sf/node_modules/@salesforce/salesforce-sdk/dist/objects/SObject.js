"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SObject = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const uuid_1 = require("uuid");
/**
 * Represents a SObject instance.
 */
class SObject {
    constructor(sObjectType) {
        if (!sObjectType) {
            throw new Error('SObject type is required.');
        }
        this.referenceId = SObject.generateReferenceId(sObjectType);
        this.sObjectType = sObjectType;
        this.uuid = uuid_1.v4();
        this._values = {};
    }
    static generateReferenceId(type) {
        return `${type}_` + uuid_1.v4().replace(/-/g, '');
    }
    named(name) {
        this.setValue('Name', name);
        return this;
    }
    setValue(key, value) {
        this._values[key] = value;
    }
    withValue(key, value) {
        this._values[key] = value;
        return this;
    }
    withId(id) {
        this._id = id;
        return this;
    }
    get id() {
        return this._id;
    }
    get values() {
        return this._values;
    }
    get fkId() {
        if (this._id) {
            return this._id;
        }
        else {
            return `@{${this.referenceId}.id}`;
        }
    }
    asMap() {
        return Object.assign({}, { Id: this._id }, this.values);
    }
}
exports.SObject = SObject;
//# sourceMappingURL=SObject.js.map