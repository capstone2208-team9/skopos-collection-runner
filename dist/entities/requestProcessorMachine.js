import { createMachine, assign } from 'xstate';
import { invokeParseRequest, invokeSearchReferencedValues, invokeInterpolateVariables } from './utils/requestProcessorHelpers.js';
export const requestProcessorMachine = createMachine({
    initial: "parsing",
    context: {
        request: undefined,
        responses: undefined,
        variablesAndPaths: undefined,
    },
    states: {
        parsing: {
            invoke: {
                id: "parse-request",
                src: (context, event) => invokeParseRequest(context.request),
                onDone: {
                    target: "searching",
                    actions: assign({
                        variablesAndPaths: (_, event) => event.data
                    })
                }
            }
        },
        searching: {
            invoke: {
                id: "search-references",
                src: (context, event) => invokeSearchReferencedValues(context.responses, context.variablesAndPaths),
                onDone: {
                    target: "interpolating",
                    actions: assign({
                        variablesAndPaths: (_, event) => event.data
                    })
                }
            }
        },
        interpolating: {
            invoke: {
                id: "interpolate-variables",
                src: (context, event) => invokeInterpolateVariables(context.request, context.variablesAndPaths),
                onDone: {
                    target: "complete",
                    actions: assign({
                        request: (_, event) => event.data
                    })
                }
            }
        },
        complete: {
            type: "final",
            data: (context, event) => context.request
        },
        failed: {}
    }
});
//# sourceMappingURL=requestProcessorMachine.js.map