import { ApiPromise } from "@polkadot/api"

export const ISSUER_PALLET_NAME = 'issuersModule'

export const getIssuer = async (api: ApiPromise, hashId: string) => {
  const response = await api.query[ISSUER_PALLET_NAME].issuers(hashId);

  const d = (response.toJSON() as any)

  if (!d) return;

  const name = Buffer.from(d['name'].split('0x')[1], 'hex').toString('utf8')

  return {
    name,
    controllers: d['controllers'] as string[]
  }
}