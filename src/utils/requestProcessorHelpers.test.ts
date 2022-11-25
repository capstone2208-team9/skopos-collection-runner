import {invokeParseRequest} from './requestProcessorHelpers'

test('invokeParseRequest extracts variables from url', async () => {
  const request = {url: "@{{step1.body.url}}" }
  const actual = await invokeParseRequest(request)
  expect(actual).toHaveLength(1)
  expect(actual).toEqual([["@{{step1.body.url}}", [0, "body", "url"]]])
})

test('invokeParseRequest extracts variables from headers', async () => {
  const request = {url: "https://jsonplaceholder.typicode.com/posts/1", headers: {"Content-Type": '@{{step1.headers.Content-Type}}'}}
  const actual = await invokeParseRequest(request)
  expect(actual).toHaveLength(1)
  expect(actual).toEqual([["@{{step1.headers.content-type}}", [0, "headers", "content-type"]]])
})

test('invokeParseRequest extracts variables from body', async () => {
  const request = {url: "https://jsonplaceholder.typicode.com/posts/1", body: JSON.stringify({userId: "@{{step1.body.userId}}"})}
  const actual = await invokeParseRequest(request)
  expect(actual).toHaveLength(1)
  expect(actual).toEqual([["@{{step1.body.userId}}", [0, "body", "userId"]]])
})
