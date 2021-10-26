"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompositeRequest = void 0;
const uuid_1 = require("uuid");
class CompositeRequest {
    constructor() {
        this.allOrNone = true;
        this.graphId = uuid_1.v4();
        this.compositeRequest = [];
    }
    setAllOrNone(allOrNone) {
        this.allOrNone = allOrNone;
    }
    get isAllOrNone() {
        return this.allOrNone;
    }
    getGraphId() {
        return this.graphId;
    }
    addSubrequest(compositeSubrequest) {
        this.compositeRequest.push(compositeSubrequest);
    }
    get subrequests() {
        const ro = this.compositeRequest;
        return ro;
    }
    getSubrequest(referenceId) {
        for (const compositeSubrequest of this.compositeRequest) {
            if (compositeSubrequest.referenceId === referenceId) {
                return compositeSubrequest;
            }
        }
        throw new Error('Unknown referenceId: ' + referenceId);
    }
}
exports.CompositeRequest = CompositeRequest;
//# sourceMappingURL=CompositeRequest.js.map