import { NetworkConfig } from '../utils';
import { testnet } from './config'
import { ApiPromise, WsProvider } from '@polkadot/api';

export const connect = async (network?: NetworkConfig): Promise<ApiPromise> => {

  const rpc = network?.rpc || testnet.rpc

  const wsProvider = new WsProvider(rpc);
  const api = await ApiPromise.create({ provider: wsProvider, noInitWarn: true });

  return api
}
