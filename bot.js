const fs = require('fs');
const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');

const API_KEY = "API_KEY_ANDA";
const SITEKEY = "0x4AAAAAAA47SsoQAdSW6HIy";
const FAUCET_URL = "https://faucet-api.testnet.initia.xyz/claim";
const WALLET_FILE = "wallet.txt";
const PROXY_FILE = "proxy.txt";

function loadProxies(filePath) {
    return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf-8').split('\n').map(line => line.trim()).filter(line => line) : [];
}

function getRandomProxy(proxies) {
    return proxies.length > 0 ? proxies[Math.floor(Math.random() * proxies.length)] : null;
}

async function solveCaptcha(proxy) {
    console.log("⏳ Menunggu CAPTCHA diselesaikan...");
    try {
        let agent = proxy ? new HttpsProxyAgent(proxy) : undefined;
        let response = await axios.post("http://2captcha.com/in.php", null, {
            params: {
                key: API_KEY,
                method: "turnstile",
                json: 1,
                pageurl: "https://app.testnet.initia.xyz",
                sitekey: SITEKEY
            },
            httpsAgent: agent
        });

        if (response.data.status !== 1) {
            console.log("❌ Gagal mendapatkan ID CAPTCHA!");
            return null;
        }

        let captchaId = response.data.request;

        for (let i = 0; i < 30; i++) {
            await new Promise(resolve => setTimeout(resolve, 5000));
            let result = await axios.get("http://2captcha.com/res.php", {
                params: {
                    key: API_KEY,
                    action: "get",
                    id: captchaId,
                    json: 1
                },
                httpsAgent: agent
            });
            if (result.data.status === 1) {
                console.log("✅ CAPTCHA berhasil diselesaikan!");
                return result.data.request;
            }
        }
    } catch (error) {
        console.error("⚠️ Error saat menyelesaikan CAPTCHA:", error.message);
    }
    console.log("❌ Gagal mendapatkan solusi CAPTCHA dalam batas waktu!");
    return null;
}

function loadWallets(filePath) {
    return fs.readFileSync(filePath, 'utf-8').split('\n').map(line => line.trim()).filter(line => line);
}

async function claimFaucet(wallet, proxy) {
    console.log(`🔄 Menklaim faucet untuk wallet: ${wallet}`);
    let turnstileToken = await solveCaptcha(proxy);
    if (!turnstileToken) {
        console.log("❌ Melewati wallet karena gagal mendapatkan token CAPTCHA.");
        return;
    }

    let data = {
        address: wallet,
        turnstile_response: turnstileToken
    };
    
    let agent = proxy ? new HttpsProxyAgent(proxy) : undefined;

    for (let i = 0; i < 3; i++) {  // Coba klaim maksimal 3 kali
        try {
            let response = await axios.post(FAUCET_URL, data, {
                headers: {
                    "accept": "application/json, text/plain, */*",
                    "content-type": "application/json",
                    "origin": "https://app.testnet.initia.xyz",
                    "referer": "https://app.testnet.initia.xyz/",
                    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, seperti Gecko) Chrome/134.0.0.0 Safari/537.36"
                },
                httpsAgent: agent
            });
            console.log(`✅ Klaim berhasil untuk ${wallet}`);
            console.log("Menunggu 30 detik sebelum klaim berikutnya...");
            await new Promise(resolve => setTimeout(resolve, 30000));
            return;
        } catch (error) {
            console.log(`❌ Klaim gagal (Percobaan ${i + 1}) untuk ${wallet}`);
            console.log("⏳ Menunggu 30 detik sebelum mencoba lagi...");
            await new Promise(resolve => setTimeout(resolve, 30000));
        }
    }
}

async function startAutoClaim() {
    let proxies = loadProxies(PROXY_FILE);
    while (true) {
        let wallets = loadWallets(WALLET_FILE);
        for (let wallet of wallets) {
            let proxy = getRandomProxy(proxies);
            await claimFaucet(wallet, proxy);
        }
        console.log("⏳ Menunggu 24 jam 3 menit sebelum klaim ulang...");
        await new Promise(resolve => setTimeout(resolve, (86400 + 180) * 1000));
    }
}

startAutoClaim();
