import { createMachine, assign } from 'xstate';
import { requestRunnerMachine } from './requestRunnerMachine.js'
import { requestProcessorMachine } from './requestProcessorMachine.js'
import { assertionRunnerMachine } from './assertionRunnerMachine.js';
import { invokeQueryRequests, invokeCreateCollectionRun, listNotEmpty } from '../utils/collectionRunnerHelpers.js';

export const collectionRunnerMachine =
  createMachine({
    predictableActionArguments: true,
    tsTypes: {} as import('./collectionRunnerMachine.typegen.js').Typegen0,
    schema: {
      context: {} as {
        collectionId?: number
        collectionRunId?: number
        requestList?: object[]
        responses?: object[]
        currentResponse?: object
      },
      events: {} as { type: 'QUERY'; collectionId: number }
        | { type: 'done.invoke.query-requests'; data: { requests: object[] } }
        | { type: 'done.invoke.initialize-collection-run'; data: { id: number } }
        | { type: 'done.invoke.process-request'; data: { requests: object[] } }
        | { type: 'done.invoke.run-request'; data: object },
      services: {} as {
        queryRequests: {
          data: { requests: object[] }
        },
        createCollectionRun: {
          data: { id: number }
        },
      }
    },
    context: { collectionId: undefined, requestList: undefined, responses: [], currentResponse: undefined },
    id: 'collectionRunner',
    initial: 'idle',
    states: {
      idle: {
        on: {
          QUERY: {
            target: 'querying',
            actions: 'assignCollectionId'
          },
        },
      },
      querying: {
        invoke: {
          id: 'query-requests',
          src: 'queryRequests',
          onDone: {
            target: 'initializing',
            actions: 'assignRequestList'
          },
          onError: {
            target: 'failed'
          }
        },
      },
      initializing: {
        invoke: {
          id: 'initialize-collection-run',
          src: 'createCollectionRun',
          onDone: {
            target: 'running',
            actions: 'assignCollectionRunId'
          },
          onError: {
            target: 'failed'
          }
        }
      },
      running: {
        initial: 'processing',
        states: {
          processing: {
            invoke: {
              id: 'process-request',
              src: requestProcessorMachine,
              data: {
                request: (context, _event) => context.requestList[0],
                responses: (context, _event) => context.responses
              },
              onDone: {
                target: 'requesting',
                actions: 'assignProcessedRequestToList'
              },
              onError: {
                target: '#collectionRunner.failed'
              }
            },
          },
          requesting: {
            invoke: {
              id: 'run-request',
              src: requestRunnerMachine,
              data: {
                request: (context, _event) => context.requestList[0],
                collectionRunId: (context, _event) => context.collectionRunId
              },
              onDone: {
                target: '#collectionRunner.running.asserting',
                actions: [
                  'assignCurrentResponse',
                  'assignResponses',
                ]
              },
              onError: {
                target: '#collectionRunner.failed'
              }
            }
          },
          asserting: {
            invoke: {
              id: 'run-assertions',
              src: assertionRunnerMachine,
              data: {
                response: (context, _event) => context.currentResponse
              },
              onDone: [{
                target: '#collectionRunner.running.processing',
                cond: { type: 'listNotEmpty' },
                actions: [
                  'assignRemoveCompletedRequestFromList'
                ]
              },
              {
                target: '#collectionRunner.complete'
              }],
              onError: {
                target: '#collectionRunner.failed'
              }
            }
          }
        },
      },
      complete: {
        type: 'final',
      },
      failed: {
        type: 'final'
      }
    },
  },
    {
      actions: {
        // action implementation
        'assignCollectionId': assign({
          collectionId: (_context, event) => event.collectionId,
        }),
        'assignRequestList': assign({
          requestList: (_context, event) => event.data.requests
        }),
        'assignCollectionRunId': assign({
          collectionRunId: (_context, event) => event.data.id
        }),
        'assignProcessedRequestToList': assign({
          requestList: (context, event) => {
            context.requestList[0] = event.data
            return context.requestList
          }
        }),
        'assignResponses': assign({
          responses: (context, event) => context.responses.concat(event.data)
        }),
        'assignRemoveCompletedRequestFromList': assign({
          requestList: (context, _event) => context.requestList.slice(1)
        }),
        'assignCurrentResponse': assign({
          currentResponse: (_context, event) => event.data
        }),
      },
      delays: {
        // no delays here
      },
      guards: {
        listNotEmpty
      },
      services: {
        queryRequests: (context, _event) => invokeQueryRequests(context.collectionId),
        createCollectionRun: (context, _event) => invokeCreateCollectionRun(context.collectionId),
      }
    })