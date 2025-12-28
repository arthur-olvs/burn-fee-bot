README.md (PT-BR / EN)
🇧🇷 PT-BR — Clanker Fee Buyback Bot (Base)
O que é

Um bot em Node.js/TypeScript que:

monitora fees pendentes no Clanker Fee Locker (Base),

faz claim (normalmente em WETH),

usa a 0x Swap API para trocar WETH → BUY_TOKEN,

(opcional) envia os tokens comprados para um endereço de burn (0x...dead),

(opcional) aplica um “tip” transparente (desligado por padrão).

⚠️ Segurança: NUNCA compartilhe sua private key. Rode por sua conta e risco.

Requisitos

Node.js 20+

Uma wallet com ETH nativo na Base para gas

Chave de RPC (Alchemy recomendado) ou use fallback público

Chave da 0x API

Instalação
git clone <SEU_REPO>
cd burn-fee-bot
npm i


Crie seu .env:

cp .env.example .env


Edite .env e preencha:

BASE_RPC_URLS

DEV_PRIVATE_KEY

ZEROEX_API_KEY

BUY_TOKEN

Rodar em modo seguro (sem enviar transações)

No .env:

DRY_RUN="1"


Rodar:

npm run dev

Rodar em produção (enviando transações)

No .env:

DRY_RUN="0"
DEBUG="0"
MIN_NATIVE_ETH_FOR_GAS="0.001"  # ou 0.005


Rodar:

npm run build
npm start

Comandos úteis

Rodar dev:

npm run dev


Build + start:

npm run build
npm start


Checar fees pendentes:

npm run check:pending

Configuração (.env)

Obrigatórias

BASE_RPC_URLS (separe por vírgula para fallback)

DEV_PRIVATE_KEY

ZEROEX_API_KEY

BUY_TOKEN

Recomendadas (segurança)

MIN_NATIVE_ETH_FOR_GAS (evita tx travando por falta de gas)

SLIPPAGE_BPS (recomendado 50–300)

CHECK_INTERVAL_MIN_S / CHECK_INTERVAL_MAX_S (intervalo randômico)

CLAIM_COOLDOWN_S / SWAP_COOLDOWN_S (anti-spam)

Auto-burn (opcional)

AUTO_BURN="1"
BURN_ADDRESS="0x000000000000000000000000000000000000dEaD"

Dicas de operação

Sempre rode uma instância por wallet (evita erro de nonce).

Deixe DRY_RUN=1 até confirmar tudo.

Garanta ETH nativo suficiente na Base para gas.

Use RPC com fallback para evitar downtime.

🇺🇸 EN — Clanker Fee Buyback Bot (Base)
What it is

A Node.js/TypeScript bot that:

monitors pending fees on Clanker Fee Locker (Base),

claims fees (usually in WETH),

uses 0x Swap API to swap WETH → BUY_TOKEN,

(optional) sends purchased tokens to a burn address (0x...dead),

(optional) supports a transparent dev “tip” (OFF by default).

⚠️ Security: NEVER share your private key. Use at your own risk.

Requirements

Node.js 20+

A wallet funded with native Base ETH for gas

RPC key (Alchemy recommended) or public fallback

0x API key

Install
git clone <YOUR_REPO>
cd burn-fee-bot
npm i


Create .env:

cp .env.example .env


Edit .env and fill:

BASE_RPC_URLS

DEV_PRIVATE_KEY

ZEROEX_API_KEY

BUY_TOKEN

Safe mode (no transactions)

Set:

DRY_RUN="1"


Run:

npm run dev

Production mode (sends transactions)

Set:

DRY_RUN="0"
DEBUG="0"
MIN_NATIVE_ETH_FOR_GAS="0.001"  # or 0.005


Run:

npm run build
npm start

Useful commands

Dev:

npm run dev


Build + start:

npm run build
npm start


Check pending fees:

npm run check:pending

Configuration (.env)

Required

BASE_RPC_URLS (comma-separated for fallback)

DEV_PRIVATE_KEY

ZEROEX_API_KEY

BUY_TOKEN

Recommended (safety)

MIN_NATIVE_ETH_FOR_GAS

SLIPPAGE_BPS (recommended 50–300)

CHECK_INTERVAL_MIN_S / CHECK_INTERVAL_MAX_S

CLAIM_COOLDOWN_S / SWAP_COOLDOWN_S

Auto-burn (optional)

AUTO_BURN="1"
BURN_ADDRESS="0x000000000000000000000000000000000000dEaD"

Operational notes

Run one instance per wallet (prevents nonce issues).

Keep DRY_RUN=1 until everything is verified.

Ensure enough Base native ETH for gas.

Use RPC fallback to reduce downtime.