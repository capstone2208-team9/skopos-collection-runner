import { createMachine, assign } from "xstate";
import { requestRunnerMachine } from "./requestRunnerMachine.js";
import { requestProcessorMachine } from "./requestProcessorMachine.js";
import {
  invokeQueryRequests,
  invokeCreateCollectionRun,
  invokeMessageRunId,
  listNotEmpty,
} from "./utils/collectionRunnerHelpers.js";

export const collectionRunnerMachine = createMachine(
  {
    predictableActionArguments: true,
    tsTypes: {} as import("./collectionRunnerMachine.typegen.js").Typegen0,
    schema: {
      context: {} as {
        collectionId?: number;
        collectionRunId?: number;
        requestList?: object[];
        responses?: object[];
      },
      events: {} as
        | { type: "QUERY"; collectionId: number }
        | { type: "done.invoke.query-requests"; data: { requests: object[] } }
        | {
            type: "done.invoke.initialize-collection-run";
            data: { id: number };
          }
        | { type: "done.invoke.process-request"; data: { requests: object[] } }
        | { type: "done.invoke.run-request"; data: { data: object[] } }
        | { type: "done.invoke.message-run-id"; data: number },
      services: {} as {
        queryRequests: {
          data: { requests: object[] };
        };
        createCollectionRun: {
          data: { id: number };
        };
        messageRunId: {
          data: number;
        };
      },
    },
    context: { collectionId: undefined, requestList: undefined, responses: [] },
    id: "collectionRunner",
    initial: "idle",
    states: {
      idle: {
        on: {
          QUERY: {
            target: "querying",
            actions: "assignCollectionId",
          },
        },
      },
      querying: {
        invoke: {
          id: "query-requests",
          src: "queryRequests",
          onDone: {
            target: "initializing",
            actions: "assignRequestList",
          },
          onError: {},
        },
      },
      initializing: {
        invoke: {
          id: "initialize-collection-run",
          src: "createCollectionRun",
          onDone: {
            target: "running",
            actions: "assignCollectionRunId",
          },
        },
      },
      running: {
        initial: "processing",
        states: {
          processing: {
            invoke: {
              id: "process-request",
              src: requestProcessorMachine,
              data: {
                request: (context, event) => context.requestList[0],
                responses: (context, event) => context.responses,
              },
              onDone: {
                target: "requesting",
                actions: "assignProcessedRequestToList",
              },
            },
          },
          requesting: {
            invoke: {
              id: "run-request",
              src: requestRunnerMachine,
              data: {
                request: (context, event) => context.requestList[0],
                collectionRunId: (context, event) => context.collectionRunId,
              },
              onDone: [
                {
                  target: "#collectionRunner.running.processing",
                  cond: { type: "listNotEmpty" },
                  actions: [
                    "assignResponses",
                    "assignRemoveCompletedRequestFromList",
                  ],
                },
                {
                  target: "#collectionRunner.messaging",
                  actions: "assignResponses",
                },
              ],
            },
          },
        },
      },
      messaging: {
        invoke: {
          id: "message-run-id",
          src: "messageRunId",
          data: {
            collectionRunId: (context, event) => context.collectionRunId,
            responses: (context, event) => context.responses,
          },
          onDone: {
            target: "complete",
          },
          onError: {
            target: "complete",
          },
        },
      },
      complete: {
        type: "final",
      },
    },
  },
  {
    actions: {
      // action implementation
      assignCollectionId: assign({
        collectionId: (context, event) => event.collectionId,
      }),
      assignRequestList: assign({
        requestList: (context, event) => event.data.requests,
      }),
      assignCollectionRunId: assign({
        collectionRunId: (context, event) => event.data.id,
      }),
      assignProcessedRequestToList: assign({
        requestList: (context, event) => {
          context.requestList[0] = event.data;
          return context.requestList;
        },
      }),
      assignResponses: assign({
        responses: (context, event) =>
          context.responses.concat(event.data.data),
      }),
      assignRemoveCompletedRequestFromList: assign({
        requestList: (context, event) => context.requestList.slice(1),
      }),
    },
    delays: {
      // no delays here
    },
    guards: {
      listNotEmpty,
    },
    services: {
      queryRequests: (context, event) =>
        invokeQueryRequests(context.collectionId),
      createCollectionRun: (context, event) =>
        invokeCreateCollectionRun(context.collectionId),
      messageRunId: (context, event) =>
        invokeMessageRunId(context.collectionRunId, context.responses),
    },
  }
);
