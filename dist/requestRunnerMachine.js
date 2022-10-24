var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { createMachine, assign } from 'xstate';
import fetch from 'node-fetch';
import { GraphQLClient, gql } from 'graphql-request';
const endpoint = 'http://localhost:3001/graphql';
const graphQLClient = new GraphQLClient(endpoint);
function invokeFetchAPICall(request, collectionRunId) {
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
function invokeSaveResponse(responseData) {
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
export const requestRunnerMachine = createMachine({
    initial: "fetching",
    context: {
        request: undefined,
        responseData: undefined,
        collectionRunId: undefined
    },
    states: {
        fetching: {
            invoke: {
                id: "fetch-api-call",
                src: (context, event) => invokeFetchAPICall(context.request, context.collectionRunId),
                onDone: {
                    target: "loaded",
                    actions: assign({
                        responseData: (_, event) => event.data
                    })
                }
            }
        },
        loaded: {
            invoke: {
                id: "save-response",
                src: (context, event) => invokeSaveResponse(context.responseData),
                onDone: {
                    target: "done",
                }
            }
        },
        done: {
            type: "final",
            data: (context, event) => context.responseData
        },
        failed: {}
    }
});
//# sourceMappingURL=requestRunnerMachine.js.map