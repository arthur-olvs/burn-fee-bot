import "dotenv/config";
import { ethers } from "ethers";
import { must } from "../src/utils.js";
import { feeLockerAbi } from "../src/clanker.js";
import { FEE_LOCKER, WETH } from "../src/chain.js";

const rpc = must(process.env.BASE_RPC_URLS, "BASE_RPC_URLS").split(",")[0]!.trim();
const priv = must(process.env.DEV_PRIVATE_KEY, "DEV_PRIVATE_KEY");

const provider = new ethers.JsonRpcProvider(rpc);
const wallet = new ethers.Wallet(priv, provider);

const feeLocker = new ethers.Contract(FEE_LOCKER, feeLockerAbi, provider);

const feeOwner = wallet.address;
const pending: bigint = await feeLocker.availableFees(feeOwner, WETH);

console.log("feeOwner:", feeOwner);
console.log("pendingWETH:", ethers.formatEther(pending));
