/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run "npm run dev" in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run "npm run deploy" to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const challengeCode = url.searchParams.get("challenge_code");

        // 注意：endpoint 必須 EXACTLY 同你 eBay portal 入嗰條一模一樣！
        const endpoint = "https://flat-frost-524c.ykhken.workers.dev/";
        const verificationToken =
            "verifytoken_tcg_demoapp2025_abc1234567890abcdefghij";

        if (challengeCode) {
            const textToHash = challengeCode + verificationToken + endpoint;

            // 明確用 UTF-8
            const encoder = new TextEncoder();
            const data = encoder.encode(textToHash);
            const hashBuffer = await crypto.subtle.digest("SHA-256", data);

            // 八位組轉 16 進位 hex
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

            // 回傳 JSON
            return new Response(JSON.stringify({ challengeResponse: hashHex }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            });
        }

        return new Response(
            JSON.stringify({ message: "OK from Cloudflare Worker" }),
            {
                status: 200,
                headers: { "Content-Type": "application/json" },
            }
        );
    },
};