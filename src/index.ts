import dotenv from 'dotenv'
import express from "express";
import { interpret } from "xstate";
import {waitFor} from 'xstate/lib/waitFor'
import { collectionRunnerMachine } from "./entities/collectionRunnerMachine";
import cors from "cors";

if (process.env.NODE_ENV !== 'production') {
  dotenv.config()
}

if (!process.env.GRAPHQL_URL) {
  console.error("no graphql url specified shutting down")
  process.exit(1)
}

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

    try {
      collectionRunnerService.start();
      collectionRunnerService.send({ type: "QUERY", data: {collectionId: collectionId}});
      await waitFor(collectionRunnerService, (state) => state.matches('complete'))
      collectionRunnerService.stop()
    } catch (e) {
      console.log(e)
    }

    res.header("Access-Control-Allow-Origin", "*");
    res.sendStatus(200);
  }
});

app.listen(PORT, () => {
  console.log(`Collection runner listening on port ${PORT}`);
});
