import express from 'express'
const app = express()
const PORT = 3003
import fetch from 'node-fetch';
import cors from 'cors'
import replaceVariableReferences from './utils/replaceVariableReferences.js'

app.use(cors())

import { GraphQLClient, gql } from 'graphql-request'
const endpoint = 'http://localhost:3001/graphql'

const graphQLClient = new GraphQLClient(endpoint)

app.get('/:id', (req, res) => {
  const collectionId = req.params.id
  main(collectionId).catch((error) => console.error(error))
  res.sendStatus(200)
})

app.listen(PORT, () => {
  console.log(`Testrunner running on port ${PORT}`)
})


async function main(collectionId) {
  const data = await queryCollection(collectionId)
  await runCollection(data)
}

async function queryCollection(collectionId) {
  const query = gql`
  query Requests($where: RequestWhereInput, $orderBy: [RequestOrderByWithRelationInput!]) {
  requests(where: $where, orderBy: $orderBy) {
    id
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
        "equals": 2
      }
    },
    "orderBy": {
      "stepNumber": "asc"
    }
  }

  const data = await graphQLClient.request(query, queryVariables)
  return data
}

interface Responses {
  [key: string]: any;
}

interface Configuration {
  method: string;
  headers: any;
  body?: string;
}

async function runCollection(collection) {
  const responses: Responses = {};

  for (let request of collection.requests) {
    const requestId = request.id
    const timestampStart = Date.now()
    let { url, method, headers, body, assertions } = request

    console.log(url, responses)
    url = replaceVariableReferences(url, responses)
    console.log(url, responses)

    let config: Configuration = { method, headers };

    if (method.toUpperCase() !== "GET") {
      body = replaceVariableReferences(body, responses);
      config = { ...config, body };
    }

    let fetchResponse = await fetch(url, config)

    const timeForRequest = Date.now() - timestampStart
    let json = await fetchResponse.json()
    responses[request.title] = json;
    console.log(responses)

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

    const responseMutation = gql`
    mutation CreateOneResponse($data: ResponseCreateInput!) {
      createOneResponse(data: $data) {
        id
        body
      }
    }`

    const responseData = await graphQLClient.request(responseMutation, responseVariables)
    console.log(responseData)
    const responseId = responseData.createOneResponse.id
    const responseTimestamp = responseData.createOneResponse.createdAt

    const assertionResultsMutation = gql`
    mutation CreateManyAssertionResults($data: [AssertionResultsCreateManyInput!]!) {
      createManyAssertionResults(data: $data) {
        count
      }
    }`

    const assertionResultsVariables = {
      data: assertions.map(assertion => {
        return {
          actual: String(fetchResponse.status),
          createdAt: responseTimestamp,
          assertionId: Number(assertion.id),
          responseId: Number(responseId),
          pass: (String(assertion.expected) === String(fetchResponse.status))
        }
      })
    }

    await graphQLClient.request(assertionResultsMutation, assertionResultsVariables)
  }
}
