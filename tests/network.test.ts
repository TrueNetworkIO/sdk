import { ApiPromise } from '@polkadot/api'
import { connect } from '../src/network'
import { getFreeBalance } from '../src/utils/balances'

let api: ApiPromise;

beforeAll(async () => {
  api = await connect()
})

describe("Network Testing Module", () => {
  it("should estabilsh the connection correctly", async () => {
    expect(await api.genesisHash.toHex()).toBe("0xb74795a6d110900020d1eaf062a6fc156f1650e96c57d91a0739dadee420840f");
  })

  it('check user balance, greater than 0', async () => {
    const b = await getFreeBalance(api, '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY')
    expect(b).toBeGreaterThan(0);
  })
})

afterAll(async () => {
  await api.disconnect()
})