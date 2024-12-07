import { bytesToBlakeTwo256Hash, decodeBytesToNumber, numberToUint8Array, toLittleEndianHex } from "../utils/hashing";
import { checkIfSchemaExist, getAttestationForSchema } from "../pallets/credentials/state";
import { createAttestation, createAttestationTx, createSchema, createSchemaTx } from "../pallets/credentials/extrinsic";
import { TrueApi } from "..";

type PrimitiveType = string | number | boolean | bigint;

abstract class SchemaType<T extends PrimitiveType> {
  abstract sizeInBytes: number;
  abstract id: number;

  abstract isValid(v: T): boolean;
  abstract serialize(v: T): string;

  abstract deserialize(v: string): T;
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
  deserialize(v: string): number { return parseInt(v, 16); }
}

class I8Type extends SchemaType<number> {
  sizeInBytes = 1;
  id = 2;
  isValid(v: number): boolean { return Number.isInteger(v) && v >= -128 && v <= 127; }
  serialize(v: number): string { return toLittleEndianHex(v & 0xFF, this.sizeInBytes); }
  deserialize(v: string): number {
    let num = parseInt(v, 16);
    return num > 127 ? num - 256 : num;
  }
}

class U16Type extends SchemaType<number> {
  sizeInBytes = 2;
  id = 3;
  isValid(v: number): boolean { return Number.isInteger(v) && v >= 0 && v <= 65535; }
  serialize(v: number): string { return toLittleEndianHex(v, this.sizeInBytes); }
  deserialize(v: string): number { return parseInt(v, 16); }
}

class I16Type extends SchemaType<number> {
  sizeInBytes = 2;
  id = 4;
  isValid(v: number): boolean { return Number.isInteger(v) && v >= -32768 && v <= 32767; }
  serialize(v: number): string { return toLittleEndianHex(v & 0xFFFF, this.sizeInBytes); }
  deserialize(v: string): number {
    let num = parseInt(v, 16);
    return num > 32767 ? num - 65536 : num;
  }
}

class U32Type extends SchemaType<number> {
  sizeInBytes = 4;
  id = 5;
  isValid(v: number): boolean { return Number.isInteger(v) && v >= 0 && v <= 4294967295; }
  serialize(v: number): string { return toLittleEndianHex(v, this.sizeInBytes); }
  deserialize(v: string): number { return parseInt(v, 16); }
}

class I32Type extends SchemaType<number> {
  sizeInBytes = 4;
  id = 6;
  isValid(v: number): boolean { return Number.isInteger(v) && v >= -2147483648 && v <= 2147483647; }
  serialize(v: number): string { return toLittleEndianHex(v >>> 0, this.sizeInBytes); }
  deserialize(v: string): number {
    let num = parseInt(v, 16);
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
  deserialize(v: string): bigint { return BigInt(`${v}`); }
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
    const num = BigInt(`${v}`);
    return num > BigInt("9223372036854775807") ? num - BigInt("18446744073709551616") : num;
  }
}

class F32Type extends SchemaType<number> {
  sizeInBytes = 4;
  id = 9;
  isValid(v: number): boolean { return !isNaN(v) && Math.fround(v) === v; }
  serialize(v: number): string {
    const buffer = new ArrayBuffer(4);
    new Float32Array(buffer)[0] = v;
    return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).reverse().join('');
  }
  deserialize(v: string): number {
    const buffer = new ArrayBuffer(4);
    const view = new DataView(buffer);
    view.setUint32(0, parseInt(v, 16), true);
    return new Float32Array(buffer)[0];
  }
}

class F64Type extends SchemaType<number> {
  sizeInBytes = 8;
  id = 10;
  isValid(v: number): boolean { return !isNaN(v) && Number.isFinite(v); }
  serialize(v: number): string {
    const buffer = new ArrayBuffer(8);
    new Float64Array(buffer)[0] = v;
    return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).reverse().join('');
  }
  deserialize(v: string): number {
    const buffer = new ArrayBuffer(8);
    const view = new DataView(buffer);
    view.setBigUint64(0, BigInt(`${v}`), true);
    return new Float64Array(buffer)[0];
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
      api.network, {
      "Ethereum": address
    },
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
  public async attest(api: TrueApi, user: string, attestation: { [K in keyof T]: T[K] extends SchemaType<infer V> ? V : never }) {
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

    return await createAttestation(api.network, api.account, api.issuerHash, this, user, values);
  }
}
