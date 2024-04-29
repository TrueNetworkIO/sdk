import { ApiPromise, Keyring } from "@polkadot/api"
import { KeyringPair } from '@polkadot/keyring/types'
import { NetworkConfig, connect } from "./network";
import { createIssuer } from "./pallets/issuer/extrinsic";
import { checkAndConvertAddresses } from "./utils/address";

// Create a keyring instance
const keyring = new Keyring({ type: 'sr25519' });
keyring.setSS58Format(7);

export class TrueApi {
  public network: ApiPromise;
  public account: KeyringPair;

  public issuerHash: string | undefined;

  constructor(api: ApiPromise, accountKey: string, issuerHash?: string) {
    this.network = api;

    this.account = keyring.addFromUri(accountKey)

    if (issuerHash)
      this.issuerHash = issuerHash;
  }

  async close(): Promise<void> {
    await this.network.disconnect();
  }

  static async create(accountKey: string, nodeUrl?: NetworkConfig): Promise<TrueApi> {
    const api = await connect(nodeUrl);

    return new TrueApi(api, accountKey);
  }

  public async setIssuer(hash: string) {
    this.issuerHash = hash;
  }

  // Abstracted extrinsics of the pallets.
  public async registerIssuer(name: string, controllers: string[]) {
    const trueAddresses = checkAndConvertAddresses(controllers)

    const issuer = await createIssuer(this.network, this.account, name, trueAddresses)
    this.issuerHash = issuer;
    return issuer;
  }

}

export * from './schemas'
export * from './utils'
export * from './network'
