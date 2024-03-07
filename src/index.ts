import { ApiPromise } from "@polkadot/api"
import { connect } from "./network";

export class TrueApi {
  public api: ApiPromise;

  constructor(api: ApiPromise) {
    this.api = api;
  }

  async close(): Promise<void> {
    await this.api.disconnect();
  }

  static async create(): Promise<TrueApi> {
    const api = await connect();

    return new TrueApi(api);
  }

  // Abstracted extrinsics of the pallets.
  
}