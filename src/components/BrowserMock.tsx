import { Lock } from "lucide-react";
import type { Brand } from "@/lib/types";

type BrowserMockProps = {
  variant: "suspicious" | "official";
  brand: Brand;
  domain: string;
  title: string;
  excerpt: string;
  hue?: number;
};

export function BrowserMock({
  variant,
  brand,
  domain,
  title,
  excerpt,
  hue = 150,
}: BrowserMockProps) {
  const official = variant === "official";
  const accent = official ? brand.colors.accent : `hsl(${hue} 70% 50%)`;
  const bg = official ? brand.colors.bg : "#10141c";
  const url = official
    ? `https://${brand.officialDomain}`
    : `https://${domain}`;

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-elevated shadow-[0_20px_50px_-30px_rgba(0,0,0,0.8)]">
      <div className="flex items-center gap-2 border-b border-line bg-[#0a101b] px-3 py-2">
        <span className="flex gap-1.5">
          <i className="h-2.5 w-2.5 rounded-full bg-[#3d4454]" />
          <i className="h-2.5 w-2.5 rounded-full bg-[#3d4454]" />
          <i className="h-2.5 w-2.5 rounded-full bg-[#3d4454]" />
        </span>
        <div className="flex min-w-0 flex-1 items-center gap-1.5 rounded-md border border-line bg-bg px-2 py-1 font-mono text-[11px] text-muted">
          <Lock
            className={`h-3 w-3 shrink-0 ${official ? "text-official" : "text-approve"}`}
          />
          <span className="truncate">{url}</span>
        </div>
      </div>
      <div className="min-h-[220px] p-5" style={{ background: bg, color: brand.colors.text }}>
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold"
              style={{ background: accent, color: "#07110c" }}
            >
              {official ? brand.logoText : brand.logoText.replace("W", "VV")}
            </span>
            <div>
              <div className="text-sm font-semibold">{title}</div>
              <div className="text-[11px] opacity-70">
                {official ? brand.tagline : "Verify your wallet to continue"}
              </div>
            </div>
          </div>
          {official ? (
            <span className="rounded-full bg-black/30 px-2 py-0.5 text-[10px] uppercase tracking-wider text-official">
              Verified official
            </span>
          ) : (
            <span className="rounded-full bg-black/30 px-2 py-0.5 text-[10px] uppercase tracking-wider text-approve">
              Unverified host
            </span>
          )}
        </div>
        {official ? (
          <OfficialBody brand={brand} accent={accent} />
        ) : (
          <SuspiciousBody excerpt={excerpt} accent={accent} />
        )}
      </div>
    </div>
  );
}

function OfficialBody({ brand, accent }: { brand: Brand; accent: string }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {["Portfolio", "Activity", "Security"].map((label) => (
          <div
            key={label}
            className="rounded-lg border border-white/10 bg-black/20 px-3 py-3 text-[11px]"
          >
            <div className="opacity-60">{label}</div>
            <div className="mt-1 text-sm font-medium">Live</div>
          </div>
        ))}
      </div>
      <button
        type="button"
        className="w-full rounded-lg py-2 text-xs font-semibold"
        style={{ background: accent, color: "#07110c" }}
      >
        Open {brand.name}
      </button>
    </div>
  );
}

function SuspiciousBody({
  excerpt,
  accent,
}: {
  excerpt: string;
  accent: string;
}) {
  const seed = /seed|12 or 24/.test(excerpt);
  const claim = /claim|airdrop|permit/.test(excerpt);
  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-white/10 bg-black/25 p-3">
        {seed ? (
          <label className="block text-[11px] opacity-70">
            Recovery phrase
            <textarea
              readOnly
              className="mt-1 h-14 w-full resize-none rounded-md border border-white/10 bg-black/40 p-2 text-[11px]"
              value=""
              placeholder="Enter 12 or 24 words"
            />
          </label>
        ) : (
          <div className="space-y-2">
            <div className="h-8 rounded-md border border-white/10 bg-black/40" />
            <div className="h-8 rounded-md border border-white/10 bg-black/40" />
          </div>
        )}
      </div>
      <button
        type="button"
        className="w-full rounded-lg py-2 text-xs font-semibold"
        style={{ background: accent, color: "#07110c" }}
      >
        {claim ? "Connect & claim" : seed ? "Restore wallet" : "Connect wallet"}
      </button>
      <p className="font-mono text-[10px] leading-relaxed opacity-50 line-clamp-2">
        {excerpt}
      </p>
    </div>
  );
}
