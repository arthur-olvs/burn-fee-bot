import fs from "node:fs";

export type BotState = {
  lastClaimAt?: number; // unix sec
  lastSwapAt?: number;  // unix sec
  consecutiveErrors?: number;
  rpcIndex?: number;
};

export function loadState(path: string): BotState {
  try {
    return JSON.parse(fs.readFileSync(path, "utf8"));
  } catch {
    return {};
  }
}

export function saveState(path: string, s: BotState) {
  fs.writeFileSync(path, JSON.stringify(s, null, 2));
}
