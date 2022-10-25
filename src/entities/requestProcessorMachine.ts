import { createMachine, assign } from 'xstate';
import { invokeParseRequest, invokeSearchReferencedValues, invokeInterpolateVariables } from './utils/requestProcessorHelpers.js';

export const requestProcessorMachine = createMachine({
  predictableActionArguments: true,
  tsTypes: {} as import("./requestProcessorMachine.typegen.js").Typegen0,
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
        }
      }
    },
    complete: {
      type: "final",
      data: (context, event) => context.request
    },
    failed: {}
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
      parseRequest: (context, event) => invokeParseRequest(context.request),
      searchForReferencedValues: (context, event) => invokeSearchReferencedValues(context.responses, context.variablesAndPaths),
      interpolateVariables: (context, event) => invokeInterpolateVariables(context.request, context.variablesAndPaths)
    }
  })