import { ApiPromise } from '@polkadot/api'
import { connect } from '../src/network'

let api: ApiPromise;

beforeAll(async () => {
  api = await connect()
})

describe("Network Testing Module", () => {
  it("should estabilsh the connection correctly", async () => {
    expect(await api.genesisHash.toHex()).toBe("0xaff80faaabe00947150e3557f6add2be5261fc6dcf0e2187e694f0fde63b141a");
  })

})

afterAll(async () => {
  await api.disconnect()
})