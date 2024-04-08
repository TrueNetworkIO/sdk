import * as blake from 'blakejs';

export function decodeBytesToNumber(bytes: Uint8Array): number {
  let value = 0;
  for (let i = 0; i < bytes.length; i++) {
    value += bytes[i] * 256 ** i;
  }
  return value;
}

export function stringToBlakeTwo256Hash(inputString: string): string {
  // Convert string to Uint8Array
  const inputBytes = new TextEncoder().encode(inputString);

  return bytesToBlakeTwo256Hash(inputBytes);
}

export function bytesToBlakeTwo256Hash(bytes: Uint8Array): string {
  const hashBytes = blake.blake2b(bytes, undefined, 32);

  const hashHex = Array.from(hashBytes).map(byte => ('0' + (byte & 0xFF).toString(16)).slice(-2)).join('');

  return hashHex;
}

export const toHexString = (input: string | number): string => {
  if (typeof input === 'number') {
    // Convert number to hexadecimal
    return `0x0${input.toString(16)}`;
  } else {
    return input;
  }
}
export function numberToUint8Array(number: number): Uint8Array {
  const buffer = new ArrayBuffer(1); // Assuming a 32-bit integer
  const view = new DataView(buffer);
  view.setUint8(0, (number)); // Little-endian byte order
  return new Uint8Array(buffer);
}

export function toLittleEndianHex(num: any, byteLength: number) {
  const hexString = num.toString(16).padStart(byteLength * 2, '0');
  const littleEndianHex = [];
  for (let i = 0; i < byteLength; i++) {
    littleEndianHex.push(hexString.substr(i * 2, 2));
  }
  return `0x${littleEndianHex.reverse().join('')}`;
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
