import { ApiPromise } from "@polkadot/api";
import { KeyringPair } from '@polkadot/keyring/types';

import { ALGORITHM_PALLET_NAME } from "./state";
import { prismUrl } from "../../network";

export const saveAlgo = async (api: ApiPromise, account: KeyringPair, schemaHashes: string[], code: number[]): Promise<number> => {

  // compile code to wasm.
  // convert wasm to bytes.
  // upload bytes to the system. 

  return await new Promise<number>((resolve, reject) => {
    api.tx[ALGORITHM_PALLET_NAME]
      .saveAlgo(schemaHashes, code, null)
      .signAndSend(account, (result) => {
        let algorithmId: number = -1
        result.events.forEach(({ event: { method, data } }) => {
          if (method == 'AlgorithmAdded') {
            const jsonData = data.toJSON() as any
            if (jsonData) {
              algorithmId = jsonData[0]
            }
          }
          if (method == 'ExtrinsicFailed') {
            reject('\nTransaction failed, error registering the algorithm.');
          }
        });

        if (result.status.isFinalized) {
          console.log(`\nTransaction finalized at blockHash ${result.status.asFinalized}`);
          console.log('\nView on prism:', `${prismUrl}/query/${result.status.asFinalized}`)
          if (algorithmId == -1) throw Error(`Error registering the schema, tx: ${result.status.asFinalized}`)
          resolve(algorithmId);
        }
      });
  });
}


export const runAlgo = async (api: ApiPromise, issuerHash: string, account: KeyringPair, userId: string, algorithmId: number): Promise<number> => {
  return await new Promise<number>((resolve, reject) => {
    api.tx[ALGORITHM_PALLET_NAME]
      .runAlgoFor(issuerHash, userId, algorithmId)
      .signAndSend(account, (result) => {

        let reputationScore: number = -1

        result.events.forEach(({ event: { method, data } }) => {
          if (method == 'AlgoResult') {
            const jsonData = data.toJSON() as any
            if (jsonData) {
              reputationScore = jsonData[0]
            }
          }
          if (method == 'ExtrinsicFailed') {
            reject(`\nTransaction failed, error attesting on-chain for the user. \ntx: ${result.status.hash}`);
          }
        });

        if (result.status.isInBlock) {
          console.log(`\nTransaction finalized at blockHash ${result.status.asInBlock}`);
          resolve(reputationScore)
        }
      });
  });
}
