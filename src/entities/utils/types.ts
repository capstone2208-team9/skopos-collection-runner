// Unused for now
// // REQUEST RUNNER MACHINE TYPES
// export type RequestRunnerEvent =
//   | { type: 'done.invoke.fetch-api-call'; data: object[] }
//   | { type: 'done.invoke.save-response'; data: object[] }
//   | { type: 'done.invoke.check-assertions'; data: object[] }

// export interface RequestRunnerContext {
//   request?: object
//   collectionRunId?: number
//   responseData?: object
// }

// export type RequestRunnerTypestate =
//   | {
//     value: "fetching"
//     context: RequestRunnerContext & {
//       responseData: undefined
//       responseId: undefined
//     }
//   }
//   | {
//     value: "loaded"
//     context: RequestRunnerContext & {
//       responseData: undefined
//       responseId: undefined
//     }
//   }
//   | {
//     value: "responseSaved"
//     context: RequestRunnerContext & {
//       responseId: undefined
//     }
//   }
//   | {
//     value: "done"
//     context: RequestRunnerContext
//   }

// // REQUEST PROCESSOR MACHINE TYPES
// export type RequestProcessorEvent =
//   | { type: 'done.invoke.parse-request'; data: any[] }
//   | { type: 'done.invoke.search-references'; data: any[] }
//   | { type: 'done.invoke.interpolate-variables'; data: object }
//   | { type: 'QUERY'; collectionId: number }

// export interface RequestProcessorContext {
//   request?: object
//   responses?: object[]
//   variablesAndPaths?: any[]
// }

// export type RequestProcessorTypestate =
//   | {
//     value: "parsing"
//     context: RequestProcessorContext & {
//       variablesAndPaths: undefined
//     }
//   }
//   | {
//     value: "searching"
//     context: RequestProcessorContext
//   }
//   | {
//     value: "interpolating"
//     context: RequestProcessorContext
//   }
//   | {
//     value: "done"
//     context: RequestProcessorContext
//   }

// // COLLECTION RUNNER MACHINE TYPES
// export type CollectionRunnerEvent =
//   | { type: 'QUERY'; collectionId: number }
//   | { type: 'done.invoke.query-requests'; data: object[] }
//   | { type: 'done.invoke.run-request'; data: object[] }

// export interface CollectionRunnerContext {
//   collectionId?: number
//   collectionRunId?: number
//   requestList?: object[]
//   responses?: object[]
// }

// export type CollectionRunnerTypestate =
//   | {
//     value: "idle"
//     context: CollectionRunnerContext & {
//       collectionRunId: undefined
//       requestList: undefined
//     }
//   }
//   | {
//     value: "querying"
//     context: CollectionRunnerContext & {
//       collectionRunId: undefined
//       requestList: undefined
//     }
//   }
//   | {
//     value: "initializing"
//     context: CollectionRunnerContext & {
//       requestList: undefined
//     }
//   }
//   | {
//     value: "running"
//     context: CollectionRunnerContext
//   }
//   | {
//     value: "complete"
//     context: CollectionRunnerContext
//   }