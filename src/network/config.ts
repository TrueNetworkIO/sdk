export type NetworkConfig = {
  name: string,
  unit: string,
  rpc: string,
  denomination: number
}

export const testnet: NetworkConfig = {
  name: 'raman network',
  unit: 'TRUE',
  rpc: 'raman.truenetwork.io/ws',
  denomination: 10
}

export const localnet: NetworkConfig = {
  name: 'testnet',
  unit: 'TRUE',
  rpc: '127.0.0.1:9944',
  denomination: 10
}
