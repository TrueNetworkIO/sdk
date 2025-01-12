import { bytesToBlakeTwo256Hash, decodeBytesToNumber, numberToUint8Array, toLittleEndianHex } from "../utils/hashing";
import { checkIfSchemaExist, getAttestationForSchema } from "../pallets/credentials/state";
import { AttestationResponseType, createAttestation, createAttestationTx, createSchema, createSchemaTx, updateAttestation } from "../pallets/credentials/extrinsic";
import { prismUrl, TrueApi } from "..";

type PrimitiveType = string | number | boolean | bigint;

abstract class SchemaType<T extends PrimitiveType> {
  abstract sizeInBytes: number;
  abstract id: number;

  abstract isValid(v: T): boolean;
  abstract serialize(v: T): string;

  abstract deserialize(v: string): T;

  protected hexToLittleEndianNumber(hex: string): number {
    // Remove '0x' prefix if present
    hex = hex.replace('0x', '');

    // Ensure the hex string has the correct length
    while (hex.length < this.sizeInBytes * 2) {
      hex = hex + '0';
    }

    // Convert to little-endian
    const bytes = [];
    for (let i = 0; i < hex.length; i += 2) {
      bytes.push(parseInt(hex.substr(i, 2), 16));
    }

    // Create a DataView to handle the conversion
    const buffer = new ArrayBuffer(this.sizeInBytes);
    const view = new DataView(buffer);

    // Set bytes in little-endian order
    bytes.forEach((byte, index) => {
      view.setUint8(index, byte);
    });

    // Read the value based on size
    switch (this.sizeInBytes) {
      case 1: return view.getUint8(0);
      case 2: return view.getUint16(0, true);
      case 4: return view.getUint32(0, true);
      default: return view.getUint32(0, true);
    }
  }

  protected hexToLittleEndianBigInt(hex: string): bigint {
    // Remove '0x' prefix if present
    hex = hex.replace('0x', '');

    // Ensure the hex string has the correct length
    while (hex.length < this.sizeInBytes * 2) {
      hex = hex + '0';
    }

    // Convert to little-endian
    const bytes = [];
    for (let i = 0; i < hex.length; i += 2) {
      bytes.push(parseInt(hex.substr(i, 2), 16));
    }

    // Create a DataView to handle the conversion
    const buffer = new ArrayBuffer(this.sizeInBytes);
    const view = new DataView(buffer);

    // Set bytes in little-endian order
    bytes.forEach((byte, index) => {
      view.setUint8(index, byte);
    });

    return view.getBigUint64(0, true);
  }
}

class CharType extends SchemaType<string> {
  sizeInBytes = 1;
  id = 0;
  isValid(v: string): boolean { return v.length === 1; }
  serialize(v: string): string { return toLittleEndianHex(v.charCodeAt(0), this.sizeInBytes); }
  deserialize(v: string): string { return String.fromCharCode(parseInt(v, 16)); }
}

class U8Type extends SchemaType<number> {
  sizeInBytes = 1;
  id = 1;
  isValid(v: number): boolean { return Number.isInteger(v) && v >= 0 && v <= 255; }
  serialize(v: number): string { return toLittleEndianHex(v, this.sizeInBytes); }
  deserialize(v: string): number { return this.hexToLittleEndianNumber(v); }
}

class I8Type extends SchemaType<number> {
  sizeInBytes = 1;
  id = 2;
  isValid(v: number): boolean { return Number.isInteger(v) && v >= -128 && v <= 127; }
  serialize(v: number): string { return toLittleEndianHex(v & 0xFF, this.sizeInBytes); }
  deserialize(v: string): number {
    const num = this.hexToLittleEndianNumber(v);
    return num > 127 ? num - 256 : num;
  }
}

class U16Type extends SchemaType<number> {
  sizeInBytes = 2;
  id = 3;
  isValid(v: number): boolean { return Number.isInteger(v) && v >= 0 && v <= 65535; }
  serialize(v: number): string { return toLittleEndianHex(v, this.sizeInBytes); }
  deserialize(v: string): number { return this.hexToLittleEndianNumber(v); }
}

class I16Type extends SchemaType<number> {
  sizeInBytes = 2;
  id = 4;
  isValid(v: number): boolean { return Number.isInteger(v) && v >= -32768 && v <= 32767; }
  serialize(v: number): string { return toLittleEndianHex(v & 0xFFFF, this.sizeInBytes); }
  deserialize(v: string): number {
    const num = this.hexToLittleEndianNumber(v);
    return num > 32767 ? num - 65536 : num;
  }
}

class U32Type extends SchemaType<number> {
  sizeInBytes = 4;
  id = 5;
  isValid(v: number): boolean { return Number.isInteger(v) && v >= 0 && v <= 4294967295; }
  serialize(v: number): string { return toLittleEndianHex(v, this.sizeInBytes); }
  deserialize(v: string): number { return this.hexToLittleEndianNumber(v); }
}

class I32Type extends SchemaType<number> {
  sizeInBytes = 4;
  id = 6;
  isValid(v: number): boolean { return Number.isInteger(v) && v >= -2147483648 && v <= 2147483647; }
  serialize(v: number): string { return toLittleEndianHex(v >>> 0, this.sizeInBytes); }
  deserialize(v: string): number {
    const num = this.hexToLittleEndianNumber(v);
    return num > 2147483647 ? num - 4294967296 : num;
  }
}

class U64Type extends SchemaType<bigint> {
  sizeInBytes = 8;
  id = 7;
  isValid(v: bigint | number): boolean {
    const bigIntValue = BigInt(v);
    return bigIntValue >= BigInt(0) && bigIntValue <= BigInt("18446744073709551615");
  }
  serialize(v: bigint | number): string { return toLittleEndianHex(BigInt(v), this.sizeInBytes); }
  deserialize(v: string): bigint {
    return this.hexToLittleEndianBigInt(v);
  }
}

class I64Type extends SchemaType<bigint> {
  sizeInBytes = 8;
  id = 8;
  isValid(v: bigint | number): boolean {
    const bigIntValue = BigInt(v);
    return bigIntValue >= BigInt("-9223372036854775808") && bigIntValue <= BigInt("9223372036854775807");
  }
  serialize(v: bigint | number): string { return toLittleEndianHex(BigInt(v) & BigInt("0xFFFFFFFFFFFFFFFF"), this.sizeInBytes); }
  deserialize(v: string): bigint {
    const num = this.hexToLittleEndianBigInt(v);
    return num > BigInt("9223372036854775807") ? num - BigInt("18446744073709551616") : num;
  }
}

class F32Type extends SchemaType<number> {
  sizeInBytes = 4;
  id = 9;
  isValid(v: number): boolean {
    if (!Number.isFinite(v)) return false;
    const min = -3.4028234663852886e+38;
    const max = 3.4028234663852886e+38;
    return v >= min && v <= max;
  }
  serialize(v: number): string {
    const buffer = new ArrayBuffer(4);
    const view = new DataView(buffer);
    view.setFloat32(0, v, true);
    return "0x" + Array.from(new Uint8Array(buffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
  deserialize(v: string): number {
    // Remove '0x' prefix if present
    v = v.replace('0x', '');

    // Ensure the hex string has the correct length
    while (v.length < this.sizeInBytes * 2) {
      v = v + '0';
    }

    const bytes = [];
    for (let i = 0; i < v.length; i += 2) {
      bytes.push(parseInt(v.substr(i, 2), 16));
    }

    const buffer = new ArrayBuffer(4);
    const view = new DataView(buffer);

    bytes.forEach((byte, index) => {
      view.setUint8(index, byte);
    });

    return view.getFloat32(0, true);
  }
}

class F64Type extends SchemaType<number> {
  sizeInBytes = 8;
  id = 10;
  isValid(v: number): boolean {
    return !isNaN(v) && Number.isFinite(v);
  }
  serialize(v: number): string {
    const buffer = new ArrayBuffer(8);
    const view = new DataView(buffer);
    view.setFloat64(0, v, true);
    return "0x" + Array.from(new Uint8Array(buffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
  deserialize(v: string): number {
    // Remove '0x' prefix if present
    v = v.replace('0x', '');

    // Ensure the hex string has the correct length
    while (v.length < this.sizeInBytes * 2) {
      v = v + '0';
    }

    const bytes = [];
    for (let i = 0; i < v.length; i += 2) {
      bytes.push(parseInt(v.substr(i, 2), 16));
    }

    const buffer = new ArrayBuffer(8);
    const view = new DataView(buffer);

    bytes.forEach((byte, index) => {
      view.setUint8(index, byte);
    });

    return view.getFloat64(0, true);
  }
}

class HashType extends SchemaType<string> {
  sizeInBytes = 32;
  id = 11;
  isValid(v: string): boolean { return /^0x[a-fA-F0-9]{64}$/.test(v); }
  serialize(v: string): string { return v.slice(2); } // Remove '0x' prefix
  deserialize(v: string): string { return `0x${v}`; }
}

class BoolType extends SchemaType<boolean> {
  sizeInBytes = 1;
  id = 12;
  isValid(v: boolean): boolean { return true; }

  serialize(v: boolean): string { return toLittleEndianHex(v ? 1 : 0, this.sizeInBytes);; }
  deserialize(v: string): boolean { return parseInt(v, 16) == 1; }
}

class StringType extends SchemaType<string> {
  sizeInBytes = 128;
  id = 13;
  isValid(v: string): boolean { return v.length < 128; }

  serialize(v: string): string { return v; }
  deserialize(v: string): string { return v; }
}

export const Char = new CharType();
export const U8 = new U8Type();
export const I8 = new I8Type();
export const U16 = new U16Type();
export const I16 = new I16Type();
export const U32 = new U32Type();
export const I32 = new I32Type();
export const U64 = new U64Type();
export const I64 = new I64Type();
export const F32 = new F32Type();
export const F64 = new F64Type();
export const Hash = new HashType();
export const Bool = new BoolType();
export const Text = new StringType();

export const stringToSchemaType = (type: string): SchemaType<any> | undefined => {
  switch (type) {
    case 'Char':
      return Char
    case 'U8':
      return U8
    case 'I8':
      return I8
    case 'U16':
      return U16
    case 'I16':
      return I16
    case 'U32':
      return U32
    case 'I32':
      return I32
    case 'U64':
      return U64
    case 'I64':
      return I64
    case 'F32':
      return F32
    case 'F64':
      return F64
    case 'Hash':
      return Hash
    case 'Bool':
      return Bool
    case 'Text':
      return Text
    default:
      return undefined
  }
}

type SchemaDefinition = Record<string, SchemaType<any>>;

export type SchemaObject = {
  [key: string]: SchemaType<any>
}

export class Schema<T extends SchemaDefinition> {
  private def: T;
  private schemaHash: string;

  // Set a default value for the Schema Object.
  constructor(def: T) {
    this.def = def;
    this.schemaHash = this.getSchemaHash();
  }

  static create<T extends SchemaDefinition>(def: T) {
    return new Schema(def);
  }

  public async getAttestations(api: TrueApi, address: string): Promise<{ [K in keyof T]: T[K] extends SchemaType<infer V> ? V : never }[]> {
    const data = await getAttestationForSchema(
      api.network, address,
      api.issuerHash!,
      this
    )

    if (!data) throw Error("Attestation doesn't not exist.")

    // Convert array data to structured schema object.
    const response: { [K in keyof T]: T[K] extends SchemaType<infer V> ? V : never }[] = [];

    const sortedEntries = Object.entries(this.def).sort((a, b) => b[0].localeCompare(a[0]));

    data.forEach((d: any, i: number) => {
      let objs: { [K in keyof T]: T[K] extends SchemaType<infer V> ? V : never } = {} as any;
      sortedEntries.forEach((entry, index) => {
        const [key, schemaType] = entry;
        const value = d[index];

        // Convert the value to string if it's a number
        const stringValue = typeof value === 'number' ? value.toString(16).padStart(schemaType.sizeInBytes * 2, '0') : value;

        if (typeof stringValue !== 'string') {
          throw new Error(`Unexpected data type for ${key}: ${typeof value}`);
        }

        objs[key as keyof T] = schemaType.deserialize(stringValue) as any;
      });

      response.push(objs)
    })

    return response;
  }

  private getSortedEntries(item: T | { [K in keyof T]: T[K] extends SchemaType<infer V> ? V : never }) {
    return Object.entries(item).sort((a, b) => b[0].localeCompare(a[0]))
  }

  public getEntries() {
    return this.getSortedEntries(this.def);
  }

  // Returns the Schema Object to pass in the polkadot js api.
  public getSchemaObject() {
    return this.getSortedEntries(this.def).map(item => [item[0], item[1].id]);
  }

  // Generate Schema Hash.
  public getSchemaHash(): string {
    const encoder = new TextEncoder();
    const bytes: Uint8Array[] = [];

    this.getSortedEntries(this.def).forEach(i => {
      const bA0 = encoder.encode(i[0]);
      const bA1 = numberToUint8Array(i[1].id);

      // Concatenate the byte arrays to the bytes array
      bytes.push(bA0);
      bytes.push(bA1);
    });

    // Calculate the total length of bytes
    const totalLength = bytes.reduce((acc, curr) => acc + curr.length, 0);

    // Create a new Uint8Array with the correct length
    const combinedBytes = new Uint8Array(totalLength);

    // Copy the concatenated byte arrays to the combinedBytes array
    let offset = 0;
    bytes.forEach(byteArray => {
      combinedBytes.set(byteArray, offset);
      offset += byteArray.length;
    });

    return `0x${bytesToBlakeTwo256Hash(combinedBytes)}`;
  }

  public async ifExistAlready(api: TrueApi): Promise<boolean> {
    return checkIfSchemaExist(api.network, this.schemaHash);
  }

  public async register(api: TrueApi) {
    if (!api.issuerHash) throw Error("Issuer Hash is not defined in TrueApi, either pass the hash in constructor or call api.registerIssuer(name: string).")

    if (await this.ifExistAlready(api)) {
      // Schema already exist.
      return this.schemaHash;
    }

    return await createSchema(api.network, api.account, api.issuerHash, this)
  }

  private validate(data: { [K in keyof T]: T[K] extends SchemaType<infer V> ? V : never }): void {
    for (const [key, value] of Object.entries(data)) {
      if (!this.def[key].isValid(value)) {
        throw new Error(`Invalid value for ${key}: ${value}`);
      }
    }
  }

  public async attest(api: TrueApi, user: string, attestation: { [K in keyof T]: T[K] extends SchemaType<infer V> ? V : never }): Promise<AttestationResponseType> {
    this.validate(attestation);

    // Check if issuer hash exists in the api.
    if (!api.issuerHash) throw Error("issuerHash property does not exist on TrueApi, try registering an issuer.")

    // Serialize the attestation values. 
    const values = this.getSortedEntries(attestation).map(([key, value]) => {
      return this.def[key].serialize(value);
    });
    // Check if schema exists, if not register & attest.
    if (!await this.ifExistAlready(api)) {
      // Do a combined transaction of register & attest on-chain.
      const schemaTx = await createSchemaTx(api.network, api.account, api.issuerHash, this)

      const attestationTx = await createAttestationTx(api.network, api.account, api.issuerHash, this, user, values);

      return new Promise<AttestationResponseType>(async (resolve, reject) => {
        await api.network.tx.utility.batch([schemaTx, attestationTx]).signAndSend(api.account, ({ status, events }) => {
          events.forEach(({ event: { method } }) => {
            if (method == 'ExtrinsicFailed') {
              reject(Error(`Transaction failed, error attesting on-chain for the users. \ntx: ${status.hash}`));
            }
          });

          let attestationId: number = -1
          if (status.isInBlock) {
            console.log(`Transaction is inBlock at blockHash ${status.asInBlock}`);

            events.forEach(({ event: { method, data } }: { event: any }) => {
              if (method == 'AttestationCreated') {
                console.log('Attestation Created: InBlock')
                const jsonData = data.toJSON()
                if (jsonData) {
                  attestationId = jsonData[3]
                }
              }
              if (method == 'ExtrinsicFailed') {
                reject(Error(`Transaction failed, error attesting on-chain for the user. \ntx: ${status.hash}`));
              }
            });

            resolve({
              attestationId,
              prismUrl: `${prismUrl}/query/${status.asInBlock.toString()}`,
              transaction: {
                hash: status.asInBlock.toString(),
                explorerUrl: `https://polkadot.js.org/apps/?rpc=wss%3A%2F%2Framan.truenetwork.io%2Fws#/explorer/query/${status.asInBlock.toString()}`,
                events: events
              }
            })

          }
        });
      });
    }

    return await createAttestation(api.network, api.account, api.issuerHash, this, user, values);
  }

  public async updateAttestation(api: TrueApi, user: string, attestationId: number, attestation: { [K in keyof T]: T[K] extends SchemaType<infer V> ? V : never }) {
    this.validate(attestation);

    // Check if issuer hash exists in the api.
    if (!api.issuerHash) throw Error("issuerHash property does not exist on TrueApi, try registering an issuer.")

    // Serialize the attestation values. 
    const values = this.getSortedEntries(attestation).map(([key, value]) => {
      return this.def[key].serialize(value);
    });
    // Check if schema exists, if not register & attest.
    if (!await this.ifExistAlready(api)) {
      // Do a combined transaction of register & attest on-chain.
      const schemaTx = await createSchemaTx(api.network, api.account, api.issuerHash, this)

      const attestationTx = await createAttestationTx(api.network, api.account, api.issuerHash, this, user, values);

      return new Promise<string | undefined>(async (resolve, _) => {
        await api.network.tx.utility.batch([schemaTx, attestationTx]).signAndSend(api.account, ({ status, events }) => {
          events.forEach(({ event: { method } }) => {
            if (method == 'ExtrinsicFailed') {
              throw Error(`Transaction failed, error attesting on-chain for the users. \ntx: ${status.hash}`);
            }
          });

          if (status.isInBlock) {
            console.log(`Transaction is inBlock at blockHash ${status.asInBlock}`);
            resolve(`${status.asInBlock}`);

          }
        });
      });
    }

    return await updateAttestation(api.network, api.account, api.issuerHash, this, user, attestationId, values);
  }
}
