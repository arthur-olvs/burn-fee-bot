Clanker Fee Buyback Bot (Base) — PT-BR / EN-US
🇧🇷 PT-BR
O que é

Um bot self-custodial (você roda com a sua própria wallet) para a rede Base que:

verifica fees pendentes no Clanker Fee Locker

faz claim dessas fees (geralmente em WETH)

faz swap via 0x Swap API de WETH → BUY_TOKEN

(opcional) envia os tokens comprados para um endereço de burn (0x...dEaD)

(opcional) aplica um tip transparente (desligado por padrão / opt-in)

Importante: este projeto não guarda chaves de ninguém. Você roda localmente ou em VPS, com sua própria .env.

Aviso de segurança (leia)

NUNCA use a wallet principal. Crie uma wallet dedicada só para este bot.

NUNCA compartilhe sua private key.

Tenha sempre ETH nativo na Base suficiente para pagar gas.

Rode primeiro com DRY_RUN=1 para validar tudo.

Requisitos

Node.js 20+ (recomendado)

Wallet na Base com ETH nativo (gas)

RPC (Alchemy recomendado) e uma chave de API da 0x

Quickstart (rodar local)
git clone <SEU_REPO>
cd burn-fee-bot
npm install
cp .env.example .env


Edite .env com seus valores:

BASE_RPC_URLS

DEV_PRIVATE_KEY

ZEROEX_API_KEY

BUY_TOKEN

Rode em modo seguro:

npm run dev

Modo seguro vs produção

Modo seguro (não envia transações)

DRY_RUN="1"


Produção (envia transações)

DRY_RUN="0"
DEBUG="0"
MIN_NATIVE_ETH_FOR_GAS="0.001"  # ou 0.005 se quiser bem conservador

Configuração (.env)

Obrigatórias

BASE_RPC_URLS — URLs separadas por vírgula (fallback)

DEV_PRIVATE_KEY — private key da wallet que assina (feeOwner)

ZEROEX_API_KEY — sua chave da 0x

BUY_TOKEN — token que você quer comprar com as fees

Segurança / comportamento

MIN_NATIVE_ETH_FOR_GAS — mínimo de ETH nativo na Base para enviar tx

SLIPPAGE_BPS — slippage em bps (200 = 2%)

CHECK_INTERVAL_MIN_S / CHECK_INTERVAL_MAX_S — intervalo randômico (anti-pattern)

CLAIM_COOLDOWN_S / SWAP_COOLDOWN_S — evita spam e problemas de nonce

CONFIRMATIONS — confirmações para considerar tx “ok” (1 a 2)

Auto-burn (opcional)

AUTO_BURN="1"
BURN_ADDRESS="0x000000000000000000000000000000000000dEaD"

Rodar 24/7 (VPS)

Você pode rodar em uma VPS (AWS Lightsail, Hetzner, DigitalOcean, etc).

Opção A — PM2 (recomendado)

Build:

npm run build


Instala PM2:

npm i -g pm2


Start:

pm2 start ecosystem.config.cjs --only buyback
pm2 save
pm2 startup


Logs:

pm2 logs buyback


Restart:

pm2 restart buyback


Dica: rode apenas uma instância por wallet para evitar conflitos de nonce.

Opção B — Docker (bom para padronizar)
cp .env.example .env
# edite .env
docker compose up -d --build
docker compose logs -f

Troubleshooting

“ETH nativo baixo”: envie ETH nativo na Base para a wallet (gas) ou ajuste MIN_NATIVE_ETH_FOR_GAS.

Nonce / tx stuck: verifique se não tem mais de uma instância rodando com a mesma wallet.

RPC instável: use fallback em BASE_RPC_URLS (2 ou mais endpoints).

🇺🇸 EN-US
What is this?

A self-custodial bot (you run it with your own wallet) for Base that:

checks pending fees on Clanker Fee Locker

claims those fees (usually WETH)

swaps WETH → BUY_TOKEN using the 0x Swap API

(optional) sends purchased tokens to a burn address (0x...dEaD)

(optional) supports a transparent tip (OFF by default / opt-in)

Important: this project does not custody keys. You run it locally or on a VPS with your own .env.

Security warning (read this)

Never use your main wallet. Create a dedicated wallet for the bot.

Never share your private key.

Keep enough native Base ETH for gas.

Start with DRY_RUN=1 to validate everything first.

Requirements

Node.js 20+ (recommended)

A Base wallet funded with native ETH (gas)

RPC (Alchemy recommended) + a 0x API key

Quickstart (local run)
git clone <YOUR_REPO>
cd burn-fee-bot
npm install
cp .env.example .env


Edit .env:

BASE_RPC_URLS

DEV_PRIVATE_KEY

ZEROEX_API_KEY

BUY_TOKEN

Run:

npm run dev

Safe mode vs production mode

Safe mode (no transactions)

DRY_RUN="1"


Production mode (sends transactions)

DRY_RUN="0"
DEBUG="0"
MIN_NATIVE_ETH_FOR_GAS="0.001"  # or 0.005 if you want to be extra conservative

Configuration (.env)

Required

BASE_RPC_URLS — comma-separated endpoints (fallback)

DEV_PRIVATE_KEY — signing wallet private key (feeOwner)

ZEROEX_API_KEY — your 0x API key

BUY_TOKEN — token you want to buy with fees

Safety / behavior

MIN_NATIVE_ETH_FOR_GAS — minimum Base native ETH required to send txs

SLIPPAGE_BPS — slippage in bps (200 = 2%)

CHECK_INTERVAL_MIN_S / CHECK_INTERVAL_MAX_S — randomized polling interval

CLAIM_COOLDOWN_S / SWAP_COOLDOWN_S — avoids spam & nonce issues

CONFIRMATIONS — confirmations to consider tx final (1–2)

Auto-burn (optional)

AUTO_BURN="1"
BURN_ADDRESS="0x000000000000000000000000000000000000dEaD"

Run 24/7 (VPS)

You can run this on a VPS (AWS Lightsail, Hetzner, DigitalOcean, etc).

Option A — PM2 (recommended)

Build:

npm run build


Install PM2:

npm i -g pm2


Start:

pm2 start ecosystem.config.cjs --only buyback
pm2 save
pm2 startup


Logs:

pm2 logs buyback


Restart:

pm2 restart buyback


Tip: run one instance per wallet to avoid nonce conflicts.

Option B — Docker
cp .env.example .env
# edit .env
docker compose up -d --build
docker compose logs -f

Troubleshooting

“Low native ETH for gas”: fund your wallet with Base ETH or lower MIN_NATIVE_ETH_FOR_GAS (not recommended for production).

Nonce / stuck tx: make sure you’re not running multiple instances using the same wallet.

Unstable RPC: add fallback URLs to BASE_RPC_URLS.
