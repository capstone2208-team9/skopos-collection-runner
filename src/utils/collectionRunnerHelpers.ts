import { gqlMutateCreateCollectionRun, gqlQueryRequests, gqlQuerySNSTopicArn } from '../services/queries'

export const invokeQueryRequests = async (collectionId) => {
  const data = await gqlQueryRequests(collectionId)
  return data
}

export const invokeCreateCollectionRun = async (collectionId) => {
  return await gqlMutateCreateCollectionRun(collectionId)
}

export const invokeQuerySNSTopicArn = async (collectionId) => {
  let data = await gqlQuerySNSTopicArn(collectionId)
  console.log(data)
  const monitor = data.collection.monitor
  if (!monitor) { return {} }

  const snsTopicArn = monitor.snsTopicArn ? monitor.snsTopicArn : undefined
  const webhookUrl = (monitor.contactInfo && monitor.contactInfo.slack) ? data.collection.monitor.contactInfo.slack : undefined
  data = { snsTopicArn, webhookUrl }
  return data
}

export const listNotEmpty = (context) => context.requestList.length > 1
export const requestListExists = (context, event) => event.data.requests.length !== 0 && event.data.requests !== undefined