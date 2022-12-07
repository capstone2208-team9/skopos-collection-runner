import dotenv from 'dotenv'
import {gql, GraphQLClient} from 'graphql-request'

if (process.env.NODE_ENV !== 'production') {
  dotenv.config()
}

// FOR LOCALHOST DEVELOPMENT ------------------------
// import * as dotenv from 'dotenv'
// import path from 'path';
// import url from 'url';
// const __filename = url.fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
// dotenv.config({ path: __dirname + '/../../.env' });
// --------------------------------------------------

const endpoint = process.env.GRAPHQL_URL
const graphQLClient = new GraphQLClient(endpoint)

export const gqlMutateCreateAssertionResults = async (
  listOfAssertionResults
) => {
  let query = gql`
      mutation Mutation($data: [AssertionResultCreateManyInput!]!) {
          createManyAssertionResult(data: $data) {
              count
          }
      }
  `

  const formattedResults = listOfAssertionResults.map((assertionResult) => {
    return {
      responseId: assertionResult.responseId,
      pass: assertionResult.pass,
      assertionId: assertionResult.assertionId,
      actual: String(assertionResult.actual),
    }
  })

  const queryVariables = {
    data: formattedResults,
  }

  try {
    return await graphQLClient.request(query, queryVariables)
  } catch (error) {
    console.error(JSON.stringify(error, undefined, 2))
    return undefined
  }
}

export const gqlQueryResponses = async (collectionRunId): Promise<any[]> => {
  const query = gql`
      query Query($where: ResponseWhereInput) {
          responses(where: $where) {
              id
              status
              headers
              body
              latency
              request {
                  assertions {
                      property
                      comparison
                      expected
                      id
                  }
              }
          }
      }
  `

  const queryVariables = {
    where: {
      collectionRunId: {
        equals: Number(collectionRunId),
      },
    },
  }


  try {
    const databaseResponse = await graphQLClient.request(query, queryVariables)
    return databaseResponse.responses
  } catch (error) {
    console.error(JSON.stringify(error, undefined, 2))
    return undefined
  }
}

export const gqlQuerySNSTopicArn = async (collectionId) => {
  const query = gql`
      query Query($where: CollectionWhereUniqueInput!) {
          collection(where: $where) {
              monitor {
                  snsTopicArn
                  contactInfo
              }
          }
      }
  `

  const queryVariables = {
    where: {
      id: Number(collectionId),
    }
  }

  try {
    return await graphQLClient.request(query, queryVariables)
  } catch (error) {
    console.error(JSON.stringify(error, undefined, 2))
    return undefined
  }
}

export const gqlQueryRequests = async (collectionId) => {
  const query = gql`
      query Requests(
          $where: RequestWhereInput
          $orderBy: [RequestOrderByWithRelationInput!]
      ) {
          requests(where: $where, orderBy: $orderBy) {
              id
              collectionId
              collection {
                  title
              }
              stepNumber
              title
              method
              url
              headers
              body
          }
      }
  `

  const queryVariables = {
    where: {
      collectionId: {
        equals: Number(collectionId),
      },
    },
    orderBy: {
      stepNumber: 'asc',
    },
  }

  try {
    return await graphQLClient.request(query, queryVariables)
  } catch (error) {
    console.error(JSON.stringify(error, undefined, 2))
    return undefined
  }
}

export const gqlMutateCreateCollectionRun = async (collectionId) => {
  const mutation = gql`
      mutation CreateOneCollectionRun($data: CollectionRunCreateInput!) {
          createOneCollectionRun(data: $data) {
              id
          }
      }
  `

  const mutationVariables = {
    data: {
      collection: {
        connect: {
          id: collectionId,
        },
      },
    },
  }

  try {
    const databaseResponse = await graphQLClient.request(mutation, mutationVariables)
    return databaseResponse.createOneCollectionRun
  } catch (error) {
    console.error(JSON.stringify(error, undefined, 2))
    return undefined
  }
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
              request {
                  assertions {
                      property
                      comparison
                      expected
                      id
                  }
              }
          }
      }
  `

  try {
    const databaseResponse = await graphQLClient.request(responseMutation, responseData)
    return databaseResponse.createOneResponse
  } catch (error) {
    console.error(JSON.stringify(error, undefined, 2))
    return undefined
  }
}
