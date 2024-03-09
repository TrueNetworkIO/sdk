import { ApiPromise } from "@polkadot/api"

export const ALGORITHM_PALLET_NAME = 'algorithmsModule'

export const getAlgorithm = async (api: ApiPromise, algoId: number): Promise<number[] | undefined> => {
  const response = await api.query[ALGORITHM_PALLET_NAME].algorithms(algoId);

  const data = (response.toJSON() as any)

  if (!data || data.length == 0) return;

  const schemaIds: number[] = data['schemaIds']
  return schemaIds
}