import { NetworkConfig } from "../network";
import { Schema } from "../schemas";

export type Account = {
  secret: string;
  address: string;
}

export type Issuer = {
  name: string;
  hash: string;
}

export type Algorithm = {
  id?: number,
  path?: string,
  schemas: Schema<any>[]
}

export type TrueConfig = {
  network: NetworkConfig,
  account: Account,
  issuer: Issuer,
  algorithm?: Algorithm
}
