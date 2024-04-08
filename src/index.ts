import { ApiPromise, Keyring } from "@polkadot/api"
import { KeyringPair } from '@polkadot/keyring/types'
import { connect } from "./network";
import { createIssuer } from "./pallets/issuer/extrinsic";

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

  static async create(accountKey: string): Promise<TrueApi> {
    const api = await connect();

    return new TrueApi(api, accountKey);
  }

  // Abstracted extrinsics of the pallets.
  public async registerIssuer(name: string, controllers: string[]) {
    const issuer = await createIssuer(this.network, this.account, name, controllers)
    this.issuerHash = issuer;
    return issuer;
  }

}

export * from './schemas'
