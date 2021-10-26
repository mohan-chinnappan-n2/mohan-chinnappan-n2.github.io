"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompositeApi = exports.CompositeGraphResponse = exports.GraphResponse = exports.CompositeResponse = exports.CompositeSubresponse = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const Handlers_1 = require("typed-rest-client/Handlers");
const HttpClient_1 = require("typed-rest-client/HttpClient");
class CompositeSubresponse {
    constructor(compositeSubresponse) {
        this.httpHeaders = compositeSubresponse.httpHeaders;
        this.httpStatusCode = compositeSubresponse.httpStatusCode;
        this.referenceId = compositeSubresponse.referenceId;
        // The response body has different meaning depending if there was an error
        if (compositeSubresponse.httpStatusCode < HttpClient_1.HttpCodes.BadRequest) {
            this._body = compositeSubresponse.body;
        }
        else {
            const errors = [];
            if (compositeSubresponse.body && Array.isArray(compositeSubresponse.body)) {
                compositeSubresponse.body.forEach((element) => {
                    errors.push(element);
                });
            }
            this._errors = errors;
        }
    }
    get body() {
        if (this.httpStatusCode < HttpClient_1.HttpCodes.BadRequest) {
            return this._body;
        }
        else {
            return undefined;
        }
    }
    get errors() {
        if (this.httpStatusCode >= HttpClient_1.HttpCodes.BadRequest) {
            return this._errors;
        }
        else {
            throw new Error(`Errors is not valid when there hasn't been an error. Call #errors installed.`);
        }
    }
    get id() {
        if (this.body && this.body[CompositeSubresponse.KEY_ID]) {
            return this.body[CompositeSubresponse.KEY_ID];
        }
        else {
            return undefined;
        }
    }
    get isSuccess() {
        return this.httpStatusCode && this.httpStatusCode < HttpClient_1.HttpCodes.BadRequest;
    }
    get location() {
        if (this.httpHeaders && this.httpHeaders[CompositeSubresponse.HEADER_LOCATION]) {
            return this.httpHeaders[CompositeSubresponse.HEADER_LOCATION];
        }
        else {
            return undefined;
        }
    }
}
exports.CompositeSubresponse = CompositeSubresponse;
CompositeSubresponse.HEADER_LOCATION = 'Location';
CompositeSubresponse.KEY_ID = 'id';
class CompositeResponse {
    constructor(compositeResponseJsonObject) {
        const compositeSubResponses = compositeResponseJsonObject.compositeResponse;
        if (compositeSubResponses) {
            compositeSubResponses.forEach((element, index) => {
                // Replace the json object with one that contains the location method
                compositeSubResponses[index] = new CompositeSubresponse(element);
            });
        }
        this.compositeSubresponses = compositeSubResponses;
    }
    getCompositeSubresponse(compositeSubrequest) {
        const referenceId = compositeSubrequest.referenceId;
        for (const compositeSubResponse of this.compositeSubresponses) {
            if (compositeSubResponse.referenceId === referenceId) {
                return compositeSubResponse;
            }
        }
        throw new Error('Unknown referenceId: ' + referenceId);
    }
}
exports.CompositeResponse = CompositeResponse;
class GraphResponse {
    constructor(graphResponseJson) {
        this.graphId = graphResponseJson.graphId;
        this.isSuccessful = graphResponseJson.isSuccessful;
        const compResponseJson = graphResponseJson.graphResponse;
        this.compositeResponse = new CompositeResponse(compResponseJson);
    }
}
exports.GraphResponse = GraphResponse;
class CompositeGraphResponse {
    constructor(json) {
        const graphResponseJsonObject = JSON.parse(json);
        const graphResponsesJsonArray = graphResponseJsonObject.graphs;
        const graphResponsesArray = [];
        if (graphResponsesJsonArray) {
            graphResponsesJsonArray.forEach((graphElement) => {
                graphResponsesArray.push(new GraphResponse(graphElement));
            });
        }
        this.graphResponses = graphResponsesArray;
    }
}
exports.CompositeGraphResponse = CompositeGraphResponse;
class CompositeApi {
    constructor(_connectionConfig, logger) {
        this._connectionConfig = _connectionConfig;
        this.logger = logger;
    }
    async invoke(compositeRequest) {
        const bearerCredentialHandler = new Handlers_1.BearerCredentialHandler(this._connectionConfig.accessToken);
        const httpClient = new HttpClient_1.HttpClient('sf-fx-node', [bearerCredentialHandler]);
        const path = `/services/data/v${this._connectionConfig.apiVersion}/composite/`;
        const headers = { 'Content-Type': 'application/json' };
        //Do not stringify 'graphId' field, which is for graph api
        const data = JSON.stringify(compositeRequest, (key, value) => {
            if (key != 'graphId') {
                return value;
            }
        });
        this.logger.debug(`POST ${path} ${data}`);
        const response = await httpClient.post(this._connectionConfig.instanceUrl + path, data, headers);
        if (response.message.statusCode === HttpClient_1.HttpCodes.OK) {
            const body = await response.readBody();
            const compositeResponseJsonObject = JSON.parse(body);
            const compositeResponse = new CompositeResponse(compositeResponseJsonObject);
            return compositeResponse;
        }
        else {
            throw new Error(`Composite API error: ${response.message.statusMessage ? response.message.statusMessage : 'UNKNOWN'} (${response.message.statusCode})`);
        }
    }
    async invokeGraph(compositeRequests) {
        const bearerCredentialHandler = new Handlers_1.BearerCredentialHandler(this._connectionConfig.accessToken);
        const httpClient = new HttpClient_1.HttpClient('sf-fx-node', [bearerCredentialHandler]);
        const path = `/services/data/v${this._connectionConfig.apiVersion}/composite/graph/`;
        const headers = { 'Content-Type': 'application/json' };
        const graphObj = { graphs: compositeRequests };
        const data = JSON.stringify(graphObj);
        this.logger.debug(`POST ${path} ${data}`);
        const response = await httpClient.post(this._connectionConfig.instanceUrl + path, data, headers);
        if (response.message.statusCode === HttpClient_1.HttpCodes.OK) {
            const body = await response.readBody();
            const compositeGraphResponse = new CompositeGraphResponse(body);
            return compositeGraphResponse;
        }
        else {
            throw new Error(`Composite Graph API error: ${response.message.statusMessage ? response.message.statusMessage : 'UNKNOWN'} (${response.message.statusCode})`);
        }
    }
}
exports.CompositeApi = CompositeApi;
//# sourceMappingURL=CompositeApi.js.map