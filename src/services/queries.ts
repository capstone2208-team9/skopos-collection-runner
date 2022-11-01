import { GraphQLClient, gql } from "graphql-request";

const endpoint = "http://localhost:3001/graphql";
const graphQLClient = new GraphQLClient(endpoint);

export const invokeSaveAssertionResults = async (listOfAssertionResults) => {
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

export async function invokeGetResponses(collectionRunId): Promise<any[]> {
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
