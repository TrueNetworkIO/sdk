import { ApiPromise } from '@polkadot/api'
import { connect } from '../src/network'
import { getFreeBalance } from '../src/utils/balances'

let api: ApiPromise;

beforeAll(async () => {
  api = await connect()
})

describe("Network Testing Module", () => {
  it("should estabilsh the connection correctly", async () => {
    expect(await api.genesisHash.toHex()).toBe("0xaff80faaabe00947150e3557f6add2be5261fc6dcf0e2187e694f0fde63b141a");
  })

  it('check user balance, greater than 0', async () => {
    const b = await getFreeBalance(api, '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY')
    expect(b).toBeGreaterThan(0);
  })
})

afterAll(async () => {
  await api.disconnect()
})