import {gqlMutateCreateResponse} from '../services/queries'

interface Configuration {
  method: string;
  headers: any;
  body?: string;
}

const parseResponse = async (response: Response) => {
  const text = await response.text();
  try {
    return JSON.parse(text)
  } catch (e) {
    return {}
  }
}

export async function invokeFetchAPICall(request, collectionRunId) {
    let { url, method, headers, body } = request
    headers = new Headers(headers || {})
    body = body ? body : {}
    let config: Configuration = { method, headers };
    if (method.toUpperCase() !== "GET" && body !== '') {
      config = { ...config, body };
    }

    const timestampStart = Date.now()

    try {
      let fetchResponse = await fetch(url, config)
      const timeForRequest = Date.now() - timestampStart
      const body = await parseResponse(fetchResponse)
      // convert headers into an object we can return
      const headers = Object.fromEntries(fetchResponse.headers)
      return {
        data: {
          status: fetchResponse.status,
          headers,
          body,
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
    } catch (e) {
      console.log(e.toString())
      throw e
    }

}

export async function invokeSaveResponse(responseData) {
  return await gqlMutateCreateResponse(responseData)
}