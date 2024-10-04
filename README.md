![True Network Banner](https://i.ibb.co/w0XXRGQ/Reputation-Twitter-Header.png)
## True Network SDK

True Network provides the easy-to-use infrastructure for building blockchain-based reputation systems for the internet.

This SDK:
- You can use in NEXT.JS / Node.JS
- You can use to give on-chain attestations to users
- You can write & deploy the algorithms to True Network's Testnet
- Connect to the True Network Nodes (Testnet / Mainnet)

### About Testnet
True Network launched it's testnet in the end of April 2024, named Raman Network (named after Great Indian Scientist: [C.V. Raman](https://en.wikipedia.org/wiki/C._V._Raman)).

It has 3 main pallets from the True Network's Node ([repository](https://github.com/truenetworkio/True)):
- Issuer (Registering Issuer / dApp On-Chain)
- Credentials (Creating & storing new schemas and Issuing Attestations)
- Algorithms (Storing wasm file for the algorithm & running to get reputaiton score)

Link to the Polkadot JS Explorer: https://truenetwork.io/explorer/raman

> Alice account is pre-funded with some test tokens.


### Explore the Example Usage
We have create a simple example usage for on-chain attestation, [here](https://github.com/truenetworkio/true-example).

This is a simple nodejs app, that is created using the True Network CLI and it gives on-chain attestation to user for progress in a game.

## SDK Installation
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

## Using CLI for faster development
True Network has created a CLI tool for creating a project structure for on-chain attestations & creating an keypair in-built in the config.

### Installing CLI:
```ts
 npm install -g reputation-cli
```

### Init a new True Network Project
Inside any existing nodejs + typescript project, run:
```ts
 reputation-cli init
```
It will ask a few questions like Issuer Name, existing keypair, etc. and will create a new config file in the true-network directory inside project.

### Register Issuer On-Chain
Run the following code to register issuer:
```ts
 reputation-cli regsiter
```
> Make sure you have some testnet tokens in the newly created account, else fund it from Alice acount.

### Fetching the True Network Instance
Now you can just import the getTrueNetworkInstance method from the 'true-network' directory to get the instance.
```
 const trueApi = await getTrueNetworkInstance()
```

Checkout the CLI: https://github.com/truenetworkio/reputation-cli


For detailed information, please consider going through the [docs](https://docs.truenetwork.io).
