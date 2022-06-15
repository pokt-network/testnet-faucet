<div align="center">
  <a href="https://www.pokt.network">
    <img src=".github/pokt_logo.png" alt="Pocket Network logo" width="200"/>
  </a>
  <h1>Pocket Testnet Faucet</h1>
</div>

Testnet Faucet is a Web tool which gives the user the possibility of obtaining POKT for free (on our test platform). The user only has to provide their address and they will immediately receive POKT.

### Installation

Testnet-Faucet is a tool that runs on NodeJS, therefore it has the possibility of accessing the environment variables of your system. So, before starting the application it is necessary to configure certain variables. These variables can be configured both in environment variables and in an **.env** file in the root path.

These are the required variables:

- CHAIN_ID
- FAUCET_PK
- FAUCET_ADDRESS
- FAUCET_AMOUNT
- NODE_URL
- RECAPTCHA_SITE_KEY
- RECAPTCHA_SECRET_KEY
- CANONICAL_URL
- FEE_AMOUNT
- PORT

After that you just need to run:

```
npm install
npm run build
node index.js
```

Something interesting about this tool is that it also has a web interface, which simplifies its use. This interface is generated when the main project is built.

```
"build": "npm install && cd public && npm install && cd ..",
```
