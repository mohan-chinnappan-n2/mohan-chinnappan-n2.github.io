import { Logger } from '@salesforce/core';
import { ConnectionConfig } from './../..';
import { CompositeGraphResponse } from './CompositeApi';
import { UnitOfWork } from './UnitOfWork';
/**
 * UnitOfWorkGraph provides enhancement to UnitOfWork that it allows multiple UnitOfWorks to execute in a single call
 * where each UnitOfWork is transactional
 *
 * UnitOfWorkGraph requires apiVersion 50.0 (Winter '21) or above
 */
export declare class UnitOfWorkGraph {
    private readonly _config;
    private logger;
    private _graphs;
    constructor(_config: ConnectionConfig, logger: Logger, _unitOfWork?: UnitOfWork);
    addGraph(unitOfWork: UnitOfWork): UnitOfWorkGraph;
    newUnitOfWork(): UnitOfWork;
    getCount(): number;
    commit(): Promise<CompositeGraphResponse>;
}
