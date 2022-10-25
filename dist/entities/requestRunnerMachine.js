import { createMachine, assign } from 'xstate';
import { invokeFetchAPICall, invokeSaveResponse } from './utils/requestRunnerHelpers.js';
import { GraphQLClient } from 'graphql-request';
const endpoint = 'http://localhost:3001/graphql';
const graphQLClient = new GraphQLClient(endpoint);
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