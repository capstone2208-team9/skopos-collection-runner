import { gqlMutateCreateCollectionRun, gqlQueryRequests, gqlQuerySNSTopicArn } from '../services/queries'

export const invokeQueryRequests = async (collectionId) => {
  try {
    const data = await gqlQueryRequests(collectionId)
    console.log(data)
    return data
  } catch (error) {
    console.error(error)
    return undefined
  }
}

export const invokeCreateCollectionRun = async (collectionId) => {
  return await gqlMutateCreateCollectionRun(collectionId)
}

export const invokeQuerySNSTopicArn = async (collectionId) => {
  try {
    let data = await gqlQuerySNSTopicArn(collectionId)
    // TODO: this was throwing an error when no monitor so added `|| {}`
    data = data.collection.monitor || {}
    return data
  } catch (error) {
    console.error(error)
    return undefined
  }
}

export const listNotEmpty = (context) => context.requestList.length > 1
export const requestListExists = (context, event) => event.data.requests.length !== 0 && event.data.requests !== undefined