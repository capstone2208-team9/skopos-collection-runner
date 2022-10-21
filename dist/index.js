var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import express from 'express';
const app = express();
const PORT = 3003;
import fetch from 'node-fetch';
import cors from 'cors';
import replaceVariableReferences from './utils/replaceVariableReferences.js';
/*

interface Configuration {
  method: string;
  headers: any;
  body?: string;
}

interface Responses {
  [key: string]: any;
}

export async function runCollection(listOfRequests: any) {
  const responses: Responses = {};

  for (let request of listOfRequests) {
    let { url, method, headers, body } = request;
    let config: Configuration = { method, headers };

    url = replaceVariableReferences(url, responses);

    if (method.toUpperCase() !== "GET") {
      body = replaceVariableReferences(body, responses);
      config = { ...config, body };
    }

    const response: any = await fetch(url, body);

    responses[request.title] = await response.json();
  }

  return responses;
}

const requests = [
  {
    title: "first test",
    url: "https://api.nationalize.io?name=peter",
    method: "GET",
    headers: { Accept: "application/json" },
  },
  {
    title: "second test",
    url: "https://restcountries.com/v3.1/alpha?codes=@{{first test.country[0].country_id}}",
    method: "GET",
  },
];

runCollection(requests);
*/
app.use(cors());
import { GraphQLClient, gql } from 'graphql-request';
const endpoint = 'http://localhost:3001/graphql';
const graphQLClient = new GraphQLClient(endpoint);
app.get('/:id', (req, res) => {
    const collectionId = req.params.id;
    main(collectionId).catch((error) => console.error(error));
    res.sendStatus(200);
});
app.listen(PORT, () => {
    console.log(`Testrunner running on port ${PORT}`);
});
function main(collectionId) {
    return __awaiter(this, void 0, void 0, function* () {
        const data = yield queryCollection(collectionId);
        yield runCollection(data);
    });
}
/*
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
}
*/
function queryCollection(collectionId) {
    return __awaiter(this, void 0, void 0, function* () {
        const query = gql `
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
}`;
        const queryVariables = {
            "where": {
                "collectionId": {
                    "equals": 2
                }
            },
            "orderBy": {
                "stepNumber": "asc"
            }
        };
        const data = yield graphQLClient.request(query, queryVariables);
        console.log(data);
        return data;
    });
}
function runCollection(collection) {
    return __awaiter(this, void 0, void 0, function* () {
        const responses = {};
        for (let request of collection.requests) {
            const requestId = request.id;
            const timestampStart = Date.now();
            let { url, method, headers, body, assertions } = request;
            console.log(url, responses);
            url = replaceVariableReferences(url, responses);
            console.log(url, responses);
            let config = { method, headers };
            if (method.toUpperCase() !== "GET") {
                body = replaceVariableReferences(body, responses);
                config = Object.assign(Object.assign({}, config), { body });
            }
            let fetchResponse = yield fetch(url, config);
            const timeForRequest = Date.now() - timestampStart;
            let json = yield fetchResponse.json();
            responses[request.title] = json;
            console.log(responses);
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
            };
            const responseMutation = gql `
    mutation CreateOneResponse($data: ResponseCreateInput!) {
      createOneResponse(data: $data) {
        id
        body
      }
    }`;
            const responseData = yield graphQLClient.request(responseMutation, responseVariables);
            console.log(responseData);
            const responseId = responseData.createOneResponse.id;
            const responseTimestamp = responseData.createOneResponse.createdAt;
            const assertionResultsMutation = gql `
    mutation CreateManyAssertionResults($data: [AssertionResultsCreateManyInput!]!) {
      createManyAssertionResults(data: $data) {
        count
      }
    }`;
            const assertionResultsVariables = {
                data: assertions.map(assertion => {
                    return {
                        actual: String(fetchResponse.status),
                        createdAt: responseTimestamp,
                        assertionId: Number(assertion.id),
                        responseId: Number(responseId),
                        pass: (String(assertion.expected) === String(fetchResponse.status))
                    };
                })
            };
            yield graphQLClient.request(assertionResultsMutation, assertionResultsVariables);
        }
    });
}
//# sourceMappingURL=index.js.map