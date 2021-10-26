"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlatformEvent = void 0;
const SObject_1 = require("./SObject");
/**
 * Represents a Platform Event.
 */
class PlatformEvent extends SObject_1.SObject {
    constructor(sObjectType) {
        if (!sObjectType) {
            throw new Error('Platform Event type is required.');
        }
        if (!sObjectType.endsWith('__e')) {
            sObjectType = `${sObjectType}__e`;
        }
        super(sObjectType);
    }
}
exports.PlatformEvent = PlatformEvent;
//# sourceMappingURL=PlatformEvent.js.map