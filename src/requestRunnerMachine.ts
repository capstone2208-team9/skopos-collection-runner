import { createMachine, assign } from 'xstate';
import fetch from 'node-fetch';
import { Configuration, RequestRunnerContext, RequestRunnerEvent, RequestRunnerTypestate } from './types'

import { GraphQLClient, gql } from 'graphql-request'

const endpoint = 'http://localhost:3001/graphql'
const graphQLClient = new GraphQLClient(endpoint)

async function invokeFetchAPICall(request, collectionRunId) {
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
  }

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

export const requestRunnerMachine = createMachine<RequestRunnerContext, RequestRunnerEvent, RequestRunnerTypestate>({
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
})