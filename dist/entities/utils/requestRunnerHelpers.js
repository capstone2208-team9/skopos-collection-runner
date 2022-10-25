var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { GraphQLClient, gql } from 'graphql-request';
import fetch from 'node-fetch';
const endpoint = 'http://localhost:3001/graphql';
const graphQLClient = new GraphQLClient(endpoint);
export function invokeFetchAPICall(request, collectionRunId) {
    return __awaiter(this, void 0, void 0, function* () {
        let { id: requestId, url, method, headers, body, assertions } = request;
        let config = { method, headers };
        if (method.toUpperCase() !== "GET") {
            config = Object.assign(Object.assign({}, config), { body });
        }
        const timestampStart = Date.now();
        let fetchResponse = yield fetch(url, config);
        const timeForRequest = Date.now() - timestampStart;
        let json = yield fetchResponse.json();
        const responseVariables = {
            data: {
                status: fetchResponse.status,
                headers: fetchResponse.headers,
                latency: timeForRequest,
                body: json,
                CollectionRun: {
                    connect: {
                        id: collectionRunId
                    }
                },
                request: {
                    connect: {
                        id: Number(requestId)
                    }
                }
            }
        };
        return responseVariables;
    });
}
export function invokeSaveResponse(responseData) {
    return __awaiter(this, void 0, void 0, function* () {
        const responseMutation = gql `
    mutation CreateOneResponse($data: ResponseCreateInput!) {
      createOneResponse(data: $data) {
        id
      }
    }`;
        const databaseResponse = yield graphQLClient.request(responseMutation, responseData);
        return databaseResponse.createOneResponse.id;
    });
}
//# sourceMappingURL=requestRunnerHelpers.js.map