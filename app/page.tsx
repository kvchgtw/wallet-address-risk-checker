"use client";

import { useMemo, useState } from "react";

type ApiResult = {
  body: unknown;
};

const riskCauseLabels: Record<string, string> = {
  cybercrime: "網路犯罪活動",
  money_laundering: "資金洗錢",
  number_of_malicious_contracts_created: "建立惡意合約紀錄",
  gas_abuse: "Gas 濫用行為",
  financial_crime: "金融犯罪活動",
  darkweb_transactions: "暗網交易",
  reinit: "重入攻擊",
  phishing_activities: "釣魚活動",
  fake_kyc: "偽造 KYC",
  blacklist_doubt: "可疑黑名單",
  fake_standard_interface: "偽造標準介面",
  stealing_attack: "竊盜攻擊",
  blackmail_activities: "勒索活動",
  sanctioned: "受制裁地址",
  malicious_mining_activities: "惡意挖礦活動",
  mixer: "混幣器",
  fake_token: "假代幣",
  honeypot_related_address: "蜜罐相關地址"
};

const riskCauseKeys = new Set(Object.keys(riskCauseLabels));
const ignoredFields = new Set(["data_source"]);

type RiskMessage = {
  message: string;
  isHighRisk: boolean;
};

function computeRiskMessage(payload: unknown): RiskMessage | null {
  if (!payload || typeof payload !== "object") return null;
  const body = payload as Record<string, unknown>;
  const result = body.result;

  if (!result || typeof result !== "object") return null;

  const flaggedCauses = new Set<string>();
  let hasKnownRiskFlags = false;

  const stack: unknown[] = [result];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current || typeof current !== "object") continue;

    if (Array.isArray(current)) {
      stack.push(...current);
      continue;
    }

    for (const [key, value] of Object.entries(current)) {
      if (ignoredFields.has(key)) continue;

      if (riskCauseKeys.has(key)) {
        hasKnownRiskFlags = true;

        if (
          value === "1" ||
          value === 1 ||
          value === true ||
          (typeof value === "string" && value.toLowerCase() === "true")
        ) {
          flaggedCauses.add(
            riskCauseLabels[key] ?? key.replace(/_/g, " ")
          );
        }

        continue;
      }

      if (value && typeof value === "object") {
        stack.push(value);
      }
    }
  }

  if (!hasKnownRiskFlags) {
    return null;
  }

  if (flaggedCauses.size > 0) {
    const causes = Array.from(flaggedCauses).join("、");
    return {
      message: `此地址可能與 ${causes} 有關，故被標記為高風險地址，建議您提高警覺，謹慎小心為上。`,
      isHighRisk: true
    };
  }

  return {
    message:
      "此地址暫時無查出高風險紀錄，但不代表此地址毫無風險，務必謹慎、謹慎再謹慎。",
    isHighRisk: false
  };
}

export default function Home() {
  const [address, setAddress] = useState("");
  const [result, setResult] = useState<ApiResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const riskMessage = useMemo(() => {
    if (!result) return null;
    return computeRiskMessage(result.body);
  }, [result]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch("/api/check-address", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address })
      });

      const payload = await response.json();
      setResult({
        body: payload
      });
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "發生未知錯誤，請稍後再試。"
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center px-4 py-16">
      <div className="w-full max-w-2xl space-y-10">
        <header className="space-y-4 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-sky-400">
            Wallet Risk Checker
          </p>
          <h1 className="text-4xl font-bold tracking-tight">
            檢查錢包地址的安全風險
          </h1>
          <p className="text-base text-slate-300">
            轉帳前，先確認這是不是高風險的詐騙錢包地址
          </p>
        </header>

        <section className="rounded-2xl border border-white/10 bg-slate-900/50 p-6 shadow-lg backdrop-blur-lg">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block text-sm font-medium text-slate-300">
              錢包地址
              <div className="relative mt-2">
                <input
                  type="text"
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  placeholder="0x...／bc1...／Solana 位址"
                  className="w-full rounded-lg border border-white/10 bg-slate-950 px-4 py-3 pr-16 text-base text-white placeholder:text-slate-500 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                  required
                />
                {address ? (
                  <button
                    type="button"
                    onClick={() => {
                      setAddress("");
                      setResult(null);
                      setError(null);
                    }}
                    className="absolute inset-y-0 right-2 my-auto inline-flex h-9 items-center rounded-md bg-white/10 px-3 text-sm font-semibold text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                  >
                    清除
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const text = await navigator.clipboard.readText();
                        if (text) {
                          setAddress(text.trim());
                        }
                      } catch (clipboardError) {
                        console.error("Clipboard read failed", clipboardError);
                      }
                    }}
                    className="absolute inset-y-0 right-2 my-auto inline-flex h-9 items-center rounded-md bg-white/10 px-3 text-sm font-semibold text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                    title="貼上地址"
                    aria-label="貼上地址"
                  >
                    貼上
                  </button>
                )}
              </div>
            </label>
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-lg bg-sky-500 px-4 py-3 text-base font-semibold text-white shadow transition hover:bg-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40 disabled:cursor-not-allowed disabled:bg-slate-600"
              disabled={isLoading}
            >
              {isLoading ? "查詢中..." : "立即檢查"}
            </button>
          </form>

          {riskMessage ? (
            <div
              className="mt-8 rounded-2xl border px-6 py-6 shadow-xl transition-all duration-300"
              style={{
                background: riskMessage.isHighRisk
                  ? "linear-gradient(135deg, rgba(239, 68, 68, 0.25), rgba(127, 29, 29, 0.55))"
                  : "linear-gradient(135deg, rgba(217, 119, 6, 0.25), rgba(120, 53, 15, 0.55))",
                borderColor: riskMessage.isHighRisk
                  ? "rgba(248, 113, 113, 0.5)"
                  : "rgba(251, 191, 36, 0.4)",
                boxShadow: riskMessage.isHighRisk
                  ? "0 20px 35px -15px rgba(248, 113, 113, 0.65)"
                  : "0 20px 35px -15px rgba(251, 191, 36, 0.55)"
              }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="mt-1 h-10 w-10 flex-shrink-0 rounded-full text-xl"
                  style={{
                    backgroundColor: riskMessage.isHighRisk
                      ? "rgba(248, 113, 113, 0.25)"
                      : "rgba(252, 211, 77, 0.2)",
                    color: riskMessage.isHighRisk ? "#fecaca" : "#fde68a",
                    display: "grid",
                    placeItems: "center"
                  }}
                >
                  {riskMessage.isHighRisk ? "🚨" : "⚠️"}
                </div>
                <div className="space-y-3">
                  <p
                    className="text-lg font-semibold tracking-wide"
                    style={{
                      color: riskMessage.isHighRisk ? "#fee2e2" : "#fef3c7"
                    }}
                  >
                    {riskMessage.isHighRisk ? "高風險提示" : "安全提醒"}
                  </p>
                  <p
                    className="text-base leading-relaxed"
                    style={{
                      color: riskMessage.isHighRisk ? "#fee2e2" : "#fef3c7"
                    }}
                  >
                    {riskMessage.message}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
          {error ? (
            <p className="mt-4 rounded-lg border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </p>
          ) : null}
        </section>

      </div>
    </main>
  );
}
