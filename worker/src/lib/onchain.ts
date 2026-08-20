import type { Env } from '../env';

// Official USDT contract addresses — verified against BscScan/Tron's
// own listings. Never trust a contract address passed in from a
// request; these are the only two Visora will ever credit against.
const TRC20_USDT_CONTRACT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
const TRC20_USDT_DECIMALS = 6;

const BEP20_USDT_CONTRACT = '0x55d398326f99059fF775485246999027B3197955';
const BEP20_USDT_DECIMALS = 18;

// USDT is treated 1:1 with USD, same simplification every stablecoin
// payment gateway makes. The tolerance absorbs whatever rounding the
// payer's wallet did when computing the transfer amount — it is not
// meant to forgive a materially short payment.
const AMOUNT_TOLERANCE_USD = 0.02;

export interface OnchainVerifyResult {
  valid: boolean;
  error?: string;
  amount?: number;
}

interface TronTrc20Transfer {
  transaction_id: string;
  to_address: string;
  contract_address: string;
  quant: string;
  confirmed: boolean;
  contractRet?: string;
}

/**
 * Verifies a claimed USDT-TRC20 payment by looking the tx hash up in
 * TronScan's own list of recent transfers *into our wallet* — rather
 * than trusting anything the caller sends beyond the hash — and
 * checking token, recipient, confirmation, and amount all line up.
 */
export async function verifyTronUsdtPayment(
  env: Env,
  txHash: string,
  expectedAmountUsd: number
): Promise<OnchainVerifyResult> {
  if (!env.USDT_TRC20_WALLET) return { valid: false, error: 'TRC20 wallet is not configured.' };

  const url = new URL('https://apilist.tronscanapi.com/api/token_trc20/transfers');
  url.searchParams.set('relatedAddress', env.USDT_TRC20_WALLET);
  url.searchParams.set('contract_address', TRC20_USDT_CONTRACT);
  url.searchParams.set('limit', '50');
  url.searchParams.set('start', '0');

  const headers: Record<string, string> = {};
  if (env.TRONSCAN_API_KEY) headers['TRON-PRO-API-KEY'] = env.TRONSCAN_API_KEY;

  let res: Response;
  try {
    res = await fetch(url.toString(), { headers });
  } catch (err) {
    console.error('TronScan request threw', err);
    return { valid: false, error: 'Could not reach TronScan right now. Try again in a moment.' };
  }
  if (!res.ok) {
    console.error('TronScan request failed', res.status, await res.text());
    return { valid: false, error: 'Could not verify with TronScan right now. Try again in a moment.' };
  }

  const data = (await res.json()) as { token_transfers?: TronTrc20Transfer[] };
  const match = (data.token_transfers ?? []).find((t) => t.transaction_id === txHash);

  if (!match) {
    return {
      valid: false,
      error: 'Transaction not found among recent transfers to this wallet yet. If you just sent it, wait a minute and try again.',
    };
  }
  if (!match.confirmed || (match.contractRet && match.contractRet !== 'SUCCESS')) {
    return { valid: false, error: 'Transaction is not confirmed yet, or did not succeed on-chain.' };
  }
  if (match.to_address !== env.USDT_TRC20_WALLET || match.contract_address !== TRC20_USDT_CONTRACT) {
    return { valid: false, error: 'Transaction does not pay USDT-TRC20 to the expected wallet.' };
  }

  const amount = Number(match.quant) / 10 ** TRC20_USDT_DECIMALS;
  if (amount + AMOUNT_TOLERANCE_USD < expectedAmountUsd) {
    return { valid: false, error: `Amount too low: received ${amount.toFixed(2)} USDT, expected ${expectedAmountUsd.toFixed(2)}.` };
  }

  return { valid: true, amount };
}

interface BscTokenTx {
  hash: string;
  to: string;
  value: string;
  tokenDecimal: string;
  contractAddress: string;
  confirmations: string;
}

/**
 * Same idea for BEP20 — BscScan's `tokentx` endpoint (the Etherscan-
 * family standard) lists ERC20/BEP20 transfers for our wallet; we
 * match by hash rather than trusting a self-reported amount.
 */
export async function verifyBscUsdtPayment(
  env: Env,
  txHash: string,
  expectedAmountUsd: number
): Promise<OnchainVerifyResult> {
  if (!env.USDT_BEP20_WALLET) return { valid: false, error: 'BEP20 wallet is not configured.' };
  if (!env.BSCSCAN_API_KEY) return { valid: false, error: 'BSC verification is not configured.' };

  const url = new URL('https://api.bscscan.com/api');
  url.searchParams.set('module', 'account');
  url.searchParams.set('action', 'tokentx');
  url.searchParams.set('contractaddress', BEP20_USDT_CONTRACT);
  url.searchParams.set('address', env.USDT_BEP20_WALLET);
  url.searchParams.set('page', '1');
  url.searchParams.set('offset', '50');
  url.searchParams.set('sort', 'desc');
  url.searchParams.set('apikey', env.BSCSCAN_API_KEY);

  let res: Response;
  try {
    res = await fetch(url.toString());
  } catch (err) {
    console.error('BscScan request threw', err);
    return { valid: false, error: 'Could not reach BscScan right now. Try again in a moment.' };
  }
  if (!res.ok) {
    console.error('BscScan request failed', res.status, await res.text());
    return { valid: false, error: 'Could not verify with BscScan right now. Try again in a moment.' };
  }

  const data = (await res.json()) as { status: string; result?: BscTokenTx[] };
  const list = Array.isArray(data.result) ? data.result : [];
  const match = list.find((t) => t.hash.toLowerCase() === txHash.toLowerCase());

  if (!match) {
    return {
      valid: false,
      error: 'Transaction not found among recent transfers to this wallet yet. If you just sent it, wait a minute and try again.',
    };
  }
  if (match.to.toLowerCase() !== env.USDT_BEP20_WALLET.toLowerCase() || match.contractAddress.toLowerCase() !== BEP20_USDT_CONTRACT.toLowerCase()) {
    return { valid: false, error: 'Transaction does not pay USDT-BEP20 to the expected wallet.' };
  }
  if (Number(match.confirmations) < 1) {
    return { valid: false, error: 'Transaction has no confirmations yet. Try again in a moment.' };
  }

  const decimals = Number(match.tokenDecimal) || BEP20_USDT_DECIMALS;
  const amount = Number(match.value) / 10 ** decimals;
  if (amount + AMOUNT_TOLERANCE_USD < expectedAmountUsd) {
    return { valid: false, error: `Amount too low: received ${amount.toFixed(2)} USDT, expected ${expectedAmountUsd.toFixed(2)}.` };
  }

  return { valid: true, amount };
}
