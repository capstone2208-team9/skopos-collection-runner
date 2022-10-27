import { createMachine, assign } from "xstate";
import {
  invokeFetchAPICall,
  invokeSaveResponse,
} from "./utils/requestRunnerHelpers.js";

export const requestRunnerMachine = createMachine(
  {
    predictableActionArguments: true,
    tsTypes: {} as import("./requestRunnerMachine.typegen.js").Typegen0,
    schema: {
      context: {} as {
        request?: object;
        collectionRunId?: number;
        responseData?: object;
      },
      events: {} as
        | { type: "done.invoke.fetch-api-call"; data: object }
        | { type: "done.invoke.save-response"; data: object },
      services: {} as {
        fetchAPICall: {
          data: object;
        };
        saveResponse: {
          data: object;
        };
      },
    },
    initial: "fetching",
    context: {
      request: undefined,
      responseData: undefined,
      collectionRunId: undefined,
    },
    states: {
      fetching: {
        invoke: {
          id: "fetch-api-call",
          src: "fetchAPICall",
          onDone: {
            target: "loaded",
            actions: "assignResponseData",
          },
        },
      },
      loaded: {
        invoke: {
          id: "save-response",
          src: "saveResponse",
          onDone: {
            target: "done",
          },
        },
      },
      done: {
        type: "final",
        data: (context, event) => context.responseData,
      },
      failed: {},
    },
  },
  {
    actions: {
      // action implementation
      assignResponseData: assign({
        responseData: (_, event) => event.data,
      }),
    },
    delays: {
      // no delays here
    },
    guards: {
      // no guards here
    },
    services: {
      fetchAPICall: (context, event) =>
        invokeFetchAPICall(context.request, context.collectionRunId),
      saveResponse: (context, event) =>
        invokeSaveResponse(context.responseData),
    },
  }
);
