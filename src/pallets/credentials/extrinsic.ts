import { ApiPromise } from "@polkadot/api";
import { CREDENTIALS_PALLET_NAME } from "./state";

import { KeyringPair } from '@polkadot/keyring/types';
import { SchemaObject, schemaObjectToRaw } from "./types";
import { getIssuer } from "../issuer/state";
import { toHexString } from "../../utils/hashing";

export const createSchema = async (api: ApiPromise, account: KeyringPair, issuerId: string, schema: SchemaObject): Promise<number> => {
  // Check if issuer exists or not.
  // Check if you are the owner, then skip the method.
  const issuerHash = `0x${issuerId}`
  const issuer = await getIssuer(api, issuerHash)

  if (!issuer) {
    throw Error("Issuer does not exists.")
  }

  // Check if the user is a controller.
  if (!issuer.controllers.includes(account.address)) {
    throw Error("Cannot create schema, account is not a controller.")
  }

  return await new Promise<number>((resolve, reject) => {
    api.tx[CREDENTIALS_PALLET_NAME]
      .createSchema(issuerHash, schemaObjectToRaw(schema))
      .signAndSend(account, (result) => {
        let schemaId: number = -1
        result.events.forEach(({ event: { method, data } }) => {
          if (method == 'SchemaCreated') {
            const jsonData = data.toJSON() as any
            if (jsonData) {
              schemaId = jsonData[0]
            }
          }
          if (method == 'ExtrinsicFailed') {
            reject('Transaction failed, error creating user.');
          }
        });

        if (result.status.isFinalized) {
          console.log(`Transaction finalized at blockHash ${result.status.asFinalized}`);
          if (schemaId == -1) throw Error(`Error registering the schema, tx: ${result.status.asFinalized}`)
          resolve(schemaId);
        }
      });
  });
}


export const attest = async (api: ApiPromise, account: KeyringPair, issuerId: string, schemaId: number, attestedTo: string, attestation: any[]): Promise<void> => {
  // Check if issuer exists or not.
  // Check if you are the owner, then skip the method.
  const issuerHash = `0x${issuerId}`
  const issuer = await getIssuer(api, issuerHash)

  if (!issuer) {
    throw Error("Issuer does not exists.")
  }

  // Check if the user is a controller.
  if (!issuer.controllers.includes(account.address)) {
    throw Error("Cannot create schema, account is not a controller.")
  }

  const values = attestation.map((i) => toHexString(i))

  return await new Promise<void>((resolve, reject) => {
    api.tx[CREDENTIALS_PALLET_NAME]
      .attest(issuerHash, schemaId, attestedTo, values)
      .signAndSend(account, (result) => {
        result.events.forEach(({ event: { method } }) => {
          if (method == 'AttestationCreated') {
            resolve()
          }
          if (method == 'ExtrinsicFailed') {
            reject(`Transaction failed, error attesting on-chain for the user. \ntx: ${result.status.hash}`);
          }
        });

        if (result.status.isFinalized) {
          console.log(`Transaction finalized at blockHash ${result.status.asFinalized}`);
        }
      });
  });
}
