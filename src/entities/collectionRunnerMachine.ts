import { createMachine, assign } from 'xstate';
import { requestRunnerMachine } from './requestRunnerMachine'
import { requestProcessorMachine } from './requestProcessorMachine'
import { assertionRunnerMachine } from './assertionRunnerMachine';
import { invokeQueryRequests, invokeCreateCollectionRun, listNotEmpty, requestListExists, invokeQuerySNSTopicArn } from '../utils/collectionRunnerHelpers';
import { log } from 'xstate/lib/actions';
import { publishMessage } from '../sdkModules/sns/publishMessage'

export const collectionRunnerMachine =
  createMachine({
    predictableActionArguments: true,
    tsTypes: {} as import('./collectionRunnerMachine.typegen.js').Typegen0,
    schema: {
      context: {} as {
        collectionId?: number
        collectionRunId?: number
        snsTopicArn?: String
        webhookUrl?: String
        requestList?: object[]
        responses?: object[]
        currentResponse?: object
      }, 
      events: {} as { type: 'QUERY'; data: { collectionId: number }}
        | { type: 'done.invoke.query-requests'; data: { requests: object[] } }
        | { type: 'done.invoke.query-SNSTopicArn'; data: { snsTopicArn: String | undefined, webhookUrl: String | undefined } }
        | { type: 'done.invoke.initialize-collection-run'; data: { id: number } }
        | { type: 'done.invoke.process-request'; data: { requests: object[] } }
        | { type: 'done.invoke.run-request'; data: object },
      services: {} as {
        queryRequests: {
          data: { requests: object[] }
        },
        createCollectionRun: {
          data: { id: number }
        }
      }
    },
    context: { collectionId: undefined, requestList: undefined, responses: [], currentResponse: undefined },
    id: 'collectionRunner',
    initial: 'idle',
    states: { 
      idle: {
        on: {
          QUERY: {
            target: 'queryingRequests',
            actions: 'assignCollectionId'
          },
        },
      },
      queryingRequests: {
        invoke: {
          id: 'query-requests',
          src: 'queryRequests',
          onDone: [{
            target: 'queryingSNSTopicArn',
            cond: { type: 'requestListExists' },
            actions: 'assignRequestList'
          },
          {
            target: 'failed',
            actions: log(() => `Request list query unsuccessful.`)
          }],
          onError: {
            target: 'failed'
          }
        },
      },
      queryingSNSTopicArn: {
        invoke: {
          id: 'query-SNSTopicArn',
          src: 'querySNSTopicArn',
          onDone: [{
            target: 'initializing',
            // cond: { type: 'SNSTopicExists' },
            actions: ['assignSNSTopicArn', 'assignWebhookUrl']
          },
          // change this error handling so it's okay if monitor doesn't have SNS topic
          {
            target: 'failed',
            actions: log(() => `Request list query unsuccessful.`)
          }],
          onError: {
            target: 'failed'
          }
        },
      },
      initializing: {
        invoke: {
          id: 'initialize-collection-run',
          src: 'createCollectionRun',
          onDone: {
            target: 'running',
            actions: 'assignCollectionRunId'
          },
          onError: {
            target: 'failed'
          }
        }
      },
      running: {
        initial: 'processing',
        states: {
          processing: {
            invoke: {
              id: 'process-request',
              src: requestProcessorMachine,
              data: {
                request: (context, _event) => context.requestList[0],
                responses: (context, _event) => context.responses
              },
              onDone: {
                target: 'requesting',
                actions: 'assignProcessedRequestToList'
              },
              onError: {
                target: '#collectionRunner.failed',
                actions: log((context, event) => `Collection Run Error: ${event.data.message}}`)
              }
            },
          },
          requesting: {
            invoke: {
              id: 'run-request',
              src: requestRunnerMachine,
              data: {
                request: (context, _event) => context.requestList[0],
                collectionRunId: (context, _event) => context.collectionRunId
              },
              onDone: {
                target: '#collectionRunner.running.asserting',
                actions: [
                  'assignCurrentResponse',
                  'assignResponses',
                ]
              },
              onError: {
                target: '#collectionRunner.failed',
                actions: log((context, event) => `Collection Run Error: ${event.data.message}`)
              }
            }
          },
          asserting: {
            invoke: {
              id: 'run-assertions',
              src: assertionRunnerMachine,
              data: {
                response: (context, _event) => context.currentResponse
              },
              onDone: [{
                target: '#collectionRunner.running.processing',
                cond: { type: 'listNotEmpty' },
                actions: 'assignRemoveCompletedRequestFromList'
              },
              {
                target: '#collectionRunner.complete'
              }],
              onError: {
                target: '#collectionRunner.failed',
                actions: log((context, event) => `Collection Run Error: ${event.data.message}}`)
              }
            }
          }
        },
      },
      complete: {
        type: 'final',
      },
      failed: {
        invoke: {
          id: 'publish-alert-message',
          src: 'publishTopicMessage',
          onDone: {
            target: 'complete',
          },
        }
      },
    },
  },
    {
      actions: {
        'assignCollectionId': assign({
          collectionId: (_context, event) => event.data['collectionId'],
        }),
        'assignRequestList': assign({
          requestList: (_context, event) => event.data['requests']
        }),
        'assignSNSTopicArn': assign({
          snsTopicArn: (_context, event) => event.data['snsTopicArn']
        }),
        'assignWebhookUrl': assign({
          webhookUrl: (_context, event) => event.data['webhookUrl']
        }),
        'assignCollectionRunId': assign({
          collectionRunId: (_context, event) => event.data['id']
        }),
        'assignProcessedRequestToList': assign({
          requestList: (context, event) => {
            context.requestList[0] = event.data
            return context.requestList
          }
        }),
        'assignResponses': assign({
          responses: (context, event) => context.responses.concat(event.data)
        }),
        'assignRemoveCompletedRequestFromList': assign({
          requestList: (context, _event) => context.requestList.slice(1)
        }),
        'assignCurrentResponse': assign({
          currentResponse: (_context, event) => event.data
        }),
      },
      delays: {
        // no delays here
      },
      guards: {
        listNotEmpty,
        requestListExists,
        // SNSTopicExists,
      },
      services: {
        queryRequests: (context, _event) => invokeQueryRequests(context.collectionId),
        querySNSTopicArn: (context, _event) => invokeQuerySNSTopicArn(context.collectionId),
        createCollectionRun: (context, _event) => invokeCreateCollectionRun(context.collectionId),
        publishTopicMessage: (context, _event) => publishMessage(context.snsTopicArn, context.collectionId, context.webhookUrl),
      }
    })