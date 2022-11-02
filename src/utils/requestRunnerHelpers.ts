import { GraphQLClient, gql } from 'graphql-request'
import fetch from 'node-fetch';
const endpoint = 'http://localhost:3001/graphql'
const graphQLClient = new GraphQLClient(endpoint)

interface Configuration {
  method: string;
  headers: any;
  body?: string;
}

export async function invokeFetchAPICall(request, collectionRunId) {
  console.log(request)
  let { url, method, headers, body } = request
  let config: Configuration = { method, headers };
  if (method.toUpperCase() !== "GET") {
    config = { ...config, body };
  }

  const timestampStart = Date.now()
  let fetchResponse = await fetch(url, config)
  console.log(fetchResponse)
  const timeForRequest = Date.now() - timestampStart

  let json = await fetchResponse.json()
  const responseVariables = {
    data: {
      status: fetchResponse.status,
      headers: fetchResponse.headers,
      body: json,
      latency: timeForRequest,
      CollectionRun: {
        connect: {
          id: collectionRunId
        }
      },
      Request: {
        connect: {
          id: Number(request.id)
        }
      }
    }
  }

  return responseVariables
}

export async function invokeSaveResponse(responseData) {
  const responseMutation = gql`
    mutation CreateOneResponse($data: ResponseCreateInput!) {
      createOneResponse(data: $data) {
        id
        status
        headers
        body
        latency
        Request {
          assertions {
            property
            comparison
            expected
            id
          }
        }
      }
    }`

  const databaseResponse = await graphQLClient.request(responseMutation, responseData)
  const response = databaseResponse.createOneResponse
  return response
}