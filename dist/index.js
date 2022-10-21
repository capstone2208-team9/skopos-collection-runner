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
function queryCollection(collectionId) {
    return __awaiter(this, void 0, void 0, function* () {
        const query = gql `
  query Collection($where: CollectionWhereUniqueInput!) {
    collection(where: $where) {
      requests {
        id
        title
        body
        url
        method
        headers
        assertions {
          id
          property
          expected
        }
      }
    }
  }`;
        const queryVariables = {
            where: {
                id: Number(collectionId),
            }
        };
        const data = yield graphQLClient.request(query, queryVariables);
        return data.collection;
    });
}
function runCollection(collection) {
    return __awaiter(this, void 0, void 0, function* () {
        for (let request of collection.requests) {
            const requestId = request.id;
            const timestampStart = Date.now();
            const { url, method, headers, body, assertions } = request;
            let config = { method, headers, body: null };
            if (method !== 'GET') {
                config.body = body;
            }
            let fetchResponse = yield fetch(url, config);
            const timeForRequest = Date.now() - timestampStart;
            let json = yield fetchResponse.json();
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
        createdAt
      }
    }`;
            const responseData = yield graphQLClient.request(responseMutation, responseVariables);
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