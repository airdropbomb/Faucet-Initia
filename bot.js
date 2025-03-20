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

const API_KEY = "YOUR_API_KEY";
const SITEKEY = "0x4AAAAAAA47SsoQAdSW6HIy";
const FAUCET_URL = "https://faucet-api.testnet.initia.xyz/claim";
const WALLET_FILE = "wallet.txt";
const PROXY_FILE = "proxy.txt";
const CLAIMED_FILE = "claimed.txt";
const LAST_RESET_FILE = "last_reset.txt"; // New file to track last reset time

// Load last reset time
function getLastResetTime() {
    if (fs.existsSync(LAST_RESET_FILE)) {
        return parseInt(fs.readFileSync(LAST_RESET_FILE, 'utf-8').trim());
    }
    return 0;
}

// Save current time as last reset
function saveLastResetTime() {
    fs.writeFileSync(LAST_RESET_FILE, Date.now().toString());
}

// Check if it's a new day and reset claimed.txt if needed
function resetIfNewDay() {
    const lastReset = getLastResetTime();
    const now = Date.now();
    const oneDayInMs = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

    if (now - lastReset >= oneDayInMs) {
        console.log("📅 New day detected! Resetting claimed.txt...");
        fs.writeFileSync(CLAIMED_FILE, ''); // Clear claimed.txt
        saveLastResetTime(); // Update last reset time
    }
}

// Load claimed wallets from claimed.txt
function loadClaimedWallets(filePath) {
    return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf-8').split('\n').map(line => line.trim()).filter(line => line) : [];
}

// Save a wallet to claimed.txt
function saveClaimedWallet(wallet) {
    fs.appendFileSync(CLAIMED_FILE, wallet + '\n');
}

function loadProxies(filePath) {
    return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf-8').split('\n').map(line => line.trim()).filter(line => line) : [];
}

function getRandomProxy(proxies) {
    return proxies.length > 0 ? proxies[Math.floor(Math.random() * proxies.length)] : null;
}

async function solveCaptcha(proxy) {
    console.log("⏳ Waiting for CAPTCHA to be solved...");
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
            console.log("❌ Failed to get CAPTCHA ID!");
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
                console.log("✅ CAPTCHA successfully solved!");
                return result.data.request;
            }
        }
    } catch (error) {
        console.error("⚠️ Error while solving CAPTCHA:", error.message);
    }
    console.log("❌ Failed to get CAPTCHA solution within time limit!");
    return null;
}

function loadWallets(filePath) {
    return fs.readFileSync(filePath, 'utf-8').split('\n').map(line => line.trim()).filter(line => line);
}

async function claimFaucet(wallet, proxy, claimedWallets) {
    if (claimedWallets.includes(wallet)) {
        console.log(`⏭️ Skipping wallet ${wallet} - already claimed today.`);
        return;
    }

    console.log(`🔄 Claiming faucet for wallet: ${wallet}`);
    let turnstileToken = await solveCaptcha(proxy);
    if (!turnstileToken) {
        console.log("❌ Skipping wallet due to failure to obtain CAPTCHA token.");
        return;
    }

    let data = {
        address: wallet,
        turnstile_response: turnstileToken
    };
    
    let agent = proxy ? new HttpsProxyAgent(proxy) : undefined;

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
        console.log(`✅ Claim successful for ${wallet}`);
        saveClaimedWallet(wallet); // Save to claimed.txt
        console.log("Waiting 30 seconds before the next claim...");
        await new Promise(resolve => setTimeout(resolve, 30000));
    } catch (error) {
        console.log(`❌ Claim failed for ${wallet}: ${error.message}`);
    }
}

async function startAutoClaim() {
    let proxies = loadProxies(PROXY_FILE);
 Ascyn
    while (true) {
        resetIfNewDay(); // Check and reset if it's a new day
        let wallets = loadWallets(WALLET_FILE);
        let claimedWallets = loadClaimedWallets(CLAIMED_FILE);
        for (let wallet of wallets) {
            let proxy = getRandomProxy(proxies);
            await claimFaucet(wallet, proxy, claimedWallets);
        }
        console.log("⏳ Waiting 24 hours and 3 minutes before claiming again...");
        await new Promise(resolve => setTimeout(resolve, (86400 + 180) * 1000));
    }
}

startAutoClaim();
