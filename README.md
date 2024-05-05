## True Network SDK

True Network provides the easy-to-use infrastructure for building blockchain-based reputation systems for the internet.

This SDK:
- You can use in NEXT.JS / Node.JS
- You can use to give on-chain attestations to users
- You can write & deploy the algorithms to True Network's Testnet
- Connect to the True Network Nodes (Testnet / Mainnet)

## Installation
Install it as dependency:
 ```ts
  yarn add @truenetworkio/sdk
 ```

Use the package to create a new TrueApi instance like this:

  ```ts
    import { TrueApi } from '@truenetworkio/sdk'

    const setup = async (): TrueApi => {
      const trueApi = await TrueApi.create('//Alice')

      // Set issuer.
      trueApi.setIssuer('issuerHash')

      return trueApi;
    }
  ```

For detailed information, please consider going through the [docs](https://docs.truenetwork.io).
