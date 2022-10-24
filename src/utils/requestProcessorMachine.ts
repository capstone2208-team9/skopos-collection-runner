import { createMachine, assign, sendParent, actions } from 'xstate';
import { RequestProcessorContext, RequestProcessorEvent, RequestProcessorTypestate } from './types'

async function invokeParseRequest(request) {
  let { url, headers, body } = request
  let variables = []

  const regexp = /(@{{[^}]*}})/g
  let urlMatches = [...url.matchAll(regexp)].map(subarr => subarr[1])
  let bodyMatches = [...body.matchAll(regexp)].map(subarr => subarr[1])
  let headerMatches = []

  for (const property in headers) {
    headerMatches = [...headers[property].matchAll(regexp)].map(subarr => subarr[1])
  }

  variables = [...urlMatches, ...bodyMatches, ...headerMatches]

  const variablesPathsArray = variables.map(item => [item, undefined])

  for (let variableSubArr of variablesPathsArray) {
    let pathVariables = variableSubArr[0]
      .match(/@\{\{([^}]*)\}\}/)[1]
      .split(/\.|\[|\]/).filter((path) => path !== "")
    pathVariables[0] = Number(pathVariables[0].match(/\d+/)[0]) - 1

    variableSubArr[1] = pathVariables
  }
  return variablesPathsArray
}

async function invokeSearchReferencedValues(responses, variablesPathsArray) {
  for (let subarr of variablesPathsArray) {
    let path = subarr[1]
    const rootItem = responses[path.shift()];
    let targetItem = rootItem;

    while (path.length !== 0) {
      targetItem = targetItem[path.shift()];

      if (targetItem === undefined) throw "the path does not exist";
    }

    subarr[1] = targetItem
  }
  return variablesPathsArray
}

async function invokeInterpolateVariables(request, variablesPathsArray) {
  let jsonRequest = JSON.stringify(request)
  for (let [variable, value] of variablesPathsArray) {
    jsonRequest = jsonRequest.replace(variable, value)
  }

  return JSON.parse(jsonRequest)
}

export const requestProcessorMachine = createMachine<RequestProcessorContext, RequestProcessorEvent, RequestProcessorTypestate>({
  // id: request.id,
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
      invoke: { // Once responses saved, need to send assertion data to db
        // should this be done with a new assertionCheck machine or something?
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
      invoke: { // Once responses saved, need to send assertion data to db
        // should this be done with a new assertionCheck machine or something?
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
})