import { createMachine, assign } from 'xstate';
import { escalate } from 'xstate/lib/actions';
import { log } from 'xstate/lib/actions';
import { invokeParseRequest, invokeSearchReferencedValues, invokeInterpolateVariables } from '../utils/requestProcessorHelpers';

export const requestProcessorMachine = createMachine({
  predictableActionArguments: true,
  tsTypes: {} as import("./requestProcessorMachine.typegen").Typegen0,
  schema: {
    context: {} as {
      request?: object
      responses?: object[]
      variablesAndPaths?: any[]
    },
    events: {} as { type: 'done.invoke.parse-request'; data: any[] }
      | { type: 'done.invoke.search-references'; data: any[] }
      | { type: 'done.invoke.interpolate-variables'; data: object }
      | { type: 'QUERY'; collectionId: number },
    services: {} as {
      parseRequest: {
        data: any[]
      },
      searchForReferencedValues: {
        data: any[]
      },
      interpolateVariables: {
        data: object
      }
    }
  },
  initial: 'parsing',
  context: {
    request: undefined,
    responses: undefined,
    variablesAndPaths: undefined,
  },
  states: {
    parsing: {
      invoke: {
        id: 'parse-request',
        src: 'parseRequest',
        onDone: {
          target: "searching",
          actions: 'assignVariablesAndPaths'
        },
        onError: {
          target: 'failed',
          actions: log((context, event) => `failed for parsing`)
        }
      }
    },
    searching: {
      invoke: {
        id: 'search-references',
        src: 'searchForReferencedValues',
        onDone: {
          target: 'interpolating',
          actions: 'assignVariablesAndPaths'
        },
        onError: {
          target: 'failed',
          actions: log((context, event) => `failed for searching`)
        }
      }
    },
    interpolating: {
      invoke: {
        id: 'interpolate-variables',
        src: 'interpolateVariables',
        onDone: {
          target: 'complete',
          actions: 'assignRequest'
        },
        onError: {
          target: 'failed',
          actions: log((context, event) => `failed for interpolation`)
        }
      }
    },
    complete: {
      type: "final",
      data: (context) => context.request
    },
    failed: {
      type: "final",
      entry: escalate({ message: 'Failed to process a request' })
    }
  }
},
  {
    actions: {
      // action implementation
      'assignVariablesAndPaths': assign({
        variablesAndPaths: (_, event) => event.data
      }),
      'assignRequest': assign({
        request: (_, event) => event.data
      })
    },
    delays: {
      // no delays here
    },
    guards: {
      // no guards here
    },
    services: {
      parseRequest: (context) => invokeParseRequest(context.request),
      searchForReferencedValues: (context) => invokeSearchReferencedValues(context.responses, context.variablesAndPaths),
      interpolateVariables: (context) => invokeInterpolateVariables(context.request, context.variablesAndPaths)
    }
  })