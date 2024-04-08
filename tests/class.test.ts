import { Keyring } from '@polkadot/api'
import { KeyringPair } from '@polkadot/keyring/types'
import * as crypto from 'crypto'

import { getIssuer } from '../src/pallets/issuer/state'
import { stringToBlakeTwo256Hash } from '../src/utils/hashing'

import { Schema, TrueApi, U32, U64, U8 } from '../src/'
import { saveAlgo, runAlgo } from '../src/pallets/algorithms/extrinsic'
import { getAlgorithm } from '../src/pallets/algorithms/state'

const keyring = new Keyring({ type: 'sr25519' })
keyring.setSS58Format(7);

let eve: KeyringPair

let api: TrueApi;
let alice: KeyringPair;
let bob: KeyringPair;

type GithubSchema = {
  number_of_elements: U32,
  number_of_sub_items: U32,
};

beforeAll(async () => {
  api = await TrueApi.create('//Alice')

  alice = keyring.addFromUri("//Alice", { name: 'Alice default' })
  bob = keyring.addFromUri("//Bob", { name: 'Bob default' })
  eve = keyring.addFromUri('eve')

})

describe("Issuer Pallet Testing Module", () => {
  it("should estabilsh the connection correctly", async () => {
    expect(await api.network.genesisHash.toHex()).toBe("0xb74795a6d110900020d1eaf062a6fc156f1650e96c57d91a0739dadee420840f");
  })

  // Random bytes for issuer name.
  const randomBytes = crypto.randomBytes(32).toString('hex');
  const hash = stringToBlakeTwo256Hash(randomBytes)

  it('create issuer on-chain', async () => {

    const issuerId = await api.registerIssuer(randomBytes, [alice.address, bob.address])

    expect(issuerId).toEqual(`0x${hash}`);

  })

  it('get issuer data', async () => {
    const issuer = await getIssuer(api.network, `0x${hash}`)
    expect(issuer).not.toBeUndefined();
    expect(issuer?.name).toEqual(randomBytes);
    expect(issuer?.controllers).toContain(bob.address);
  })

})

describe("Credentials Pallet Testing Module", () => {
  const schemaS: GithubSchema = { // Type 'U64' is not assignable to type 'U32'.
    number_of_sub_items: new U32(1),
    number_of_elements: new U64(1), // Type error here
  };

  const schema = new Schema<GithubSchema>({
    number_of_sub_items: new U32(1),
    number_of_elements: new U64(1),
  });

  it('create schema on-chain', async () => {
    const schemaHash = await schema.register(api)

    expect(schemaHash).toEqual(schema.getSchemaHash())
  })

  // it('get schema data', async () => {
  //   const fetchedSchema = await getSchema(api, schemaId)

  //   expect(fetchedSchema?.keys()).toEqual(schema.keys())
  //   expect(fetchedSchema?.values()).toEqual(schema.values())
  // })

  it('attest credential on-chain', async () => {
    await schema.attest(api, eve.address, {
      number_of_elements: new U32(12),
      number_of_sub_items: new U8(10),
    })
  })

  it('fetch credential from chain', async () => {
    const d = await schema.getAttestation(api, eve.address)

    expect(d).not.toBeUndefined();
    expect(d!.number_of_elements.value).toEqual(12);
    expect(d!.number_of_sub_items.value).toEqual(10);
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

  const schema = new Schema<GithubSchema>({
    number_of_sub_items: new U32(1),
    number_of_elements: new U64(1),
  });

  it('save algorithm on-chain', async () => {
    const code = readFileAsBytes('')
    algoId = await saveAlgo(api.network, api.account, [schema.getSchemaHash()],
      code)

    expect(algoId).toBeGreaterThan(99);
  })

  it('run algo for user', async () => {
    const output = await runAlgo(api.network, api.account, eve.address, algoId)

    expect(output).toEqual(22)
  })


  it('get algo schemas', async () => {
    const data = await getAlgorithm(api.network, algoId)

    expect(data?.length).toEqual(1)
    expect(data![0]).toEqual(schema.getSchemaHash())
  })

})

afterAll(async () => {
  await api.network.disconnect()
})