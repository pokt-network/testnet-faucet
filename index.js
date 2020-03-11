const serve = require("koa-static")
const mount = require("koa-mount")
const koaBody = require("koa-body")
const Koa = require("koa")
const Router = require("@koa/router")
const app = new Koa()
const router = new Router()
const PocketJSCore = require("@pokt-network/pocket-js")
const Configuration = PocketJSCore.Configuration
const Pocket = PocketJSCore.Pocket
const CoinDenom = PocketJSCore.CoinDenom
const typeGuard = PocketJSCore.typeGuard
const RpcError = PocketJSCore.RpcError
const validateAddressHex = PocketJSCore.validateAddressHex
const HttpRpcProvider = PocketJSCore.HttpRpcProvider
const pug = require("js-koa-pug")
const request = require("request-promise-native")

// Parse environment variables
// Load .env file
require("dotenv").config()
const chainID = process.env.CHAIN_ID
const faucetPK = process.env.FAUCET_PK
const faucetAddress = process.env.FAUCET_ADDRESS
const faucetAmount = process.env.FAUCET_AMOUNT
const nodeURL = process.env.NODE_URL
const recaptchaSiteKey = process.env.RECAPTCHA_SITE_KEY
const recaptchaSecretKey = process.env.RECAPTCHA_SECRET_KEY
const canonicalURL = process.env.CANONICAL_URL
const port = process.env.PORT || 3000
const feeAmount = process.env.FEE_AMOUNT
const uPOKTDivider = 1000000

// Setup Pocket
const dispatchers = [new URL(nodeURL)];
const configuration = new Configuration(100, 10000000, 100000);
const rpcProvider = new HttpRpcProvider(dispatchers)
const pocket = new Pocket(dispatchers, rpcProvider,configuration);

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
        faucetAmount: faucetAmount / uPOKTDivider,
        recaptchaSiteKey: recaptchaSiteKey,
        canonicalURL: canonicalURL
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
    try {
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
                    secret: recaptchaSecretKey,
                    response: captchaToken
                },
                headers: {}
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
                const faucetAccountOrError = await pocket.rpc().query.getAccount(faucetAddress)
                if (typeGuard(faucetAccountOrError, Error)) {
                    console.error(faucetAccountOrError)
                    errorMsg = "Error submitting transaction (could not get sequence number for faucet), please try again"
                } else {
                    const txSender = txSenderOrError
                    const txResponse = await txSender
                        .send(faucetAddress, address, faucetAmount)
                        .submit(chainID, feeAmount,undefined,CoinDenom.Upokt, "")
                    if (typeGuard(txResponse, RpcError)) {
                        console.error(txResponse)
                        errorMsg = "Error submitting transaction, please try again"
                    } else {
                        txHash = txResponse.hash
                    }
                }
            }
        }

        ctx.render("index", {
            errorMsg: errorMsg,
            txHash: txHash,
            faucetAmount: faucetAmount / uPOKTDivider,
            recaptchaSiteKey: recaptchaSiteKey,
            canonicalURL: canonicalURL
        })
    } catch(err) {
        console.error(err)
        ctx.render("index", {
            errorMsg: "Internal server error",
            txHash: undefined,
            faucetAmount: faucetAmount / uPOKTDivider,
            recaptchaSiteKey: recaptchaSiteKey,
            canonicalURL: canonicalURL
        })
    }
    await next()
})

app.use(router.routes()).use(router.allowedMethods())

// Listen on port
app.listen(port)
console.log("Listening on: " + port)