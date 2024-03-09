import { ApiPromise, Keyring } from '@polkadot/api'
import { KeyringPair } from '@polkadot/keyring/types'
import * as crypto from 'crypto'

import { connect } from '../src/network'
import { getIssuer } from '../src/pallets/issuer/state'
import { createIssuer } from '../src/pallets/issuer/extrinsic'
import { attest, createSchema } from '../src/pallets/credentials/extrinsic'
import { stringToBlakeTwo256Hash } from '../src/utils/hashing'
import { SchemaObject, SchemaTypes } from '../src/pallets/credentials/types'
import { getAttestation, getSchema } from '../src/pallets/credentials/state'

import { saveAlgo, runAlgo } from '../src/pallets/algorithms/extrinsic'
import { getAlgorithm } from '../src/pallets/algorithms/state'

const keyring = new Keyring({ type: 'sr25519' })
let api: ApiPromise;
let alice: KeyringPair;
let bob: KeyringPair;

let issuerHashId: string
let schemaId: number


beforeAll(async () => {
  api = await connect()

  alice = keyring.addFromUri("//Alice", { name: 'Alice default' })
  bob = keyring.addFromUri("//Bob", { name: 'Bob default' })

})

describe("Issuer Pallet Testing Module", () => {
  it("should estabilsh the connection correctly", async () => {
    expect(await api.genesisHash.toHex()).toBe("0xaff80faaabe00947150e3557f6add2be5261fc6dcf0e2187e694f0fde63b141a");
  })

  // Random bytes for issuer name.
  const randomBytes = crypto.randomBytes(32).toString('hex');
  const hash = stringToBlakeTwo256Hash(randomBytes)

  it('create issuer on-chain', async () => {
    const issuerId = await createIssuer(api, alice, randomBytes, [alice.address, bob.address])

    expect(issuerId).toEqual(`0x${hash}`);

    issuerHashId = hash
  })

  it('get issuer data', async () => {
    const issuer = await getIssuer(api, `0x${hash}`)
    expect(issuer).not.toBeUndefined();
    expect(issuer?.name).toEqual(randomBytes);
    expect(issuer?.controllers).toContain(bob.address);
  })

})

describe("Credentials Pallet Testing Module", () => {
  const schema: SchemaObject = [{
    key: "Number of Elements",
    type: SchemaTypes.u32
  }, {
    key: "Number of Sub Items",
    type: SchemaTypes.u64
  }, {
    key: 'Are you a legit holder?',
    type: SchemaTypes.char
  }]

  it('create schema on-chain', async () => {
    schemaId = await createSchema(api, alice, issuerHashId,
      schema)

    expect(schemaId).toBeGreaterThan(99);
  })

  it('get schema data', async () => {
    const fetchedSchema = await getSchema(api, schemaId)

    expect(fetchedSchema?.keys()).toEqual(schema.keys())
    expect(fetchedSchema?.values()).toEqual(schema.values())
  })

  it('attest credential on-chain', async () => {
    await attest(api, alice, issuerHashId,
      schemaId, bob.address, [10, 2.30, 't'])
  })

  it('fetch credential from chain', async () => {
    const d = await getAttestation(api, bob.address,
      schemaId)

    expect(d).not.toBeUndefined();
    expect(d!.length).toEqual(3);
    expect(d![0]).toEqual(10);
  })
})


function readFileAsBytes(filePath: string): number[] {
  return [0x00, 0x61, 0x73, 0x6D, 0x01, 0x00, 0x00, 0x00, 0x01, 0x05, 0x01, 0x60, 0x00, 0x01, 0x7E, 0x02,
    0x0F, 0x01, 0x03, 0x65, 0x6E, 0x76, 0x06, 0x6D, 0x65, 0x6D, 0x6F, 0x72, 0x79, 0x02, 0x00, 0x00,
    0x03, 0x02, 0x01, 0x00, 0x07, 0x08, 0x01, 0x04, 0x63, 0x61, 0x6C, 0x63, 0x00, 0x00, 0x0A, 0x0F,
    0x01, 0x0D, 0x00, 0x41, 0x04, 0x29, 0x03, 0x00, 0x41, 0x00, 0x35, 0x02, 0x00, 0x7C, 0x0B, 0x00,
    0x24, 0x10, 0x73, 0x6F, 0x75, 0x72, 0x63, 0x65, 0x4D, 0x61, 0x70, 0x70, 0x69, 0x6E, 0x67, 0x55,
    0x52, 0x4C, 0x12, 0x2E, 0x2F, 0x72, 0x65, 0x6C, 0x65, 0x61, 0x73, 0x65, 0x2E, 0x77, 0x61, 0x73,
    0x6D, 0x2E, 0x6D, 0x61, 0x70]
}

describe("Algorithms Pallet Testing Module", () => {
  let algoId: number

  it('save algorithm on-chain', async () => {
    const code = readFileAsBytes('')
    algoId = await saveAlgo(api, alice, [schemaId],
      code)

    expect(algoId).toBeGreaterThan(99);
  })

  it('run algo for user', async () => {
    const output = await runAlgo(api, alice, bob.address, algoId)

    expect(output).toBeGreaterThanOrEqual(0)
  })


  it('get algo schemas', async () => {
    const data = await getAlgorithm(api, algoId)

    expect(data?.length).toEqual(1)
    expect(data![0]).toEqual(schemaId)
  })

})

afterAll(async () => {
  await api.disconnect()
})