import { SchemaType } from "../schemas"

export type NetworkConfig = {
  name: string,
  unit: string,
  rpc: string,
  denomination: number
}

export type AttestationResponseType = {
  attestationId: number,
  prismUrl: string,
  transaction: {
    hash: string,
    explorerUrl: string,
    events: any[]
  }
}

export type SchemaObject = {
  [key: string]: SchemaType<any>
}