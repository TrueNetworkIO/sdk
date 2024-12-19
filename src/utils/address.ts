
import { decodeAddress, encodeAddress, isAddress } from '@polkadot/util-crypto'

export const toTrueNetworkAddress = (address?: string) => {
  if (!address || !isAddress(address)) throw Error(`Not a valid address, passing: ${address}`)

  return encodeAddress(decodeAddress(address), 7)
}

export const checkAndConvertAddresses = (addresses: string[]) => addresses.map(i => toTrueNetworkAddress(i))

type WalletAddressType = {
  "Unknown": string;
} | {
  "Ethereum": string;
} | {
  "Solana": string;
} | {
  "Substrate": string;
};

export const getWalletWithType = (address: string): WalletAddressType => {
  // Check if address is empty or not a string
  if (!address || typeof address !== 'string') {
    return {"Unknown": address};
  }

  // Ethereum: 42 chars, starts with 0x, contains hex chars
  const ethereumRegex = /^0x[a-fA-F0-9]{40}$/;
  if (ethereumRegex.test(address)) {
    return { "Ethereum": address };
  }

  // Solana: 32-44 chars, Base58 characters
  const solanaRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  if (solanaRegex.test(address)) {
    return {"Solana": address};
  }

  // Substrate: 47-48 chars, typically starts with specific numbers
  // This is a simplified check - could be enhanced for specific networks
  const substrateRegex = /^[1-9A-HJ-NP-Za-km-z]{47,48}$/;
  if (substrateRegex.test(address)) {
    return {"Substrate": address};
  }

  return {"Unknown": address};
}