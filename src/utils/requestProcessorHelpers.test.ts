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
  expect(actual).toEqual([["@{{step1.headers.Content-Type}}", [0, "headers", "Content-Type"]]])
})

test('invokeParseRequest works with multiple header keys', async () => {
  const request = {url: "https://jsonplaceholder.typicode.com/posts/1", headers: {"Content-Type": '@{{step1.headers.Content-Type}}', 'Accept': 'application/json'}}
  const actual = await invokeParseRequest(request)
  expect(actual).toHaveLength(1)
  expect(actual).toEqual([["@{{step1.headers.Content-Type}}", [0, "headers", "content-type"]]])
})

test('invokeParseRequest works with multiple header keys', async () => {
  const request = {url: "https://jsonplaceholder.typicode.com/posts/1", headers: {"Content-Type": '@{{step1.headers.Content-Type}}', 'Accept': '@{{step1.headers.Accept}}'}}
  const actual = await invokeParseRequest(request)
  expect(actual).toHaveLength(2)
  expect(actual).toEqual([
    ["@{{step1.headers.Content-Type}}", [0, "headers", "Content-Type"]],
    ["@{{step1.headers.Accept}}", [0, "headers", "Accept"]],
  ])
})

test('invokeParseRequest works with different steps', async () => {
  const request = {url: "https://jsonplaceholder.typicode.com/posts/1", headers: {"Content-Type": '@{{step2.headers.Content-Type}}', 'Accept': '@{{step1.headers.Accept}}'}}
  const actual = await invokeParseRequest(request)
  expect(actual).toHaveLength(2)
  expect(actual).toEqual([
    ["@{{step2.headers.content-type}}", [1, "headers", "Content-Type"]],
    ["@{{step1.headers.Accept}}", [0, "headers", "Accept"]],
  ])
})

test('invokeParseRequest works when headers doesn\'t have variable', async () => {
  const request = {url: "https://jsonplaceholder.typicode.com/posts/1", headers: {"Content-Type": 'application/json'}}
  const actual = await invokeParseRequest(request)
  expect(actual).toHaveLength(0)
})

test('invokeParseRequest extracts variables from body', async () => {
  const request = {url: "https://jsonplaceholder.typicode.com/posts/1", body: JSON.stringify({userId: "@{{step1.body.userId}}"})}
  const actual = await invokeParseRequest(request)
  expect(actual).toHaveLength(1)
  expect(actual).toEqual([["@{{step1.body.userId}}", [0, "body", "userId"]]])
})