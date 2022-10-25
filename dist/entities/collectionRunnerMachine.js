import { createMachine, assign } from 'xstate';
import { requestRunnerMachine } from './requestRunnerMachine.js';
import { requestProcessorMachine } from './requestProcessorMachine.js';
import { invokeQueryRequests, invokeCreateCollectionRun, listNotEmpty } from './utils/collectionRunnerHelpers.js';
export const collectionRunnerMachine = createMachine({
    tsTypes: {},
    schema: {
        context: {},
        events: {}
    },
    context: { collectionId: undefined, requestList: undefined, responses: [] },
    id: "collectionRunner",
    initial: "idle",
    states: {
        idle: {
            on: {
                QUERY: {
                    target: "querying",
                    actions: 'assignCollectionId'
                },
            },
        },
        querying: {
            invoke: {
                src: 'queryRequests',
                id: "query-requests",
                onDone: {
                    target: "initializing",
                    actions: 'assignRequestList'
                },
                onError: {}
            },
        },
        initializing: {
            invoke: {
                src: 'createCollectionRun',
                id: "initialize-collection-run",
                onDone: {
                    target: "running",
                    actions: 'assignCollectionRunId'
                }
            }
        },
        running: {
            initial: "processing",
            states: {
                processing: {
                    invoke: {
                        id: 'process-request',
                        src: requestProcessorMachine,
                        data: {
                            request: (context, event) => context.requestList[0],
                            responses: (context, event) => context.responses
                        },
                        onDone: {
                            target: "requesting",
                            actions: 'assignProcessedRequestToList'
                        }
                    },
                },
                requesting: {
                    invoke: {
                        id: 'run-request',
                        src: requestRunnerMachine,
                        data: {
                            request: (context, event) => context.requestList[0],
                            collectionRunId: (context, event) => context.collectionRunId
                        },
                        onDone: [{
                                target: "#collectionRunner.running.processing",
                                cond: { type: 'listNotEmpty' },
                                actions: [
                                    'assignResponses',
                                    'assignRemoveCompletedRequestFromList'
                                ]
                            },
                            {
                                target: "#collectionRunner.complete",
                                actions: 'assignResponses',
                            }]
                    }
                },
            },
        },
        complete: {
            type: "final",
        },
    },
}, {
    actions: {
        // action implementation
        'assignCollectionId': assign({
            collectionId: (context, event) => event.collectionId,
        }),
        'assignRequestList': assign({
            requestList: (context, event) => event.data.requests
        }),
        'assignCollectionRunId': assign({
            collectionRunId: (context, event) => event.data.id
        }),
        'assignProcessedRequestToList': assign({
            requestList: (context, event) => {
                context.requestList[0] = event.data;
                return context.requestList;
            }
        }),
        'assignResponses': assign({
            responses: (context, event) => context.responses.concat(event.data.data)
        }),
        'assignRemoveCompletedRequestFromList': assign({
            requestList: (context, event) => context.requestList.slice(1)
        })
    },
    delays: {
    // no delays here
    },
    guards: {
        listNotEmpty
    },
    services: {
        queryRequests: (context, event) => invokeQueryRequests(context.collectionId),
        createCollectionRun: (context, event) => invokeCreateCollectionRun(context.collectionId)
    }
});
//# sourceMappingURL=collectionRunnerMachine.js.map