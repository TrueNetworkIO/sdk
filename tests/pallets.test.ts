import { ApiPromise, Keyring } from '@polkadot/api'
import { KeyringPair } from '@polkadot/keyring/types'
import * as crypto from 'crypto'

import { connect } from '../src/network'
import { getIssuer } from '../src/pallets/issuer/state'
import { createIssuer } from '../src/pallets/issuer/extrinsic'
import { createSchema } from '../src/pallets/credentials/extrinsic'
import { stringToBlakeTwo256Hash } from '../src/utils/hashing'
import { SchemaObject, SchemaTypes } from '../src/pallets/credentials/types'
import { getSchema } from '../src/pallets/credentials/state'

const keyring = new Keyring({ type: 'sr25519' })
let api: ApiPromise;
let alice: KeyringPair;
let bob: KeyringPair;

let issuerHashId: string

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
  }]

  let schemaId: number

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

})

afterAll(async () => {
  await api.disconnect()
})