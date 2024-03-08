import * as blake from 'blakejs';

export function stringToBlakeTwo256Hash(inputString: string): string {
  // Convert string to Uint8Array
  const inputBytes = new TextEncoder().encode(inputString);

  // Compute BlakeTwo256 hash
  const hashBytes = blake.blake2b(inputBytes, undefined, 32);

  // Convert hash bytes to hexadecimal string
  const hashHex = Array.from(hashBytes)
    .map(byte => ('0' + (byte & 0xFF).toString(16)).slice(-2))
    .join('');

  return hashHex;
}

export const convertHexToString = (str: string): string => {
  return Buffer.from(str.split('0x')[1], 'hex').toString('utf8')
}
