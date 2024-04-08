import { ApiPromise } from "@polkadot/api"
import { SchemaObject } from "../../schemas";
import { convertBytesToSerialize, convertHexToString } from "../../utils/hashing";

export const CREDENTIALS_PALLET_NAME = 'credentialsModule'

export const checkIfSchemaExist = async (api: ApiPromise, schemaHash: string): Promise<boolean> => {
  const response = await api.query[CREDENTIALS_PALLET_NAME].schemas(schemaHash);

  const data = (response.toJSON() as any)

  if (!data || data.length == 0) return false;
  
  return true;
}

// TODO: implement the below method, to return instance of Schema Class.
// export const getSchema = async (api: ApiPromise, schemaHash: string): Promise<SchemaObject | undefined> => {
//   const response = await api.query[CREDENTIALS_PALLET_NAME].schemas(schemaHash);

//   const data = (response.toJSON() as any)

//   if (!data || data.length == 0) return;

//   const schema: any = {}

//   data.forEach((i: any[]) => {
//     const key = convertHexToString(i[0])
//     const schemaType = stringToSchemaType(i[1])

//     if (!schemaType) throw Error("Invalid schema type coming from nodes.")

//     schema[key] = schemaType

//   })
//   return schema
// }

export const getAttestation = async (api: ApiPromise, account: string, schemaHash: string): Promise<(string | number)[] | undefined> => {
  const response = await api.query[CREDENTIALS_PALLET_NAME].attestations(account, schemaHash);

  const data = (response.toJSON() as any)

  if (!data || data.length == 0) return;

  const cred: (string | number)[] = []

  data.forEach((i: string) => {
    const value = parseFloat(convertHexToString(i))

    if (Number.isNaN(value)) {
      cred.push(convertHexToString(i))
    } else {
      cred.push(value)
    }
  })
  return cred
}

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