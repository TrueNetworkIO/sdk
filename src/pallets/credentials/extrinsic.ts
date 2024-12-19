import { ApiPromise } from "@polkadot/api";
import { CREDENTIALS_PALLET_NAME } from "./state";

import { KeyringPair } from '@polkadot/keyring/types';
import { getIssuer } from "../issuer/state";
import { Schema } from "../../schemas";
import { prismUrl } from "../../network";

type AttestationResponseType = {
  attestationId: number,
  prismUrl: string,
  transaction: {
    hash: string,
    explorerUrl: string,
    events: any[]
  }
}

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
            reject(Error('Transaction failed, error creating user.'));
          }
        });

        if (result.status.isInBlock) {
          console.log(`Transaction finalized at blockHash ${result.status.asInBlock}`);
          if (!schemaHash) throw Error(`Error registering the schema, tx: ${result.status.asInBlock}`)
          resolve(`${result.status.asInBlock}`);
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

export const createAttestation = async (api: ApiPromise, account: KeyringPair, issuerHash: string, schema: Schema<any>, attestedTo: string, values: string[]): Promise<AttestationResponseType> => {
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

  return await new Promise<AttestationResponseType>((resolve, reject) => {
    api.tx[CREDENTIALS_PALLET_NAME]
      .attest(issuerHash, schema.getSchemaHash(), attestedTo, values)
      .signAndSend(account, (result) => {
        if (result.dispatchError) {
          if (result.dispatchError.isModule) {
            // for module errors, we have the section indexed, lookup
            const decoded = api.registry.findMetaError(result.dispatchError.asModule);
            const { docs, name, section } = decoded;

            console.log(`Dispatch Error: ${section}.${name}: ${docs.join(' ')}`);
            reject(Error(`Dispatch Error: ${section}.${name}: ${docs.join(' ')}`));
            
          } else {
            // Other, CannotLookup, BadOrigin, no extra info
            console.log('Extras: ', result.dispatchError.toString());
          }
        }

        let attestationId: number = -1
        if (result.status.isInBlock) {
          result.events.forEach(({ event: { method, data } }: { event: any }) => {
            if (method == 'AttestationCreated') {
              console.log('Attestation Created: InBlock')
              const jsonData = data.toJSON()
              if (jsonData) {
                attestationId = jsonData[3]
              }
            }
            if (method == 'ExtrinsicFailed') {
              reject(Error(`Transaction failed, error attesting on-chain for the user. \ntx: ${result.status.hash}`));
            }
          });

          console.log(`Transaction finalized at blockHash ${result.status.asInBlock}`);

          resolve({
            attestationId,
            prismUrl: `${prismUrl}/query/${result.status.hash.toString()}`,
            transaction: {
              hash: result.status.asInBlock.toString(),
              explorerUrl: `https://polkadot.js.org/apps/?rpc=wss%3A%2F%2Framan.truenetwork.io%2Fws#/explorer/query/${result.status.hash.toString()}`,
              events: result.events
            }
          })
        }
      });
  });
}

export const updateAttestation = async (api: ApiPromise, account: KeyringPair, issuerHash: string, schema: Schema<any>, attestedTo: string, attestationId: number, newValues: string[]): Promise<AttestationResponseType> => {
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

  return await new Promise<AttestationResponseType>((resolve, reject) => {
    api.tx[CREDENTIALS_PALLET_NAME]
      .attest(issuerHash, schema.getSchemaHash(), attestedTo, attestationId, newValues)
      .signAndSend(account, (result) => {
        if (result.dispatchError) {
          if (result.dispatchError.isModule) {
            // for module errors, we have the section indexed, lookup
            const decoded = api.registry.findMetaError(result.dispatchError.asModule);
            const { docs, name, section } = decoded;

            console.log(`Dispatch Error: ${section}.${name}: ${docs.join(' ')}`);
            reject(Error(`Dispatch Error: ${section}.${name}: ${docs.join(' ')}`));
            
          } else {
            // Other, CannotLookup, BadOrigin, no extra info
            console.log('Extras: ', result.dispatchError.toString());
          }
        }

        let attestationId: number = -1
        if (result.status.isInBlock) {
          result.events.forEach(({ event: { method, data } }: { event: any }) => {
            if (method == 'AttestationCreated') {
              console.log('Attestation Created: InBlock')
              const jsonData = data.toJSON()
              if (jsonData) {
                attestationId = jsonData[3]
              }
            }
            if (method == 'ExtrinsicFailed') {
              reject(Error(`Transaction failed, error attesting on-chain for the user. \ntx: ${result.status.hash}`));
            }
          });

          console.log(`Transaction finalized at blockHash ${result.status.asInBlock}`);

          resolve({
            attestationId,
            prismUrl: `${prismUrl}/query/${result.status.hash.toString()}`,
            transaction: {
              hash: result.status.asInBlock.toString(),
              explorerUrl: `https://polkadot.js.org/apps/?rpc=wss%3A%2F%2Framan.truenetwork.io%2Fws#/explorer/query/${result.status.hash.toString()}`,
              events: result.events
            }
          })
        }
      });
  });
}
