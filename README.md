Faucet Initia Auto Claim Bot
Skrip ini secara otomatis mengklaim faucet untuk wallet di jaringan testnet Initia menggunakan solusi CAPTCHA dari 2Captcha.


🛠 Persyaratan
Node.js (Disarankan versi terbaru)
Akun 2Captcha (untuk API key)
Wallet testnet Initia


📥 Instalasi

Clone repository ini:
```
git clone https://github.com/kontia1/Faucet-Initia.git
cd Faucet-Initia
```

Instal dependensi:
```
npm install axios fs https-proxy-agent
```

Konfigurasi API Key
Edit file bot.js dan masukkan API key 2Captcha Anda di bagian ini:
```
nano bot.js
```
const API_KEY = "API_KEY_ANDA";

Tambahkan Wallet
```
nano wallet.txt
```
Buat atau edit file wallet.txt dan masukkan satu atau lebih alamat wallet Initia (satu per baris).

▶️ Menjalankan Skrip
Jalankan perintah berikut untuk memulai bot:
```
node bot.js
```

Bot akan terus berjalan dan mengklaim faucet untuk semua wallet yang ada di wallet.txt.

Tambahan Optional
```
nano proxy.txt
```

jika ingin menambahkan proxy
