Faucet Initia Auto Claim Bot
This script automatically claims faucets for wallets on the Initia testnet using CAPTCHA solutions from 2Captcha.


 Requirements
Node.js: Recommended to use the latest version.

2Captcha Account: Required for obtaining an API key.

Initia Testnet Wallet: One or more wallet addresses for claiming.


📥 Installation

Clone the Repository
```
git clone https://github.com/airdropbomb/Faucet-Initia.git
cd Faucet-Initia
```

Install Dependencies

```
npm install axios fs https-proxy-agent
```

Configure API Key

```
nano bot.js
```
Locate the following line and replace "YOUR_API_KEY" with your 2Captcha API key:

const API_KEY = "YOUR_API_KEY";

Save and exit the file.


Add Wallet Addresses

```
nano wallet.txt
```
Add one or more Initia testnet wallet addresses (one per line), for example:

init1xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
init1yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy

Save and exit the file.


▶️ Running the Script

Start the bot with the following command:

```
node bot.js
```

The bot will:
Automatically solve CAPTCHAs using 2Captcha.

Claim faucets for all wallets listed in wallet.txt.

Run continuously, pausing 24 hours and 3 minutes between claim cycles.


Optional: Using Proxies
If you want to use proxies for anonymity or rate limiting:

Create or edit the proxy.txt file:

```
nano proxy.txt
```
Add proxy addresses (one per line), for example:

http://username:password@proxy1.example.com:port
http://username:password@proxy2.example.com:port

Save and exit. The script will randomly select a proxy from this list for each claim attempt.


