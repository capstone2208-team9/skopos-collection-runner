import { createMachine, assign, actions } from 'xstate';
import fetch from 'node-fetch';
import { Configuration, RequestRunnerContext, RequestRunnerEvent, RequestRunnerTypestate } from './types'

import { GraphQLClient, gql } from 'graphql-request'

const endpoint = 'http://localhost:3001/graphql'
const graphQLClient = new GraphQLClient(endpoint)

async function invokeFetchAPICall(request) {
  console.log("THE REQUEST", request)
  let { id: requestId, url, method, headers, body, assertions } = request
  let config: Configuration = { method, headers };
  if (method.toUpperCase() !== "GET") {
    config = { ...config, body };
  }

  const timestampStart = Date.now()
  let fetchResponse = await fetch(url, config)
  const timeForRequest = Date.now() - timestampStart

  let json = await fetchResponse.json()
  const responseVariables = {
    data: {
      status: fetchResponse.status,
      headers: fetchResponse.headers,
      latency: timeForRequest,
      body: json,
      request: {
        connect: {
          id: Number(requestId)
        }
      }
    }
  }

  console.log(responseVariables)
  return responseVariables
}

async function invokeSaveResponse(responseData) {
  const responseMutation = gql`
    mutation CreateOneResponse($data: ResponseCreateInput!) {
      createOneResponse(data: $data) {
        id
      }
    }`

  const databaseResponse = await graphQLClient.request(responseMutation, responseData)
  return databaseResponse.createOneResponse.id
}

async function invokeCheckAssertions(request, responseData, responseId) {
  const assertionResultsMutation = gql`
    mutation CreateManyAssertionResults($data: [AssertionResultsCreateManyInput!]!) {
      createManyAssertionResults(data: $data) {
        count
      }
    }`

  const assertionResultsVariables = {
    data: request.assertions.map(assertion => {
      return {
        actual: String(responseData.data.status),
        assertionId: Number(assertion.id),
        responseId: Number(responseId),
        pass: (String(assertion.expected) === String(responseData.data.status))
      }
    })
  }

  await graphQLClient.request(assertionResultsMutation, assertionResultsVariables)
  return
}

export const requestRunnerMachine = createMachine<RequestRunnerContext, RequestRunnerEvent, RequestRunnerTypestate>({
  initial: "fetching",
  context: {
    request: undefined,
    responseData: undefined,
    responseId: undefined,
  },
  states: {
    fetching: {
      invoke: {
        id: "fetch-api-call",
        src: (context, event) => invokeFetchAPICall(context.request),
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
          target: "responseSaved",
          actions: assign({
            responseId: (_, event) => event.data
          })
        }
      }
    },
    responseSaved: {
      invoke: {
        id: "check-assertions",
        src: (context, event) => invokeCheckAssertions(context.request, context.responseData, context.responseId),
        onDone: {
          target: "done"
        }
      }
    },
    done: {
      type: "final",
      data: (context, event) => context.responseData
    },
    failed: {}
  }
})