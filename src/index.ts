import express from "express";
import { interpret } from "xstate";
import {waitFor} from 'xstate/lib/waitFor'
import { collectionRunnerMachine } from "./entities/collectionRunnerMachine.js";
import cors from "cors";

const app = express();
app.use(cors());

const PORT = 3003;

app.get('/health', (req, res) => res.json({ok: true}))

app.post("/:id", async (req, res) => {
  const collectionId = Number(req.params.id);
  if (!collectionId) {
    res.sendStatus(400);
  } else {
    const collectionRunnerService = interpret(
      collectionRunnerMachine
    ).onTransition((state) => console.log('Entering state:', state.value, state.context)); // FOR LOGGING

    collectionRunnerService.start();
    collectionRunnerService.send({ type: "QUERY", data: {collectionId: collectionId}});
    await waitFor(collectionRunnerService, (state) => state.matches('complete'))
    collectionRunnerService.stop()

    res.header("Access-Control-Allow-Origin", "*");
    res.sendStatus(200);
  }
});

app.listen(PORT, () => {
  console.log(`Collection runner listening on port ${PORT}`);
});
