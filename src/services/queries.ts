import { GraphQLClient, gql } from "graphql-request";
// import * as dotenv from 'dotenv'
// import path from 'path';
// import url from 'url';

// const __filename = url.fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// dotenv.config({ path: __dirname + '/../../.env' });

const endpoint = process.env.GRAPHQL_URL;
const graphQLClient = new GraphQLClient(endpoint);

export const gqlMutateCreateAssertionResults = async (listOfAssertionResults) => {
  let query = gql`
    mutation Mutation($data: [AssertionResultCreateManyInput!]!) {
      createManyAssertionResult(data: $data) {
        count
      }
    }
  `;

  const formattedResults = listOfAssertionResults.map((assertionResult) => {
    return {
      responseId: assertionResult.responseId,
      pass: assertionResult.pass,
      assertionId: assertionResult.assertionId,
      actual: String(assertionResult.actual)
    };
  });

  const queryVariables = {
    data: formattedResults,
  };

  const data = await graphQLClient.request(query, queryVariables);
  return data;
};

export const gqlQueryResponses = async (collectionRunId): Promise<any[]> => {
  const query = gql`
  query Query($where: ResponseWhereInput) {
    responses(where: $where) {
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
  }
  `;

  const queryVariables = {
    where: {
      collectionRunId: {
        equals: Number(collectionRunId),
      },
    },
  };

  const data = await graphQLClient.request(query, queryVariables);
  return data.responses;
}

export const gqlQueryRequests = async (collectionId) => {
  console.log(endpoint)
  const query = gql`
  query Requests($where: RequestWhereInput, $orderBy: [RequestOrderByWithRelationInput!]) {
  requests(where: $where, orderBy: $orderBy) {
    id
    collectionId
    stepNumber
    title
    method
    url
    headers
    body
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

export const gqlMutateCreateCollectionRun = async (collectionId) => {
  const mutation = gql`
    mutation CreateOneCollectionRun($data: CollectionRunCreateInput!) {
      createOneCollectionRun(data: $data) {
        id
      }
    }`

  const mutationVariables = {
    "data": {
      "Collection": {
        "connect": {
          "id": collectionId
        }
      }
    }
  }

  const databaseResponse = await graphQLClient.request(mutation, mutationVariables)
  return databaseResponse.createOneCollectionRun
}

export const gqlMutateCreateResponse = async (responseData) => {
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