import { CompositeSubrequest } from './CompositeSubrequest';
export declare class CompositeRequest {
    private graphId;
    private allOrNone;
    private compositeRequest;
    constructor();
    setAllOrNone(allOrNone: boolean): void;
    get isAllOrNone(): boolean;
    getGraphId(): string;
    addSubrequest(compositeSubrequest: CompositeSubrequest): void;
    get subrequests(): ReadonlyArray<CompositeSubrequest>;
    getSubrequest(referenceId: string): CompositeSubrequest;
}
