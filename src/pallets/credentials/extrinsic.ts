import { ApiPromise } from "@polkadot/api";
import { CREDENTIALS_PALLET_NAME } from "./state";

import { KeyringPair } from '@polkadot/keyring/types';
import { getIssuer } from "../issuer/state";
import { Schema } from "../../schemas";

export const createSchemaTx = async (api: ApiPromise, account: KeyringPair, issuerHash: string, schema: Schema<any>) => {
  // Check if issuer exists or not.
  // Check if you are the owner, then skip the method.
  const issuer = await getIssuer(api, issuerHash)

  if (!issuer) {
    throw Error("Issuer does not exists.")
  }

  // Check if the user is a controller.
  if (!issuer.controllers.includes(account.address)) {
    throw Error("Cannot create schema, account is not a controller.")
  }

  return api.tx[CREDENTIALS_PALLET_NAME]
    .createSchema(issuerHash, schema.getSchemaObject())
}

export const createSchema = async (api: ApiPromise, account: KeyringPair, issuerHash: string, schema: Schema<any>): Promise<string> => {
  // Check if issuer exists or not.
  // Check if you are the owner, then skip the method.
  const issuer = await getIssuer(api, issuerHash)

  if (!issuer) {
    throw Error("Issuer does not exists.")
  }

  // Check if the user is a controller.
  if (!issuer.controllers.includes(account.address)) {
    throw Error("Cannot create schema, account is not a controller.")
  }

  return await new Promise<string>((resolve, reject) => {
    api.tx[CREDENTIALS_PALLET_NAME]
      .createSchema(issuerHash, schema.getSchemaObject())
      .signAndSend(account, (result) => {
        let schemaHash: string | undefined
        result.events.forEach(({ event: { method, data } }) => {
          if (method == 'SchemaCreated') {
            const jsonData = data.toJSON() as any
            if (jsonData) {
              schemaHash = jsonData[0]
            }
          }
          if (method == 'ExtrinsicFailed') {
            reject('Transaction failed, error creating user.');
          }
        });

        if (result.status.isFinalized) {
          console.log(`Transaction finalized at blockHash ${result.status.asFinalized}`);
          if (!schemaHash) throw Error(`Error registering the schema, tx: ${result.status.asFinalized}`)
          resolve(`${result.status.asFinalized}`);
        }
      });
  });
}


export const createAttestationTx = async (api: ApiPromise, account: KeyringPair, issuerHash: string, schema: Schema<any>, attestedTo: string, values: string[]) => {
  // Check if issuer exists or not.
  // Check if you are the owner, then skip the method.
  const issuer = await getIssuer(api, issuerHash)

  if (!issuer) {
    throw Error("Issuer does not exists.")
  }

  // Check if the user is a controller.
  if (!issuer.controllers.includes(account.address)) {
    throw Error("Cannot create attestation, account is not a controller.")
  }

  return api.tx[CREDENTIALS_PALLET_NAME]
    .attest(issuerHash, schema.getSchemaHash(), attestedTo, values)
}

export const createAttestation = async (api: ApiPromise, account: KeyringPair, issuerHash: string, schema: Schema<any>, attestedTo: string, values: string[]): Promise<string> => {
  // Check if issuer exists or not.
  // Check if you are the owner, then skip the method.
  const issuer = await getIssuer(api, issuerHash)

  if (!issuer) {
    throw Error("Issuer does not exists.")
  }

  // Check if the user is a controller.
  if (!issuer.controllers.includes(account.address)) {
    throw Error("Cannot create attestation, account is not a controller.")
  }

  return await new Promise<string>((resolve, reject) => {
    api.tx[CREDENTIALS_PALLET_NAME]
      .attest(issuerHash, schema.getSchemaHash(), attestedTo, values)
      .signAndSend(account, (result) => {
        result.events.forEach(({ event: { method } }) => {
          if (method == 'AttestationCreated') {
            console.log('Attestation Created: InBlock')
          }
          if (method == 'ExtrinsicFailed') {
            reject(`Transaction failed, error attesting on-chain for the user. \ntx: ${result.status.hash}`);
          }
        });

        if (result.status.isFinalized) {
          console.log(`Transaction finalized at blockHash ${result.status.asFinalized}`);
          resolve(`${result.status.asFinalized}`)
        }
      });
  });
}
