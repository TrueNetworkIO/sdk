import { NetworkConfig } from "../utils"

export const testnet: NetworkConfig = {
  name: 'raman network',
  unit: 'TRUE',
  rpc: 'wss://raman.truenetwork.io/ws',
  denomination: 10
}

export const localnet: NetworkConfig = {
  name: 'testnet',
  unit: 'TRUE',
  rpc: 'ws://127.0.0.1:9944',
  denomination: 10
}

export const prismUrl = 'https://prism.truenetwork.io'
