const fs = require('fs');
const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');

// Banner
console.log(`
       █████╗ ██████╗ ██████╗     ███╗   ██╗ ██████╗ ██████╗ ███████╗
      ██╔══██╗██╔══██╗██╔══██╗    ████╗  ██║██╔═══██╗██╔══██╗██╔════╝
      ███████║██║  ██║██████╔╝    ██╔██╗ ██║██║   ██║██║  ██║█████╗  
      ██╔══██║██║  ██║██╔══██╗    ██║╚██╗██║██║   ██║██║  ██║██╔══╝  
      ██║  ██║██████╔╝██████╔╝    ██║ ╚████║╚██████╔╝██████╔╝███████╗
      ╚═╝  ╚═╝╚═════╝ ╚═════╝     ╚═╝  ╚═══╝ ╚═════╝ ╚═════╝ ╚══════╝  
        By : ADB NODE
`);

// Function to get current date and time
const getTimestamp = () => {
    return new Date().toLocaleString('en-US', { timeZone: 'UTC' });
};

const API_KEY = "YOUR_API_KEY"; // ဒီနေရာမှာ သင့် 2Captcha API key ထည့်ပါ
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
    console.log(`[${getTimestamp()}] ⏳ Waiting for CAPTCHA to be solved...`);
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
            console.log(`[${getTimestamp()}] ❌ Failed to get CAPTCHA ID!`);
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
                console.log(`[${getTimestamp()}] ✅ CAPTCHA successfully solved!`);
                return result.data.request;
            }
        }
    } catch (error) {
        console.error(`[${getTimestamp()}] ⚠️ Error while solving CAPTCHA: ${error.message}`);
    }
    console.log(`[${getTimestamp()}] ❌ Failed to get CAPTCHA solution within time limit!`);
    return null;
}

function loadWallets(filePath) {
    return fs.readFileSync(filePath, 'utf-8').split('\n').map(line => line.trim()).filter(line => line);
}

async function claimFaucet(wallet, proxy) {
    console.log(`[${getTimestamp()}] 🔄 Claiming faucet for wallet: ${wallet}`);
    let turnstileToken = await solveCaptcha(proxy);
    if (!turnstileToken) {
        console.log(`[${getTimestamp()}] ❌ Skipping wallet due to failure to obtain CAPTCHA token.`);
        console.log(`[${getTimestamp()}] ⏳ Waiting 60 seconds before the next claim...`);
        await new Promise(resolve => setTimeout(resolve, 60000)); // 60 စက္ကန့် delay
        return;
    }

    let data = {
        address: wallet,
        turnstile_response: turnstileToken
    };
    
    let agent = proxy ? new HttpsProxyAgent(proxy) : undefined;

    for (let i = 0; i < 3; i++) {  // Try claiming up to 3 times
        try {
            let response = await axios.post(FAUCET_URL, data, {
                headers: {
                    "accept": "application/json, text/plain, */*",
                    "content-type": "application/json",
                    "origin": "https://app.testnet.initia.xyz",
                    "referer": "https://app.testnet.initia.xyz/",
                    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36"
                },
                httpsAgent: agent
            });
            console.log(`[${getTimestamp()}] ✅ Claim successful for ${wallet}`);
            console.log(`[${getTimestamp()}] ⏳ Waiting 60 seconds before the next claim...`);
            await new Promise(resolve => setTimeout(resolve, 60000)); // 60 စက္ကန့် delay
            return;
        } catch (error) {
            console.log(`[${getTimestamp()}] ❌ Claim failed (Attempt ${i + 1}) for ${wallet}: ${error.message}`);
            if (i < 2) { // Retry မကုန်သေးရင် 30 စက္ကန့် စောင့်ပြီး ထပ်ကြိုးစား
                console.log(`[${getTimestamp()}] ⏳ Waiting 30 seconds before trying again...`);
                await new Promise(resolve => setTimeout(resolve, 30000));
            }
        }
    }

    // Retry 3 ကြိမ်လုံး မအောင်မြင်ရင် ဒီနေရာကို ရောက်လာမယ်
    console.log(`[${getTimestamp()}] ❌ All attempts failed for ${wallet}`);
    console.log(`[${getTimestamp()}] ⏳ Waiting 60 seconds before the next claim...`);
    await new Promise(resolve => setTimeout(resolve, 60000)); // 60 စက္ကန့် delay
}

async function startAutoClaim() {
    let proxies = loadProxies(PROXY_FILE);
    while (true) {
        let wallets = loadWallets(WALLET_FILE);
        for (let wallet of wallets) {
            let proxy = getRandomProxy(proxies);
            await claimFaucet(wallet, proxy);
        }
        console.log(`[${getTimestamp()}] ⏳ Waiting 8 hours before claiming again...`);
        await new Promise(resolve => setTimeout(resolve, (28800 + 60) * 1000)); // 8 နာရီ + 1 မိနစ်
    }
}

startAutoClaim();
