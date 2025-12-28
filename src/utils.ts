import { ethers } from "ethers";
export function must(v: string | undefined, name: string): string {
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export function randInt(min: number, max: number) {
  const lo = Math.min(min, max);
  const hi = Math.max(min, max);
  return lo + Math.floor(Math.random() * (hi - lo + 1));
}

export function nowSec() {
  return Math.floor(Date.now() / 1000);
}

export function toBool(v: string | undefined, def = false) {
  if (v === undefined) return def;
  const s = v.trim().toLowerCase();
  return s === "1" || s === "true" || s === "yes" || s === "y";
}

export function isAddress(a: string) {
  const cleaned = (a ?? "").trim().replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");
  return ethers.isAddress(cleaned);
}

export function bpsOf(amount: bigint, bps: number): bigint {
  return (amount * BigInt(bps)) / 10000n;
}
