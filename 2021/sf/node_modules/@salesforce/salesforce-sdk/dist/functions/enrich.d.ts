interface UserFn {
    (InvocationEvent: any, Context: any, Logger: any): JSON;
}
interface RawFn {
    (CloudEvent: any, Headers: any): JSON;
}
/**
 * Wraps a user function expecting serialized SDK objects into a raw
 * function that matches the expectations of the upstream invoker. Enriches
 * the function by providing serialized InvocationEvent, Context, and a Logger.
 *
 * @param fn -- A function written by the end user with an arity of 3 that
 *        expects to recieve serialized SDK objects as arguments
 *
 * @return enrichedFn -- A wrapped, enriched version of the SDK function
 *        provided that is enriched with SDK serialization. It expects a
 *        CloudEvent and Headers object, which are provided by the upstream
 *        invoker.
 */
export declare const enrichFn: (fn: UserFn) => RawFn;
export {};
