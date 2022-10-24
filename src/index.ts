import { interpret } from 'xstate';
import { waitFor } from 'xstate/lib/waitFor.js';

import { collectionRunnerMachine } from './collectionRunnerMachine.js';
import express from 'express'
const app = express()
const PORT = 3003

app.get('/:id', async (req, res) => {
  const collectionId = Number(req.params.id)
  const collectionRunnerService = interpret(collectionRunnerMachine)
  // .onTransition(state => console.log(state.value, state.context)) // Logging
  collectionRunnerService.start()
  collectionRunnerService.send({ type: 'QUERY', collectionId })
  await waitFor(collectionRunnerService, (state) => state.matches('complete'))
  collectionRunnerService.stop()
  res.sendStatus(200)
})

app.listen(PORT, () => {
  console.log(`Test runner running on port ${PORT}`)
})