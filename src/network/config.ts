export type NetworkConfig = {
  name: string,
  unit: string,
  rpc: string,
  denomination: number
}

export const testnet: NetworkConfig = {
  name: 'testnet',
  unit: 'TRUE',
  rpc: '127.0.0.1:9944',
  denomination: 10
}
