import { ApiPromise } from "@polkadot/api";

function hexToNumber(hexString: string): number {
  const cleanedString = hexString.startsWith('0x') ? hexString.slice(2) : hexString;
  return parseInt(cleanedString, 16);
}

export const getFreeBalance = async (api: ApiPromise, address: string): Promise<number> => {
  const balance = await api.query.system.account(address)

  const data = JSON.parse(balance.toString())['data']

  return typeof data.free == 'number' ? data.free : hexToNumber(data.free);
}