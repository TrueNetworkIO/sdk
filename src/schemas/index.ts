import { bytesToBlakeTwo256Hash, decodeBytesToNumber, numberToUint8Array, toLittleEndianHex } from "../utils/hashing";
import { checkIfSchemaExist, getAttestation } from "../pallets/credentials/state";
import { createAttestation, createAttestationTx, createSchema, createSchemaTx } from "../pallets/credentials/extrinsic";
import { TrueApi } from "..";
import { toTrueNetworkAddress } from "../utils/address";

abstract class SchemaType<T> {
  abstract sizeInBytes: number;
  abstract id: number;

  value: T;

  abstract isValid(v: T): boolean;

  constructor(v: T) {
    if (!this.isValid(v)) throw Error("Invalid value format for the schema type.");

    this.value = v;
  }

  abstract getInstance(v: T): any;
}

export class Char extends SchemaType<string> {
  sizeInBytes: number = 1;
  id = 0;

  isValid(v: string): boolean {
    return v.length == 1;
  }

  public getInstance(v: string) {
    return new Char(v);
  }
}

export class U8 extends SchemaType<number> {
  sizeInBytes: number = 1;
  id = 1;

  isValid(v: number): boolean {
    return Number.isInteger(v) && v >= 0 && v <= 255;
  }

  public getInstance(v: number) {
    return new U8(v);
  }
}

export class I8 extends SchemaType<number> {
  sizeInBytes: number = 1;
  id = 2;

  isValid(v: number): boolean {
    return Number.isInteger(v) && v >= -128 && v <= 127;
  }

  public getInstance(v: number) {
    return new I8(v);
  }
}

export class U16 extends SchemaType<number> {
  sizeInBytes: number = 2;
  id = 3;

  isValid(v: number): boolean {
    return Number.isInteger(v) && v >= 0 && v <= 65535;
  }

  public getInstance(v: number) {
    return new U16(v);
  }
}

export class I16 extends SchemaType<number> {
  sizeInBytes: number = 2;
  id = 4;

  isValid(v: number): boolean {
    return Number.isInteger(v) && v >= -32768 && v <= 32767;
  }

  public getInstance(v: number) {
    return new I16(v);
  }
}

export class U32 extends SchemaType<number> {
  sizeInBytes: number = 4;
  id = 5;

  isValid(v: number): boolean {
    return Number.isInteger(v) && v >= 0 && v <= 4294967295;
  }

  public getInstance(v: number) {
    return new U32(v);
  }
}

export class I32 extends SchemaType<number> {
  sizeInBytes: number = 4;
  id = 6;

  isValid(v: number): boolean {
    return Number.isInteger(v) && v >= -2147483648 && v <= 2147483647;
  }

  public getInstance(v: number) {
    return new I32(v);
  }
}

export class U64 extends SchemaType<number> {
  sizeInBytes: number = 8;
  id = 7;

  isValid(v: number): boolean {
    // You may need a custom check for 64-bit unsigned integers
    // as JavaScript doesn't natively support them beyond 53 bits
    return Number.isInteger(v) && v >= 0 && v <= Number.MAX_SAFE_INTEGER;
  }

  public getInstance(v: number) {
    return new U64(v);
  }
}

export class I64 extends SchemaType<bigint> {
  sizeInBytes: number = 8;
  id = 8;

  isValid(v: bigint): boolean {
    // Since JavaScript doesn't natively support 64-bit signed integers,
    // you can use BigInt for validation
    return typeof v === 'bigint';
  }

  public getInstance(v: bigint) {
    return new I64(v);
  }
}

export class F32 extends SchemaType<number> {
  sizeInBytes: number = 4;
  id = 9;

  isValid(v: number): boolean {
    // For f32, typically you would check if it's a finite number
    return Number.isFinite(v);
  }

  public getInstance(v: number) {
    return new F32(v);
  }
}

export class F64 extends SchemaType<number> {
  sizeInBytes: number = 8;
  id = 10;

  isValid(v: number): boolean {
    // For f64, typically you would check if it's a finite number
    return Number.isFinite(v);
  }

  public getInstance(v: number) {
    return new F64(v);
  }
}

export class Hash extends SchemaType<string> {
  sizeInBytes: number = 32;
  id = 11;

  isValid(v: string): boolean {
    return v.length > 0;
  }

  public getInstance(v: string) {
    return new Hash(v);
  }

  public static createFromObject(d: any): Hash {
    if (typeof d !== 'object') throw Error('Passed item is not an object in Hash.')

    const textEncoder = new TextEncoder();

    const bytes = textEncoder.encode(d)

    return new Hash(bytesToBlakeTwo256Hash(bytes));
  }
}

export type SchemaObject = {
  [key: string]: SchemaType<any>
}

export class Schema<T extends Record<string, SchemaType<any>>> {

  private def: T;
  private schemaHash: string;

  // Set a default value for the Schema Object.
  constructor(def: T) {
    this.def = def;
    this.schemaHash = this.getSchemaHash();
  }

  public async getAttestation(api: TrueApi, address: string): Promise<T> {
    const data = await getAttestation(
      api.network, address,
      this.getSchemaHash()
    )

    if (!data) throw Error("Attestation doesn't not exist.")

    // Convert array data to structured schema object.
    const response: {
      [key: string]: SchemaType<any>
    } = {}
    const encoder = new TextEncoder()

    this.getSortedEntries(this.def).map((i, index) => response[i[0]] = i[1].getInstance(decodeBytesToNumber(encoder.encode(data[index].toString()))));

    return response as any;
  }

  private getSortedEntries(item: T) {
    return Object.entries(item).sort((a, b) => b[0].localeCompare(a[0]))
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

  public async attest(api: TrueApi, user: string, attestation: T) {
    // Check if issuer hash exists in the api.
    if (!api.issuerHash) throw Error("issuerHash property does not exist on TrueApi, try registering an issuer.")

    // Serialize the attestation values. 
    const values = this.getSortedEntries(attestation).map(i => toLittleEndianHex(i[1].value, i[1].sizeInBytes));

    // Check if schema exists, if not register & attest.
    if (!await this.ifExistAlready(api)) {
      // do a combined transaction of register & attest on-chain.
      const schemaTx = await createSchemaTx(api.network, api.account, api.issuerHash, this)

      const attestationTx = await createAttestationTx(api.network, api.account, api.issuerHash, this, toTrueNetworkAddress(user), values);

      return await api.network.tx.utility.batch([schemaTx, attestationTx]).signAndSend(api.account, ({ status, events }) => {
        events.forEach(({ event: { method } }) => {
          if (method == 'AttestationCreated') {
            return status.asFinalized.toString();
          }
          if (method == 'ExtrinsicFailed') {
            throw Error(`Transaction failed, error attesting on-chain for the user. \ntx: ${status.hash}`);
          }
        });

        if (status.isFinalized) {
          console.log(`Transaction finalized at blockHash ${status.asFinalized}`);
        }
      });
    }

    await createAttestation(api.network, api.account, api.issuerHash, this, toTrueNetworkAddress(user), values);
  }
}
