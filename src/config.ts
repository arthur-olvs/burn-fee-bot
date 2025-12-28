import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { must, toBool, isAddress } from "./utils.js";

// carrega .env do root do projeto (../.env a partir de /src)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, "..", ".env");

const res = dotenv.config({ path: envPath, override: true });
if (res.error) throw res.error;

export type BotConfig = {
  rpcUrls: string[];
  devPrivateKey: string;
  zeroexApiKey: string;

  buyToken: string;

  minClaimWeth: string;
  minWalletSwapWeth: string;
  slippageBps: number;

  checkMinS: number;
  checkMaxS: number;
  confirmations: number;

  minNativeEthForGas: string;

  claimCooldownS: number;
  swapCooldownS: number;

  maxConsecutiveErrors: number;

  swapOnlyClaimed: boolean;
  swapFromWallet: boolean;
  approveMax: boolean;

  dryRun: boolean;
  debug: boolean;

  autoBurn: boolean;
  burnAddress: string;

  // tip
  tipEnabled: boolean;
  tipBps: number;
  tipAddress: string;
  tipMode: "claim" | "wallet";

  stateFile: string;
};

function num(v: string | undefined, def: number) {
  const n = Number(v ?? `${def}`);
  return Number.isFinite(n) ? n : def;
}

export function loadConfig(): BotConfig {
  const rpcUrls = must(process.env.BASE_RPC_URLS, "BASE_RPC_URLS")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const buyToken = must(process.env.BUY_TOKEN, "BUY_TOKEN");
  if (!isAddress(buyToken)) throw new Error("BUY_TOKEN inválido.");

  const autoBurn = toBool(process.env.AUTO_BURN, false);
  const burnAddress = process.env.BURN_ADDRESS ?? "0x000000000000000000000000000000000000dEaD";
  if (autoBurn && !isAddress(burnAddress)) throw new Error("BURN_ADDRESS inválido.");

  const tipEnabled = toBool(process.env.TIP_ENABLED, false);
  const tipBps = num(process.env.TIP_BPS, 0);
  const tipAddress = (process.env.TIP_ADDRESS ?? "").trim();
  const tipMode = ((process.env.TIP_MODE ?? "claim").trim()) as "claim" | "wallet";

  if (tipEnabled) {
  if (!Number.isFinite(tipBps) || tipBps <= 0 || tipBps > 500) {
    throw new Error("TIP_BPS inválido. Use 1..500 (até 5%).");
  }

  if (!isAddress(tipAddress)) {
    throw new Error("TIP_ADDRESS inválido.");
  }

  if (tipAddress.toLowerCase() === "0x0000000000000000000000000000000000000000") {
    throw new Error("TIP_ADDRESS inválido.");
  }

  if (tipMode !== "claim" && tipMode !== "wallet") {
    throw new Error("TIP_MODE deve ser 'claim' ou 'wallet'.");
  }
}

  const slippageBps = num(process.env.SLIPPAGE_BPS, 200);
  if (!Number.isFinite(slippageBps) || slippageBps < 1 || slippageBps > 3000) {
    throw new Error("SLIPPAGE_BPS inválido (recomendado 50..300).");
  }

  const cfg: BotConfig = {
    rpcUrls,
    devPrivateKey: must(process.env.DEV_PRIVATE_KEY, "DEV_PRIVATE_KEY"),
    zeroexApiKey: must(process.env.ZEROEX_API_KEY, "ZEROEX_API_KEY"),

    buyToken,

    minClaimWeth: process.env.MIN_CLAIM_WETH ?? "0.0003",
    minWalletSwapWeth: process.env.MIN_WALLET_SWAP_WETH ?? "0.0003",
    slippageBps,

    checkMinS: Math.max(1, Math.floor(num(process.env.CHECK_INTERVAL_MIN_S, 10))),
    checkMaxS: Math.max(1, Math.floor(num(process.env.CHECK_INTERVAL_MAX_S, 120))),
    confirmations: Math.max(1, Math.floor(num(process.env.CONFIRMATIONS, 1))),

    minNativeEthForGas: process.env.MIN_NATIVE_ETH_FOR_GAS ?? "0.005",

    claimCooldownS: Math.max(0, Math.floor(num(process.env.CLAIM_COOLDOWN_S, 60))),
    swapCooldownS: Math.max(0, Math.floor(num(process.env.SWAP_COOLDOWN_S, 180))),

    maxConsecutiveErrors: Math.max(1, Math.floor(num(process.env.MAX_CONSECUTIVE_ERRORS, 10))),

    swapOnlyClaimed: toBool(process.env.SWAP_ONLY_CLAIMED, true),
    swapFromWallet: toBool(process.env.SWAP_FROM_WALLET, true),
    approveMax: toBool(process.env.APPROVE_MAX, true),

    dryRun: toBool(process.env.DRY_RUN, true),
    debug: toBool(process.env.DEBUG, false),

    autoBurn,
    burnAddress,

    tipEnabled,
    tipBps,
    tipAddress,
    tipMode,

    stateFile: process.env.STATE_FILE ?? ".bot_state.json",
  };

  return cfg;
}
