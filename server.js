/**
 * server.js
 * eBay Pokémon 卡片走勢圖 - 自動 OAuth Token + API Proxy 伺服器
 */
import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// === 1️⃣ 環境設定 ===
const CLIENT_ID = process.env.EBAY_CLIENT_ID;        // KennyYue-querytcg-SBX-XXXX
const CLIENT_SECRET = process.env.EBAY_CLIENT_SECRET; // 你在 eBay Developer Portal 拿到的 secret
const EBAY_SCOPE = "https://api.ebay.com/oauth/api_scope";
// const TOKEN_URL = "https://api.sandbox.ebay.com/identity/v1/oauth2/token";
// const EBAY_API_URL = "https://api.sandbox.ebay.com/buy/browse/v1/item_summary/search";
const TOKEN_URL = "https://api.ebay.com/identity/v1/oauth2/token";
const EBAY_API_URL = "https://api.ebay.com/buy/browse/v1/item_summary/search";

let accessToken = "";
let tokenExpires = 0;

// === 2️⃣ 自動取得 / 刷新 Token ===
async function getAccessToken() {
    const now = Date.now();
    if (accessToken && now < tokenExpires - 60 * 1000) {
        // Token 還有效
        return accessToken;
    }

    console.log("🔑 Requesting new eBay OAuth token...");
    const basicAuth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");

    const body = new URLSearchParams({
        grant_type: "client_credentials",
        scope: EBAY_SCOPE,
    });

    const res = await fetch(TOKEN_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${basicAuth}`,
        },
        body,
    });

    const data = await res.json();
    if (!data.access_token) {
        console.error("❌ Token 錯誤:", data);
        throw new Error("無法取得 eBay Token");
    }

    accessToken = data.access_token;
    tokenExpires = now + data.expires_in * 1000;
    console.log("✅ Token 取得成功，有效期", data.expires_in, "秒");
    return accessToken;
}

// === 3️⃣ 提供 /api/search 給前端呼叫 ===
app.get("/api/search", async (req, res) => {
    try {
        const q = req.query.q;
        if (!q) return res.status(400).json({ error: "Missing query" });

        const token = await getAccessToken();
        const endpoint = `${EBAY_API_URL}?q=${encodeURIComponent(q)}&limit=100`;

        const response = await fetch(endpoint, {
            headers: { Authorization: `Bearer ${token}` },
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("❌ eBay API error:", data);
            return res.status(500).json(data);
        }

        res.json(data);
    } catch (err) {
        console.error("❌ /api/search error:", err);
        res.status(500).json({ error: err.message });
    }
});

// === 4️⃣ 提供前端靜態頁面 ===
app.use(express.static(path.join(__dirname, "public")));

app.listen(PORT, () =>
    console.log(`🚀 Server running → http://localhost:${PORT}`)
);