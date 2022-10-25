var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { interpret } from 'xstate';
import { waitFor } from 'xstate/lib/waitFor.js';
import cors from 'cors';
import { collectionRunnerMachine } from './collectionRunnerMachine.js';
import express from 'express';
const app = express();
app.use(cors());
const PORT = 3003;
app.get('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const collectionId = Number(req.params.id);
    const collectionRunnerService = interpret(collectionRunnerMachine)
        .onTransition(state => console.log(state.value, state.context)); // FOR LOGGING
    collectionRunnerService.start();
    collectionRunnerService.send({ type: 'QUERY', collectionId });
    yield waitFor(collectionRunnerService, (state) => state.matches('complete'));
    collectionRunnerService.stop();
    res.header("Access-Control-Allow-Origin", "*");
    res.sendStatus(200);
}));
app.listen(PORT, () => {
    console.log(`Test runner running on port ${PORT}`);
});
//# sourceMappingURL=index.js.map