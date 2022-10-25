import { interpret } from 'xstate';
import { waitFor } from 'xstate/lib/waitFor.js';
import cors from 'cors'

import { collectionRunnerMachine } from './entities/collectionRunnerMachine.js';
import express from 'express'
const app = express()
app.use(cors())
const PORT = 3003

app.get('/:id', async (req, res) => {
  const collectionId = Number(req.params.id)

  const collectionRunnerService = interpret(collectionRunnerMachine)
    .onTransition(state => console.log(state.value, state.context)) // FOR LOGGING

  collectionRunnerService.start()
  collectionRunnerService.send({ type: 'QUERY', collectionId: collectionId })
  await waitFor(collectionRunnerService, (state) => state.matches('complete'))
  collectionRunnerService.stop()

  res.header('Access-Control-Allow-Origin', '*');
  res.sendStatus(200)
})

app.listen(PORT, () => {
  console.log(`Test runner running on port ${PORT}`)
})