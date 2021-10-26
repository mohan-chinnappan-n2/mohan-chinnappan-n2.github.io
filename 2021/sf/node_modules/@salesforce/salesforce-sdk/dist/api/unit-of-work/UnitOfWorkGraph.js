"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnitOfWorkGraph = void 0;
const __1 = require("./../..");
const CompositeApi_1 = require("./CompositeApi");
const UnitOfWork_1 = require("./UnitOfWork");
/**
 * UnitOfWorkGraph provides enhancement to UnitOfWork that it allows multiple UnitOfWorks to execute in a single call
 * where each UnitOfWork is transactional
 *
 * UnitOfWorkGraph requires apiVersion 50.0 (Winter '21) or above
 */
class UnitOfWorkGraph {
    constructor(_config, logger, _unitOfWork) {
        this._config = _config;
        this.logger = logger;
        if (_config.apiVersion < __1.APIVersion.V50) {
            throw new Error(`UnitOfWorkGraph requires apiVersion v${__1.APIVersion.V50} or above`);
        }
        this._graphs = [];
        if (_unitOfWork) {
            this.addGraph(_unitOfWork);
        }
    }
    addGraph(unitOfWork) {
        this._graphs.push(unitOfWork);
        return this;
    }
    newUnitOfWork() {
        const uow = new UnitOfWork_1.UnitOfWork(this._config, this.logger);
        return uow;
    }
    getCount() {
        return this._graphs.length;
    }
    async commit() {
        const compositeApi = new CompositeApi_1.CompositeApi(this._config, this.logger);
        //get array of compositeRequest from the array of unitOfWorks
        const compositeRequests = [];
        for (const uow of this._graphs) {
            compositeRequests.push(uow.compositeRequest);
        }
        const compositeGraphResponse = await compositeApi.invokeGraph(compositeRequests);
        return compositeGraphResponse;
    }
}
exports.UnitOfWorkGraph = UnitOfWorkGraph;
//# sourceMappingURL=UnitOfWorkGraph.js.map