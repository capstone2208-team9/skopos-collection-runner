var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { GraphQLClient, gql } from 'graphql-request';
const endpoint = 'http://localhost:3001/graphql';
const graphQLClient = new GraphQLClient(endpoint);
export function invokeQueryRequests(collectionId) {
    return __awaiter(this, void 0, void 0, function* () {
        const query = gql `
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
}`;
        const queryVariables = {
            "where": {
                "collectionId": {
                    "equals": Number(collectionId)
                }
            },
            "orderBy": {
                "stepNumber": "asc"
            }
        };
        const data = yield graphQLClient.request(query, queryVariables);
        return data;
    });
}
export function invokeCreateCollectionRun(collectionId) {
    return __awaiter(this, void 0, void 0, function* () {
        const mutation = gql `
    mutation CreateOneCollectionRun($data: CollectionRunCreateInput!) {
      createOneCollectionRun(data: $data) {
        id
      }
    }`;
        const mutationVariables = {
            "data": {
                "success": true,
                "Collection": {
                    "connect": {
                        "id": collectionId
                    }
                }
            }
        };
        const databaseResponse = yield graphQLClient.request(mutation, mutationVariables);
        return databaseResponse.createOneCollectionRun;
    });
}
export const listNotEmpty = (context, event) => context.requestList.length > 1;
//# sourceMappingURL=collectionRunnerHelpers.js.map