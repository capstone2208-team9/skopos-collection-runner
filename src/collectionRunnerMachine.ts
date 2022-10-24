import { createMachine, assign } from 'xstate';
import { CollectionRunnerContext, CollectionRunnerEvent, CollectionRunnerTypestate } from './types'
import { requestRunnerMachine } from './requestRunnerMachine.js'
import { requestProcessorMachine } from './requestProcessorMachine.js'

import { GraphQLClient, gql } from 'graphql-request'
const endpoint = 'http://localhost:3001/graphql'
const graphQLClient = new GraphQLClient(endpoint)

async function invokeQueryRequests(collectionId) {
  const query = gql`
  query Requests($where: RequestWhereInput, $orderBy: [RequestOrderByWithRelationInput!]) {
  requests(where: $where, orderBy: $orderBy) {
    id
    stepNumber
    title
    body
    method
    headers
    url
    assertions {
      id
      property
      expected
    }
    collectionId
  }
}`

  const queryVariables = {
    "where": {
      "collectionId": {
        "equals": Number(collectionId)
      }
    },
    "orderBy": {
      "stepNumber": "asc"
    }
  }

  const data = await graphQLClient.request(query, queryVariables)
  return data
}

async function invokeCreateCollectionRun(collectionId) {
  const mutation = gql`
    mutation CreateOneCollectionRun($data: CollectionRunCreateInput!) {
      createOneCollectionRun(data: $data) {
        id
      }
    }`

  const mutationVariables = {
    "data": {
      "success": true,
      "Collection": {
        "connect": {
          "id": collectionId
        }
      }
    }
  }

  const databaseResponse = await graphQLClient.request(mutation, mutationVariables)
  return databaseResponse.createOneCollectionRun.id
}


export const collectionRunnerMachine =
  createMachine<CollectionRunnerContext, CollectionRunnerEvent, CollectionRunnerTypestate>({
    context: { collectionId: undefined, requestList: undefined, responses: [] },
    id: "collectionRunner",
    initial: "idle",
    states: {
      idle: {
        on: {
          QUERY: {
            target: "querying",
            actions: assign({
              collectionId: (_, event) => event.collectionId,
            }),
          },
        },
      },
      querying: {
        invoke: {
          src: (context, event) => invokeQueryRequests(context.collectionId),
          id: "query-requests",
          onDone: {
            target: "initializing",
            actions: assign({
              requestList: (context, event) => event.data.requests
            })
          },
          onError: {}
        },
      },
      initializing: {
        invoke: {
          src: (context, event) => invokeCreateCollectionRun(context.collectionId),
          id: "initialize-collection-run",
          onDone: {
            target: "running",
            actions: assign({
              collectionRunId: (context, event) => event.data
            })
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
                actions: assign({
                  requestList: (context, event) => context.requestList.map((item, index) => {
                    if (index === 0) {
                      return event.data
                    } else {
                      return item
                    }
                  })
                })
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
                cond: (context, event) => {
                  return context.requestList.length > 1
                },
                actions: [
                  assign({
                    responses: (context, event) => context.responses.concat(event.data.data)
                  }),
                  assign({
                    requestList: (context, event) => context.requestList.slice(1)
                  })
                ]
              },
              {
                target: "#collectionRunner.complete",
                actions: assign({
                  responses: (context, event) => context.responses.concat(event.data.data)
                }),
              }]
            }
          },
        },
      },
      complete: {
        type: "final",
      },
    },
  })