import express from "express"
import morgan from "morgan"
import { createProxyMiddleware } from "http-proxy-middleware"


const app = express()
app.use(morgan("combined"))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get("/api/status/healthz", (req, res) => {
    res.status(200).json({
        message: "Sandbox API is healthy",
        status: "ok"
    })
})

app.get("/api/status/readyz", (req, res) => {
    res.status(200).json({
        message: "Sandbox API is ready",
        status: "ready"
    })
})

const proxies = {}

function getProxy(sandboxId) {

    const target = `http://sandbox-service-${sandboxId}`

    if (!proxies[sandboxId]) {
        proxies[sandboxId] = createProxyMiddleware({
            target,
            changeOrigin: true,
            ws: true,
        })
    }

    return proxies[sandboxId]
}

app.use((req, res, next) => {
    const host = req.headers.host
    const sandboxId = host.split(".")[0];

    return getProxy(sandboxId)(req, res, next)
})

export default app