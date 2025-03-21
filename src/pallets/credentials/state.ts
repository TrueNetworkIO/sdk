import { ApiPromise } from "@polkadot/api"
import { Schema } from "../../schemas";
import { getWalletWithType } from "../../utils";

export const CREDENTIALS_PALLET_NAME = 'credentialsModule'

export const checkIfSchemaExist = async (api: ApiPromise, schemaHash: string): Promise<boolean> => {
  const response = await api.query[CREDENTIALS_PALLET_NAME].schemas(schemaHash);

  const data = (response.toJSON() as any)

  if (!data || data.length == 0) return false;

  return true;
}

export const getSchemaFromHash = async (api: ApiPromise, schemaHash: string): Promise<[string, any][] | undefined> => {
  const response = await api.query[CREDENTIALS_PALLET_NAME].schemas(schemaHash);

  const data = (response.toHuman() as any)

  if (!data || data.length == 0) return;

  return data
}


export const getAttestationForSchema = async (api: ApiPromise, account: string, issuerHash: string, schema: Schema<any>): Promise<(string | number)[] | undefined> => {
  const walletWithType = getWalletWithType(account);

  const response = await api.query[CREDENTIALS_PALLET_NAME].attestations(walletWithType, issuerHash, schema.getSchemaHash());

  const data = (response.toHuman() as any)

  if (!data || data.length == 0) return [];

  return data
}


export const getAttestationsFromSchemaHash = async (api: ApiPromise, account: string, issuerHash: string, schemaHash: string): Promise<(string | number)[] | undefined> => {
  const walletWithType = getWalletWithType(account);

  const response = await api.query[CREDENTIALS_PALLET_NAME].attestations(walletWithType, issuerHash, schemaHash);

  const data = (response.toJSON() as any)

  if (!data || data.length == 0) return [];

  return data
}


// export const getAttestation = async (api: ApiPromise, account: any, issuerHash: string, schema: Schema<any>): Promise<(string | number)[] | undefined> => {
//   const response = await api.query[CREDENTIALS_PALLET_NAME].attestations(account, issuerHash, schema.getSchemaHash());

//   const data = (response.toJSON() as any)

//   if (!data || data.length == 0) return;

//   const cred: (string | number)[] = []

//   console.log('data values', data)

//   data.forEach((i: string, index: number) => {
//     schema.getSortedEntries()
//   })

//   // Get 
//   data.forEach((i: string) => {
//     const value = parseFloat(convertHexToString(i))

//     if (Number.isNaN(value)) {
//       cred.push(convertHexToString(i))
//     } else {
//       cred.push(value)
//     }
//   })
//   return cred
// }

// TODO: need to implement this later.
// export const getAllAttestations = async (api: ApiPromise, account: string): Promise<SchemaObject | undefined> => {
//   const response = await api.query[CREDENTIALS_PALLET_NAME].attestations(account);

//   const data = (response.toJSON() as any)

//   if (!data || data.length == 0) return;

//   const schema: SchemaObject = []

//   data.forEach((i: any[]) => {
//     const key = convertHexToString(i[0])
//     const schemaType = stringToSchemaType(i[1])

//     if (!schemaType) throw Error("Invalid schema type coming from nodes.")
//     schema.push({
//       key: key,
//       type: schemaType
//     })
//   })
//   return schema
// }