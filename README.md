<div align="center">
  <a href="https://www.pokt.network">
    <img src="https://pokt.network/wp-content/uploads/2018/12/Logo-488x228-px.png" alt="Pocket Network logo" width="340"/>
  </a>
</div>

# Testnet Faucet

Testnet-Faucet is a Web tool which gives the user the possibility of obtaining POKT for free (on our test platform). The user only has to provide his address and he will immediately receive POKT.

### Installation

Testnet-Faucet is a tool that runs on NodeJS, therefore it has the possibility of accessing the environment variables of your system. So, before starting the application it is necessary to configure certain variables. These variables can be configured both in environment variables and in an **.env** file in the root path.

These are the required variables:
  * CHAIN_ID
  * FAUCET_PK
  * FAUCET_ADDRESS
  * FAUCET_AMOUNT
  * NODE_URL
  * RECAPTCHA_SITE_KEY
  * RECAPTCHA_SECRET_KEY
  * CANONICAL_URL
  * FEE_AMOUNT
  * PORT

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