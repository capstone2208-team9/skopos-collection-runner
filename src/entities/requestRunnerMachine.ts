import { createMachine, assign } from 'xstate';
import { escalate, log } from 'xstate/lib/actions.js';
import { invokeFetchAPICall, invokeSaveResponse } from '../utils/requestRunnerHelpers.js'

export const requestRunnerMachine = createMachine({
  predictableActionArguments: true,
  tsTypes: {} as import('./requestRunnerMachine.typegen.js').Typegen0,
  schema: {
    context: {} as {
      request?: object
      collectionRunId?: number
      responseData?: object
    },
    events: {} as
      | { type: 'done.invoke.fetch-api-call'; data: object }
      | { type: 'done.invoke.save-response'; data: object },
    services: {} as {
      fetchAPICall: {
        data: object
      },
      saveResponse: {
        data: number
      }
    }
  },
  initial: 'fetching',
  context: {
    request: undefined,
    responseData: undefined,
    collectionRunId: undefined
  },
  states: {
    fetching: {
      invoke: {
        id: 'fetch-api-call',
        src: 'fetchAPICall',
        onDone: {
          target: 'loaded',
          actions: 'assignResponseData'
        },
        onError: {
          target: 'failedFetch',
          actions: log((context, event) => `Error: ${JSON.stringify(event.data, undefined, 2)}`)
        }
      }
    },
    loaded: {
      invoke: {
        id: 'save-response',
        src: 'saveResponse',
        onDone: {
          target: 'done',
          actions: 'assignResponseData'
        },
        onError: {
          target: 'failedSave',
          actions: log((context, event) => `Error: ${JSON.stringify(event.data, undefined, 2)}`)
        }
      }
    },
    done: {
      type: 'final',
      data: (context, event) => context.responseData
    },
    failedFetch: {
      type: "final",
      entry: escalate({ message: 'An error occurred fetching response for an API call' })
    },
    failedSave: {
      type: "final",
      entry: escalate({ message: 'An error occurred saving a response to the database' })
    }
  }
},
  {
    actions: {
      // action implementation
      'assignResponseData': assign({
        responseData: (_, event) => event.data
      }),
    },
    delays: {
      // no delays here
    },
    guards: {
      // no guards here
    },
    services: {
      fetchAPICall: (context, event) => invokeFetchAPICall(context.request, context.collectionRunId),
      saveResponse: (context, event) => invokeSaveResponse(context.responseData)
    }
  })