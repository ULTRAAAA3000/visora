import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, Loader2, ArrowLeft, Wallet, Landmark, PartyPopper } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import type { CreditPackage } from '../../lib/database.types';
import {
  fetchCreditPackages,
  fetchPaymentConfig,
  verifyCryptoPayment,
  requestBankInvoice,
  type CryptoNetwork,
  type PaymentConfig,
  type BankInvoiceDetails,
} from '../../lib/payments';

type Step = 'package' | 'method' | 'crypto' | 'bank' | 'bank_invoice' | 'success';

const NETWORK_LABEL: Record<CryptoNetwork, string> = { trc20: 'USDT · TRC20 (Tron)', bep20: 'USDT · BEP20 (BNB Chain)' };

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div>
      <p className="text-[11px] text-white/40 mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <code className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono truncate text-white/90">
          {value}
        </code>
        <button
          onClick={handleCopy}
          className="shrink-0 flex items-center justify-center w-8 h-8 rounded-lg liquid-glass hover:bg-white/10 transition-colors"
          aria-label={`Copy ${label}`}
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
}

export default function BuyCreditsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { profile, refreshProfile } = useAuth();

  const [step, setStep] = useState<Step>('package');
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [packagesLoading, setPackagesLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(null);

  const [config, setConfig] = useState<PaymentConfig | null>(null);
  const [network, setNetwork] = useState<CryptoNetwork>('trc20');
  const [txHash, setTxHash] = useState('');
  const [cryptoSubmitting, setCryptoSubmitting] = useState(false);
  const [cryptoError, setCryptoError] = useState<string | null>(null);

  const [billingName, setBillingName] = useState('');
  const [billingEmail, setBillingEmail] = useState('');
  const [bankSubmitting, setBankSubmitting] = useState(false);
  const [bankError, setBankError] = useState<string | null>(null);
  const [invoice, setInvoice] = useState<BankInvoiceDetails | null>(null);

  const [creditsAdded, setCreditsAdded] = useState(0);

  // Reset to a clean first step every time the modal is (re)opened,
  // and seed the bank form with the account's own email.
  useEffect(() => {
    if (!open) return;
    setStep('package');
    setSelectedPackage(null);
    setTxHash('');
    setCryptoError(null);
    setBankError(null);
    setInvoice(null);
    setBillingName('');
    setBillingEmail(profile?.email ?? '');

    setPackagesLoading(true);
    fetchCreditPackages()
      .then(setPackages)
      .catch((err) => console.error('Failed to load credit packages', err))
      .finally(() => setPackagesLoading(false));
  }, [open, profile?.email]);

  // Wallet addresses only cost a request the moment someone actually
  // picks the crypto tab, not on every modal open.
  useEffect(() => {
    if (step !== 'crypto' || config) return;
    fetchPaymentConfig()
      .then(setConfig)
      .catch((err) => setCryptoError(err instanceof Error ? err.message : 'Could not load wallet addresses.'));
  }, [step, config]);

  if (!profile) return null;

  const handlePickPackage = (pkg: CreditPackage) => {
    setSelectedPackage(pkg);
    setStep('method');
  };

  const handleVerifyCrypto = async () => {
    if (!selectedPackage || !txHash.trim()) return;
    setCryptoSubmitting(true);
    setCryptoError(null);
    try {
      const result = await verifyCryptoPayment(profile.api_key, {
        package_id: selectedPackage.id,
        network,
        tx_hash: txHash.trim(),
      });
      setCreditsAdded(result.credits_added);
      setStep('success');
      await refreshProfile();
    } catch (err) {
      setCryptoError(err instanceof Error ? err.message : 'Could not verify this transaction.');
    } finally {
      setCryptoSubmitting(false);
    }
  };

  const handleRequestInvoice = async () => {
    if (!selectedPackage || !billingName.trim() || !billingEmail.trim()) return;
    setBankSubmitting(true);
    setBankError(null);
    try {
      const details = await requestBankInvoice(profile.api_key, {
        package_id: selectedPackage.id,
        billing_name: billingName.trim(),
        billing_email: billingEmail.trim(),
      });
      setInvoice(details);
      setStep('bank_invoice');
    } catch (err) {
      setBankError(err instanceof Error ? err.message : 'Could not create the invoice.');
    } finally {
      setBankSubmitting(false);
    }
  };

  const goBack = () => {
    if (step === 'method') setStep('package');
    else if (step === 'crypto' || step === 'bank') setStep('method');
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
            className="fixed top-[10vh] left-1/2 -translate-x-1/2 z-[71] w-[92vw] max-w-md"
          >
            <div className="rounded-2xl border border-white/10 bg-[#0a0a0a] shadow-2xl overflow-hidden max-h-[80vh] flex flex-col">
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-2">
                  {(step === 'method' || step === 'crypto' || step === 'bank') && (
                    <button onClick={goBack} className="text-white/40 hover:text-white transition-colors" aria-label="Back">
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                  )}
                  <h2 className="text-sm font-medium text-white">
                    {step === 'package' && 'Buy credits'}
                    {step === 'method' && selectedPackage && `${selectedPackage.credits.toLocaleString('en-US')} credits — $${Number(selectedPackage.price_usd).toFixed(2)}`}
                    {step === 'crypto' && 'Pay with USDT'}
                    {step === 'bank' && 'Bank transfer'}
                    {step === 'bank_invoice' && 'Transfer details'}
                    {step === 'success' && 'Payment received'}
                  </h2>
                </div>
                <button onClick={onClose} className="text-white/30 hover:text-white transition-colors" aria-label="Close">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="px-5 py-5 overflow-y-auto">
                {step === 'package' && (
                  <div className="space-y-2">
                    <p className="text-xs text-white/40 mb-3">
                      Current balance: <span className="text-white">{(profile.credit_balance ?? 0).toLocaleString('en-US')} credits</span>. Credits are
                      spent automatically once your monthly quota runs out.
                    </p>
                    {packagesLoading && (
                      <div className="flex items-center justify-center py-8 text-white/30">
                        <Loader2 className="w-5 h-5 animate-spin" />
                      </div>
                    )}
                    {!packagesLoading && packages.length === 0 && (
                      <p className="text-sm text-white/40 py-4">No credit packages are available right now.</p>
                    )}
                    {packages.map((pkg) => (
                      <button
                        key={pkg.id}
                        onClick={() => handlePickPackage(pkg)}
                        className="w-full flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 hover:bg-white/[0.06] hover:border-white/20 transition-colors text-left"
                      >
                        <div>
                          <p className="text-sm font-medium text-white">{pkg.name}</p>
                          <p className="text-xs text-white/40">{pkg.credits.toLocaleString('en-US')} credits</p>
                        </div>
                        <span className="text-sm font-medium text-white">${Number(pkg.price_usd).toFixed(2)}</span>
                      </button>
                    ))}
                  </div>
                )}

                {step === 'method' && selectedPackage && (
                  <div className="space-y-2">
                    <button
                      onClick={() => setStep('crypto')}
                      className="w-full flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 hover:bg-white/[0.06] hover:border-white/20 transition-colors text-left"
                    >
                      <Wallet className="w-4 h-4 text-white/60 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-white">Crypto — USDT</p>
                        <p className="text-xs text-white/40">TRC20 or BEP20, confirmed automatically</p>
                      </div>
                    </button>
                    <button
                      onClick={() => setStep('bank')}
                      className="w-full flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 hover:bg-white/[0.06] hover:border-white/20 transition-colors text-left"
                    >
                      <Landmark className="w-4 h-4 text-white/60 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-white">Bank transfer</p>
                        <p className="text-xs text-white/40">SWIFT/card, matched automatically</p>
                      </div>
                    </button>
                  </div>
                )}

                {step === 'crypto' && selectedPackage && (
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      {(Object.keys(NETWORK_LABEL) as CryptoNetwork[]).map((n) => (
                        <button
                          key={n}
                          onClick={() => setNetwork(n)}
                          className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium border transition-colors ${
                            network === n
                              ? 'bg-white text-black border-white'
                              : 'border-white/10 text-white/60 hover:border-white/30'
                          }`}
                        >
                          {n.toUpperCase()}
                        </button>
                      ))}
                    </div>

                    {!config && !cryptoError && (
                      <div className="flex items-center justify-center py-6 text-white/30">
                        <Loader2 className="w-5 h-5 animate-spin" />
                      </div>
                    )}

                    {config && (
                      <>
                        <CopyField
                          label={`Send exactly $${Number(selectedPackage.price_usd).toFixed(2)} in ${NETWORK_LABEL[network]} to:`}
                          value={network === 'trc20' ? config.usdt_trc20_wallet : config.usdt_bep20_wallet}
                        />
                        <div>
                          <p className="text-[11px] text-white/40 mb-1">Transaction hash (TxID)</p>
                          <input
                            value={txHash}
                            onChange={(e) => setTxHash(e.target.value)}
                            placeholder="Paste the tx hash after sending"
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm font-mono placeholder:text-white/20 focus:outline-none focus:border-white/30"
                          />
                        </div>
                        {cryptoError && <p className="text-xs text-red-400">{cryptoError}</p>}
                        <button
                          onClick={handleVerifyCrypto}
                          disabled={cryptoSubmitting || !txHash.trim()}
                          className="w-full flex items-center justify-center gap-2 bg-white text-black rounded-lg font-medium px-4 py-2.5 text-sm hover:bg-gray-200 transition-colors disabled:opacity-40"
                        >
                          {cryptoSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                          {cryptoSubmitting ? 'Verifying on-chain…' : 'Verify payment'}
                        </button>
                        <p className="text-[11px] text-white/30">
                          Sent it just now? On-chain confirmation can take a minute — if verification says it's not found yet, wait a bit and try again.
                        </p>
                      </>
                    )}
                  </div>
                )}

                {step === 'bank' && selectedPackage && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] text-white/40 mb-1">Full name (for the invoice)</label>
                      <input
                        value={billingName}
                        onChange={(e) => setBillingName(e.target.value)}
                        placeholder="Jane Doe"
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm placeholder:text-white/20 focus:outline-none focus:border-white/30"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-white/40 mb-1">Email for the invoice</label>
                      <input
                        type="email"
                        value={billingEmail}
                        onChange={(e) => setBillingEmail(e.target.value)}
                        placeholder="you@company.com"
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm placeholder:text-white/20 focus:outline-none focus:border-white/30"
                      />
                    </div>
                    {bankError && <p className="text-xs text-red-400">{bankError}</p>}
                    <button
                      onClick={handleRequestInvoice}
                      disabled={bankSubmitting || !billingName.trim() || !billingEmail.trim()}
                      className="w-full flex items-center justify-center gap-2 bg-white text-black rounded-lg font-medium px-4 py-2.5 text-sm hover:bg-gray-200 transition-colors disabled:opacity-40"
                    >
                      {bankSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                      {bankSubmitting ? 'Creating invoice…' : 'Get transfer details'}
                    </button>
                  </div>
                )}

                {step === 'bank_invoice' && invoice && (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-amber-400/20 bg-amber-400/[0.06] px-4 py-3">
                      <p className="text-[11px] text-amber-300/70 uppercase tracking-wide mb-1">Required payment reference</p>
                      <p className="text-lg font-semibold text-white tracking-wide">{invoice.reference_code}</p>
                      <p className="text-[11px] text-white/40 mt-1">Put this exact code in your transfer's comment field — it's how we match it to your account.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <CopyField label="Beneficiary" value={invoice.beneficiary} />
                      <CopyField label="Tax ID" value={invoice.tax_id} />
                    </div>
                    <CopyField label="IBAN" value={invoice.iban} />
                    <CopyField label="SWIFT/BIC" value={invoice.swift} />
                    <CopyField label="Bank address" value={invoice.bank_address} />
                    <p className="text-xs text-white/40">
                      Amount: <span className="text-white">${Number(invoice.amount_usd).toFixed(2)}</span> for{' '}
                      <span className="text-white">{invoice.credits.toLocaleString('en-US')} credits</span>. We've also emailed these
                      details to you — credits land automatically once the transfer clears.
                    </p>
                    <button
                      onClick={onClose}
                      className="w-full liquid-glass rounded-lg font-medium px-4 py-2.5 text-sm hover:bg-white/10 transition-colors"
                    >
                      Done
                    </button>
                  </div>
                )}

                {step === 'success' && (
                  <div className="flex flex-col items-center text-center py-4 gap-3">
                    <PartyPopper className="w-8 h-8 text-white/80" />
                    <p className="text-sm text-white">
                      +{creditsAdded.toLocaleString('en-US')} credits added to your account.
                    </p>
                    <button
                      onClick={onClose}
                      className="mt-2 w-full bg-white text-black rounded-lg font-medium px-4 py-2.5 text-sm hover:bg-gray-200 transition-colors"
                    >
                      Done
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
