const serve = require("koa-static")
const mount = require("koa-mount")
const koaBody = require("koa-body")
const Koa = require("koa")
const Router = require("@koa/router")
const app = new Koa()
const router = new Router()
const PocketJSCore = require("pocket-js-core")
const Configuration = PocketJSCore.Configuration
const Pocket = PocketJSCore.Pocket
const Node = PocketJSCore.Node
const BondStatus = PocketJSCore.BondStatus
const CoinDenom = PocketJSCore.CoinDenom
const typeGuard = PocketJSCore.typeGuard
const RpcErrorResponse = PocketJSCore.RpcErrorResponse
const validateAddressHex = PocketJSCore.validateAddressHex
const pug = require("js-koa-pug")
const request = require("request-promise-native")


// Parse environment variables
// Load .env file
require("dotenv").config()
const chainId = process.env.CHAIN_ID
const faucetPK = process.env.FAUCET_PK
const faucetAddress = process.env.FAUCET_ADDRESS
const faucetAmount = process.env.FAUCET_AMOUNT
const faucetAccountNumber = process.env.FAUCET_ACCOUNT_NUMBER
const nodeUrl = process.env.NODE_URL
const nodeAddress = process.env.NODE_ADDRESS
const nodePubKey = process.env.NODE_PUBLIC_KEY

// Setup Pocket
const node = new Node(nodeAddress, nodePubKey, false, BondStatus.bonded, BigInt(1000000000000), nodeUrl, [], "0001-01-01T00:00:00Z")
const configuration = new Configuration([node], 100, 10000000, 100000)
const pocket = new Pocket(configuration)

// Setup pug
app.use(pug("views"));
// Add body parser
app.use(koaBody())
// Public static files
app.use(mount("/public", serve("public")))

// Index page
router.get("/", async function (ctx, next) {
    ctx.render("index", {
        errorMsg: null,
        txHash: null,
        faucetAmount: faucetAmount
    })
    await next()
})

function parseFormValues(formValues) {
    const result = {}
    const lines = formValues.split("\r\n")
    if (lines.length % 2 !== 0) {
        lines.pop()
    }
    for (var i = 0; i < lines.length; i++) {
        var separatedValues = lines[i].split("=")
        if (separatedValues.length === 2) {
            var key = separatedValues[0]
            var value = separatedValues[1] === "" ? undefined : separatedValues[1]
            result[key] = value
        } else if (separatedValues.length === 1) {
            result[separatedValues[0]] = undefined
        }
    }
    return result
}

// Index page form submission
router.post("/", async function (ctx, next) {
    console.log(ctx.request)
    console.log(ctx.request.body)

    let address
    let captchaToken
    let errorMsg = undefined
    let txHash = undefined

    // Parse address string
    var form = parseFormValues(ctx.request.body)
    address = form.address
    captchaToken = form.captcha
    const addressValidationResult = address === undefined ? new Error("Undefined address") : validateAddressHex(address)
    if (typeGuard(addressValidationResult, Error)) {
        errorMsg = "Invalid address"
    } else {
        var captchaValidationRequest = {
            method: "POST",
            uri: "https://www.google.com/recaptcha/api/siteverify",
            form: {
                secret: "6LcexNYUAAAAAItB-UrGlJjJ2T6dVH6ZWw87HibV",
                response: captchaToken
            },
            headers: {
                /* "content-type": "application/x-www-form-urlencoded" */ // Is set automatically
            }
        };

        const captchValidationResultString = await request(captchaValidationRequest)
        try {
            const captchValidationResult = JSON.parse(captchValidationResultString)
            if (!captchValidationResult.success) {
                errorMsg = "Invalid captcha token, are you a bot?"
            }
        } catch (error) {
            console.error(error)
            errorMsg = "Invalid captcha token, are you a bot?"
        }
    }

    if (address !== undefined && errorMsg === undefined) {
        // Submit send transaction
        const txSenderOrError = pocket.withPrivateKey(faucetPK)
        if (typeGuard(txSenderOrError, Error)) {
            errorMsg = "Invalid faucet configuration"
            console.error(txSenderOrError)
        } else {
            // TODO retrieve sequence
            const txSender = txSenderOrError
            const txResponse = await txSender
                .send(faucetAddress, address, faucetAmount, CoinDenom.Pokt)
                .submit(faucetAccountNumber, "0", chainId, node, "100", CoinDenom.Pokt, "Faucet Transaction")
            if (typeGuard(txResponse, RpcErrorResponse)) {
                console.error(txResponse)
                errorMsg = "Error submitting transaction, please try again"
            } else {
                txHash = txResponse.hash
            }
        }
    }

    ctx.render("index", {
        errorMsg: errorMsg,
        txHash: txHash,
        faucetAmount: faucetAmount
    })
    await next()
})

app.use(router.routes()).use(router.allowedMethods())

// Listen on port
app.listen(3000)