import fetch from "node-fetch";
import { GraphQLClient, gql } from "graphql-request";
const endpoint = "http://localhost:3001/graphql";
const graphQLClient = new GraphQLClient(endpoint);

export async function invokeQueryRequests(collectionId) {
  const query = gql`
    query Requests(
      $where: RequestWhereInput
      $orderBy: [RequestOrderByWithRelationInput!]
    ) {
      requests(where: $where, orderBy: $orderBy) {
        id
        title
        url
        method
        headers
        body
        stepNumber
        collectionId
        assertions {
          property
          comparison
          expected
          requestId
        }
      }
    }
  `;

  const queryVariables = {
    where: {
      collectionId: {
        equals: Number(collectionId),
      },
    },
    orderBy: {
      stepNumber: "asc",
    },
  };

  const data = await graphQLClient.request(query, queryVariables);
  return data;
}

export async function invokeCreateCollectionRun(collectionId) {
  const mutation = gql`
    mutation CreateOneCollectionRun($data: CollectionRunCreateInput!) {
      createOneCollectionRun(data: $data) {
        id
      }
    }
  `;

  const mutationVariables = {
    data: {
      Collection: {
        connect: {
          id: collectionId,
        },
      },
    },
  };

  const databaseResponse = await graphQLClient.request(
    mutation,
    mutationVariables
  );
  return databaseResponse.createOneCollectionRun;
}

export async function invokeMessageRunId(collectionRunId, responses) {
  const data = JSON.stringify(responses);
  console.log("data before sending it to assertion runner", responses);

  const fetchResponse = await fetch(
    `http://localhost:3005/${collectionRunId}`,
    {
      method: "POST",
      body: data,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  return fetchResponse.status;
}

export const listNotEmpty = (context, event) => context.requestList.length > 1;
