export interface Values {
    [key: string]: any;
}
/**
 * Represents a SObject instance.
 */
export declare class SObject {
    static generateReferenceId(type: string): string;
    readonly referenceId: string;
    readonly sObjectType: string;
    readonly uuid: string;
    private _id;
    private _values;
    constructor(sObjectType: string);
    named(name: string): SObject;
    setValue(key: string, value: any): void;
    withValue(key: string, value: any): SObject;
    withId(id: string): SObject;
    get id(): string;
    get values(): Values;
    get fkId(): string;
    asMap(): object;
}
