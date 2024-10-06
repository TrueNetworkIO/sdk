import { ApiPromise } from "@polkadot/api";
import { ISSUER_PALLET_NAME, getIssuer } from "./state";
import { stringToBlakeTwo256Hash } from "../../utils/hashing";

import { KeyringPair } from '@polkadot/keyring/types';

export const createIssuer = async (api: ApiPromise, account: KeyringPair, name: string, controllers: string[]): Promise<string> => {
  // Check if already exists.
  // Check if you are the owner, then skip the method.
  const hash = stringToBlakeTwo256Hash(name)

  const checkIfExists = await getIssuer(api, `0x${hash}`)

  if (checkIfExists) {
    throw Error("Issuer already exists.")
  }

  return await new Promise<string>((resolve, reject) => {
    api.tx[ISSUER_PALLET_NAME]
      .createIssuer(name, controllers)
      .signAndSend(account, (result) => {
        result.events.forEach(({ event: { method } }) => {
          if (method == 'ExtrinsicFailed') {
            reject('Transaction failed, error creating user.');
          }
        });

        if (result.status.isInBlock) {
          console.log(`Transaction finalized at blockHash ${result.status.asInBlock}`);
          resolve(`0x${hash}`);
        }
      });
  });
}


export const editIssuer = async (api: ApiPromise, account: KeyringPair, hashId: string, name: string, controllers: string[]): Promise<string> => {
  // Check if already exists.
  // Check if you are the owner, then skip the method.
  const newHash = stringToBlakeTwo256Hash(name)

  const checkIfNewNameAvailable = await getIssuer(api, `0x${newHash}`)

  const checkIfExists = await getIssuer(api, `0x${hashId}`)

  if (!checkIfExists) {
    throw Error("Issuer does not exist.")
  }

  if (checkIfNewNameAvailable) {
    throw Error("New name for issuer is not available.")
  }

  return await new Promise<string>((resolve, reject) => {
    api.tx[ISSUER_PALLET_NAME]
      .editIssuer(`0x${hashId}`, name, controllers)
      .signAndSend(account, (result) => {
        result.events.forEach(({ event: { method } }) => {
          if (method == 'ExtrinsicFailed') {
            reject('Transaction failed, error creating user.');
          }
        });

        if (result.status.isInBlock) {
          console.log(`Transaction finalized at blockHash ${result.status.asInBlock}`);
          resolve(`0x${newHash}`);
        }
      });
  });
}
