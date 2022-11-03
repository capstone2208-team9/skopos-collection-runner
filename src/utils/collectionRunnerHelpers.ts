import { gqlMutateCreateCollectionRun, gqlQueryRequests } from '../services/queries.js'

export const invokeQueryRequests = async (collectionId) => {
  return await gqlQueryRequests(collectionId)
}

export const invokeCreateCollectionRun = async (collectionId) => {
  return await gqlMutateCreateCollectionRun(collectionId)
}

export const listNotEmpty = (context, event) => context.requestList.length > 1
export const requestListExists = (context, event) => context.requestList !== undefined