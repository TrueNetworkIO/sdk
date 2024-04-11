
import { decodeAddress, encodeAddress, isAddress } from '@polkadot/util-crypto'

export const toTrueNetworkAddress = (address?: string) => {
  if (!address || !isAddress(address)) throw Error(`Not a valid address, passing: ${address}`)

  return encodeAddress(decodeAddress(address), 7)
}

export const checkAndConvertAddresses = (addresses: string[]) => addresses.map(i => toTrueNetworkAddress(i))