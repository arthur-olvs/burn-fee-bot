import { ethers } from "ethers";
import { loadConfig } from "./config.js";
import { loadState, saveState } from "./state.js";
import { makeLogger } from "./log.js";
import { randInt, sleep, nowSec, bpsOf } from "./utils.js";
import { makeProvider, assertBase, WETH } from "./chain.js";
import { feeLockerContract, claimedAmountFromReceipt } from "./clanker.js";
import { erc20 } from "./erc20.js";
import { get0xQuote } from "./zeroex.js";

function fmtEth(wei: bigint) {
  return ethers.formatEther(wei);
}

async function main() {
  const cfg = loadConfig();
  const log = makeLogger(cfg.debug);
  const state = loadState(cfg.stateFile);

  const minClaimWei = ethers.parseEther(cfg.minClaimWeth);
  const minWalletSwapWei = ethers.parseEther(cfg.minWalletSwapWeth);
  const minGasWei = ethers.parseEther(cfg.minNativeEthForGas);

  let rpcIndex = state.rpcIndex ?? 0;
  let consecutiveErrors = state.consecutiveErrors ?? 0;

  const banner = async (walletAddr: string) => {
    console.log("\n✅ clanker-fee-buyback-bot rodando");
    console.log("  feeOwner/dev      :", walletAddr);
    console.log("  BUY_TOKEN         :", cfg.buyToken);
    console.log("  MIN_CLAIM_WETH    :", cfg.minClaimWeth);
    console.log("  MIN_WALLET_SWAP   :", cfg.minWalletSwapWeth);
    console.log("  SLIPPAGE_BPS      :", cfg.slippageBps);
    console.log("  CHECK_INTERVAL_S  :", `${cfg.checkMinS}..${cfg.checkMaxS}`);
    console.log("  CLAIM_COOLDOWN_S  :", cfg.claimCooldownS);
    console.log("  SWAP_COOLDOWN_S   :", cfg.swapCooldownS);
    console.log("  MIN_GAS_ETH       :", cfg.minNativeEthForGas);
    console.log("  SWAP_ONLY_CLAIMED :", cfg.swapOnlyClaimed ? 1 : 0);
    console.log("  SWAP_FROM_WALLET  :", cfg.swapFromWallet ? 1 : 0);
    console.log("  AUTO_BURN         :", cfg.autoBurn ? 1 : 0);
    console.log("  BURN_ADDRESS      :", cfg.burnAddress);
    console.log("  TIP_ENABLED       :", cfg.tipEnabled ? 1 : 0);
    console.log("  TIP_BPS           :", cfg.tipBps);
    console.log("  TIP_ADDRESS       :", cfg.tipAddress);
    console.log("  TIP_MODE          :", cfg.tipMode);
    console.log("  DRY_RUN           :", cfg.dryRun ? 1 : 0);
    console.log("  RPCS              :", cfg.rpcUrls.length);
    console.log("  STATE_FILE        :", cfg.stateFile);
  };

  const rotateRpc = () => {
    rpcIndex = (rpcIndex + 1) % cfg.rpcUrls.length;
    state.rpcIndex = rpcIndex;
    saveState(cfg.stateFile, { ...state, consecutiveErrors, rpcIndex });
    log.warn(`RPC rotate -> [${rpcIndex}] ${cfg.rpcUrls[rpcIndex]}`);
  };

  const getProviderWallet = async () => {
    const rpc = cfg.rpcUrls[rpcIndex]!;
    const provider = makeProvider(rpc);
    await assertBase(provider);
    const wallet = new ethers.Wallet(cfg.devPrivateKey, provider);
    return { provider, wallet };
  };

  // Print banner once with resolved address
  {
    const { wallet } = await getProviderWallet();
    await banner(wallet.address);
  }

  while (true) {
    const waitS = randInt(cfg.checkMinS, cfg.checkMaxS);

    try {
      const { provider, wallet } = await getProviderWallet();
      const feeOwner = wallet.address;

      const feeLocker = feeLockerContract(wallet);
      const weth = erc20(WETH, wallet);
      const buyToken = erc20(cfg.buyToken, wallet);

      // gas check
      const nativeBal = await provider.getBalance(feeOwner);
      if (nativeBal < minGasWei) {
        log.warn(`[gas] ETH nativo baixo: ${fmtEth(nativeBal)} < ${cfg.minNativeEthForGas}. Skip.`);
        await sleep(waitS * 1000);
        continue;
      }

      // 1) pending fees
      const pending: bigint = await feeLocker.availableFees(feeOwner, WETH);
      log.info(`[fees] pending=${fmtEth(pending)} min=${cfg.minClaimWeth}`);

      const now = nowSec();

      // 2) claim
      let claimedThisRound = 0n;

      const lastClaimAt = state.lastClaimAt ?? 0;
      const claimCooldownOk = now - lastClaimAt >= cfg.claimCooldownS;

      if (pending >= minClaimWei && claimCooldownOk) {
        if (cfg.dryRun) {
          log.info(`[claim] DRY_RUN=1 -> simular claim (não envia).`);
          claimedThisRound = pending;
        } else {
          log.info(`[claim] enviando...`);
          const tx = await feeLocker.claim(feeOwner, WETH);
          const receipt = await tx.wait(cfg.confirmations);
          if (!receipt) throw new Error("claim receipt null");

          claimedThisRound = claimedAmountFromReceipt(receipt, WETH, feeOwner);

          state.lastClaimAt = nowSec();
          saveState(cfg.stateFile, { ...state, consecutiveErrors, rpcIndex });

          log.info(`[claim] mined: ${receipt.hash} claimed=${fmtEth(claimedThisRound)}`);
        }
      } else {
        if (pending < minClaimWei) log.debug(`[claim] abaixo do mínimo.`);
        if (!claimCooldownOk) log.debug(`[claim] cooldown ativo -> skip`);
      }

      // 3) balances
      const wethBal: bigint = await weth.balanceOf(feeOwner);
      log.info(`[wallet] WETH_balance=${fmtEth(wethBal)} minWalletSwap=${cfg.minWalletSwapWeth}`);

      // TIP: transparent + optional
      let tipWei = 0n;
      if (cfg.tipEnabled && cfg.tipBps > 0) {
        const baseForTip =
          cfg.tipMode === "claim" ? claimedThisRound : wethBal;

        tipWei = bpsOf(baseForTip, cfg.tipBps);

        // in claim mode, never exceed claimed amount
        if (cfg.tipMode === "claim" && tipWei > claimedThisRound) tipWei = claimedThisRound;

        if (tipWei > 0n) {
          if (cfg.dryRun) {
            log.warn(`[tip] DRY_RUN=1 -> tip seria ${fmtEth(tipWei)} WETH -> ${cfg.tipAddress}`);
          } else {
            log.info(`[tip] enviando ${fmtEth(tipWei)} WETH (${cfg.tipBps} bps) -> ${cfg.tipAddress}`);
            const txTip = await weth.transfer(cfg.tipAddress, tipWei);
            await txTip.wait(cfg.confirmations);
            log.info(`[tip] mined`);
          }
        }
      }

      // 4) decide amountToSwap
      const lastSwapAt = state.lastSwapAt ?? 0;
      const swapCooldownOk = nowSec() - lastSwapAt >= cfg.swapCooldownS;

      let amountToSwap = 0n;

      if (cfg.swapOnlyClaimed) {
        amountToSwap = claimedThisRound;
        if (cfg.swapFromWallet && amountToSwap === 0n && wethBal >= minWalletSwapWei) {
          amountToSwap = wethBal;
          log.info(`[swap] swapando da wallet (fallback)`);
        }

        // if tipMode=claim, subtract tip from claimed swap budget
        if (cfg.tipEnabled && cfg.tipBps > 0 && cfg.tipMode === "claim") {
          amountToSwap = amountToSwap > tipWei ? (amountToSwap - tipWei) : 0n;
        }
      } else {
        if (wethBal >= minWalletSwapWei) amountToSwap = wethBal;

        // if tipMode=wallet, tip already left (or would leave) from wallet, no subtraction needed
      }

      if (amountToSwap === 0n) {
        log.info(`[swap] nada para swapar.`);
        consecutiveErrors = 0;
        saveState(cfg.stateFile, { ...state, consecutiveErrors: 0, rpcIndex });
        log.info(`[sleep] ${waitS}s`);
        await sleep(waitS * 1000);
        continue;
      }

      if (!swapCooldownOk) {
        log.info(`[swap] cooldown ativo -> skip`);
        log.info(`[sleep] ${waitS}s`);
        await sleep(waitS * 1000);
        continue;
      }

      // 5) 0x quote
      log.info(`[swap] amountIn=${fmtEth(amountToSwap)} sell=WETH buy=${cfg.buyToken}`);
      const quote = await get0xQuote({
        zeroexApiKey: cfg.zeroexApiKey,
        taker: feeOwner,
        buyToken: cfg.buyToken,
        sellAmountWei: amountToSwap,
        slippageBps: cfg.slippageBps,
      });

      log.debug(`[0x] buyAmount=${quote.buyAmount}`);
      log.debug(`[0x] allowanceTarget=${quote.allowanceTarget}`);

      if (cfg.dryRun) {
        log.warn(`🧪 DRY_RUN=1 -> não vou aprovar nem enviar swap.`);
        consecutiveErrors = 0;
        saveState(cfg.stateFile, { ...state, consecutiveErrors: 0, rpcIndex });
        log.info(`[sleep] ${waitS}s`);
        await sleep(waitS * 1000);
        continue;
      }

      // 6) approve if needed
      const allowanceTarget = quote.allowanceTarget;
      const allowance: bigint = await weth.allowance(feeOwner, allowanceTarget);

      if (allowance < amountToSwap) {
        const approveAmt = cfg.approveMax ? ethers.MaxUint256 : amountToSwap;
        log.info(`[approve] enviando approve (${cfg.approveMax ? "MaxUint256" : "needed"})...`);
        const txA = await weth.approve(allowanceTarget, approveAmt);
        await txA.wait(cfg.confirmations);
        log.info(`[approve] mined`);
      } else {
        log.debug(`[allowance] ok`);
      }

      // 7) send swap tx
      const t = quote.transaction;
      log.info(`[swap] enviando tx...`);
      const tx2 = await wallet.sendTransaction({
        to: t.to,
        data: t.data,
        value: BigInt(t.value ?? "0"),
        gasLimit: t.gas ? (BigInt(t.gas) * 120n) / 100n : undefined,
      });
      const r2 = await tx2.wait(cfg.confirmations);
      if (!r2) throw new Error("swap receipt null");

      state.lastSwapAt = nowSec();
      saveState(cfg.stateFile, { ...state, consecutiveErrors: 0, rpcIndex });
      log.info(`[swap] mined: ${r2.hash} ✅ swap concluído`);

      // 8) auto burn (send bought tokens to dead)
      if (cfg.autoBurn) {
        const balToken: bigint = await buyToken.balanceOf(feeOwner);
        if (balToken > 0n) {
          log.info(`[burn] transferindo tokens -> ${cfg.burnAddress}`);
          const txB = await buyToken.transfer(cfg.burnAddress, balToken);
          const rb = await txB.wait(cfg.confirmations);
          log.info(`[burn] mined: ${rb?.hash ?? "ok"}`);
        } else {
          log.info(`[burn] balance 0, skip`);
        }
      }

      consecutiveErrors = 0;
      saveState(cfg.stateFile, { ...state, consecutiveErrors: 0, rpcIndex });

    } catch (e: any) {
      const msg = e?.message ?? String(e);
      log.error(`ERR: ${msg}`);

      consecutiveErrors += 1;
      saveState(cfg.stateFile, { ...state, consecutiveErrors, rpcIndex });

      const m = msg.toLowerCase();
      if (m.includes("rate") || m.includes("timeout") || m.includes("429") || m.includes("gateway")) {
        rotateRpc();
      }

      if (consecutiveErrors >= cfg.maxConsecutiveErrors) {
        throw new Error(`MAX_CONSECUTIVE_ERRORS atingido: ${consecutiveErrors}`);
      }
    }

    log.info(`[sleep] ${waitS}s`);
    await sleep(waitS * 1000);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
