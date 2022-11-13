import {gqlMutateCreateResponse} from '../services/queries'

interface Configuration {
  method: string;
  headers: any;
  body?: string;
}

export async function invokeFetchAPICall(request, collectionRunId) {
  let { url, method, headers, body } = request
  let config: Configuration = { method, headers };
  if (method.toUpperCase() !== "GET") {
    config = { ...config, body };
  }

  const timestampStart = Date.now()
  let fetchResponse = await fetch(url, config)
  const timeForRequest = Date.now() - timestampStart

  if (!fetchResponse.ok) {
    throw Error(fetchResponse.statusText);
  }

  let json = await fetchResponse.json()
  return {
    data: {
      status: fetchResponse.status,
      headers: fetchResponse.headers,
      body: json,
      latency: timeForRequest,
      collectionRun: {
        connect: {
          id: collectionRunId
        }
      },
      request: {
        connect: {
          id: Number(request.id)
        }
      }
    }
  }
}

export async function invokeSaveResponse(responseData) {
  return await gqlMutateCreateResponse(responseData)
}