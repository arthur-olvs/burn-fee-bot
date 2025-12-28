import { CHAIN_ID, WETH } from "./chain.js";

export type ZeroExQuote = {
  allowanceTarget: string;
  buyAmount: string;
  transaction: {
    to: string;
    data: string;
    value?: string;
    gas?: string;
  };
};

export async function get0xQuote(params: {
  zeroexApiKey: string;
  taker: string;
  buyToken: string;
  sellAmountWei: bigint;
  slippageBps: number;
}): Promise<ZeroExQuote> {
  const url = new URL("https://api.0x.org/swap/allowance-holder/quote");
  url.searchParams.set("chainId", String(CHAIN_ID));
  url.searchParams.set("sellToken", WETH);
  url.searchParams.set("buyToken", params.buyToken);
  url.searchParams.set("sellAmount", params.sellAmountWei.toString());
  url.searchParams.set("taker", params.taker);
  url.searchParams.set("slippageBps", String(params.slippageBps));

  const res = await fetch(url, {
    headers: {
      "0x-api-key": params.zeroexApiKey,
      "0x-version": "v2"
    }
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`0x quote failed (${res.status}): ${txt}`);
  }
  return (await res.json()) as ZeroExQuote;
}
