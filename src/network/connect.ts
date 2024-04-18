import { NetworkConfig, testnet } from './config'
import { ApiPromise, WsProvider } from '@polkadot/api';

export const connect = async (network?: NetworkConfig): Promise<ApiPromise> => {

  const rpc = network?.rpc || testnet.rpc

  const wsProvider = new WsProvider(`wss://${rpc}`);
  const api = await ApiPromise.create({ provider: wsProvider });

  return api
}
