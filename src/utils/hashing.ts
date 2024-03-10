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

export const toHexString = (input: string | number): string => {
  if (typeof input === 'number') {
    // Convert number to hexadecimal
    return `0x${input.toString(16)}`;
  } else {
    return input;
  }
}

export const convertHexToString = (str: string): string => {
  return Buffer.from(str.slice(2), 'hex').toString('utf8')
}

export const convertBytesToSerialize = (input: string): number | string => {
  // Use regular expression to check if the input string is a valid numerical value
  const isValidNumber = /^-?\d+(\.\d+)?$/.test(input);

  if (isValidNumber) {
    // Use parseFloat to convert the string to a floating-point number
    return parseInt(input);
  } else {
    // Return null if the input string is not a valid numerical value
    return input;
  }
}
