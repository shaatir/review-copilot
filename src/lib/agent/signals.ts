import { allowlist } from "@/data/allowlist";
import { detections } from "@/data/detections";
import type { AgentSignals, Brand, Detection } from "@/lib/types";

const HOMOGLYPH: Record<string, string> = {
  "0": "o",
  "1": "l",
  "3": "e",
  "4": "a",
  "5": "s",
  "7": "t",
  "8": "b",
};

const LURE_WORDS = [
  "connect",
  "login",
  "signin",
  "sign-in",
  "auth",
  "verify",
  "claim",
  "airdrop",
  "bridge",
  "kyc",
  "support",
  "secure",
  "restore",
  "download",
  "mobile",
  "dapp",
  "governance",
  "drop",
];

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    let prev = i;
    for (let j = 1; j <= b.length; j += 1) {
      const current =
        a[i - 1] === b[j - 1]
          ? row[j - 1]
          : Math.min(row[j - 1] + 1, prev + 1, row[j] + 1);
      row[j - 1] = prev;
      prev = current;
    }
    row[b.length] = prev;
  }
  return row[b.length];
}

export function similarity(a: string, b: string): number {
  const max = Math.max(a.length, b.length);
  if (max === 0) return 1;
  return 1 - levenshtein(a, b) / max;
}

export function normalizeLabel(input: string): string {
  return foldHomoglyphs(input.toLowerCase()).replace(/[^a-z0-9]/g, "");
}

export function foldHomoglyphs(input: string): string {
  return input
    .split("")
    .map((char) => HOMOGLYPH[char] ?? char)
    .join("")
    .replace(/rn/g, "m")
    .replace(/vv/g, "w");
}

export function registrableParts(domain: string): {
  host: string;
  labels: string[];
  registrable: string;
  name: string;
} {
  const host = domain.toLowerCase().replace(/\.$/, "");
  const labels = host.split(".").filter(Boolean);
  const registrable =
    labels.length >= 2 ? labels.slice(-2).join(".") : host;
  const name = labels.length >= 2 ? labels[labels.length - 2] : labels[0] ?? host;
  return { host, labels, registrable, name };
}

export function findAllowlistMatch(domain: string) {
  const { host, registrable } = registrableParts(domain);
  return allowlist.find(
    (entry) =>
      entry.domain === host ||
      entry.domain === registrable ||
      host.endsWith(`.${entry.domain}`),
  );
}

export function lookalikeScore(domain: string, brand: Brand): number {
  const official = registrableParts(brand.officialDomain);
  const suspect = registrableParts(domain);
  const officialName = normalizeLabel(official.name);
  const suspectName = normalizeLabel(suspect.name);
  const foldedOfficial = foldHomoglyphs(official.name);
  const foldedSuspect = foldHomoglyphs(suspect.name);

  const nameSim = similarity(suspectName, officialName);
  const foldedSim = similarity(
    normalizeLabel(foldedSuspect),
    normalizeLabel(foldedOfficial),
  );
  const hostContainsBrand = normalizeLabel(suspect.host).includes(officialName);
  const lureBoost = LURE_WORDS.some((word) =>
    suspect.host.includes(word),
  )
    ? 0.12
    : 0;

  // nova.exchange-secure.com — brand used as a left-label on a foreign apex
  const brandAsSubdomain =
    suspect.labels.includes(official.name) &&
    suspect.registrable !== official.registrable
      ? 0.28
      : 0;

  const hyphenatedBrand =
    suspect.name.includes(officialName) && suspect.name !== officialName
      ? 0.16
      : 0;

  const raw = Math.max(
    nameSim,
    foldedSim,
    hostContainsBrand ? 0.72 : 0,
  );
  return clamp01(raw + lureBoost + brandAsSubdomain + hyphenatedBrand);
}

export function isHomoglyph(domain: string, brand: Brand): boolean {
  const official = normalizeLabel(registrableParts(brand.officialDomain).name);
  const suspect = normalizeLabel(registrableParts(domain).name);
  if (official === suspect) return false;
  return (
    normalizeLabel(foldHomoglyphs(registrableParts(domain).name)) === official
  );
}

export function whoisRisk(days: number): number {
  if (days <= 7) return 1;
  if (days <= 21) return 0.8;
  if (days <= 45) return 0.55;
  if (days <= 90) return 0.35;
  if (days <= 365) return 0.18;
  return 0.06;
}

export function walletIndex(): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const detection of detections) {
    for (const wallet of detection.suspicious.wallets) {
      const key = wallet.toLowerCase();
      const list = map.get(key) ?? [];
      list.push(detection.id);
      map.set(key, list);
    }
  }
  return map;
}

const WALLET_INDEX = walletIndex();

export function campaignSiblings(detection: Detection): Detection[] {
  if (detection.campaignId) {
    return detections.filter(
      (item) =>
        item.campaignId === detection.campaignId && item.id !== detection.id,
    );
  }
  const wallets = new Set(
    detection.suspicious.wallets.map((wallet) => wallet.toLowerCase()),
  );
  return detections.filter((item) => {
    if (item.id === detection.id) return false;
    return item.suspicious.wallets.some((wallet) =>
      wallets.has(wallet.toLowerCase()),
    );
  });
}

export function collectSignals(detection: Detection, brand: Brand): AgentSignals {
  const allow = findAllowlistMatch(detection.suspicious.domain);
  const lookalike = lookalikeScore(detection.suspicious.domain, brand);
  const homoglyph = isHomoglyph(detection.suspicious.domain, brand);
  const shared = detection.suspicious.wallets
    .map((wallet) => ({
      wallet,
      ids: WALLET_INDEX.get(wallet.toLowerCase()) ?? [],
    }))
    .find((entry) => entry.ids.length >= 2);

  const siblings = campaignSiblings(detection);
  const excerpt = detection.suspicious.pageExcerpt.toLowerCase();
  const impersonationCopy =
    /seed|permit|connect|claim|restore|approve session|unlimited/.test(
      excerpt,
    ) && !allow;

  return {
    lookalikeScore: lookalike,
    whoisAgeDays: detection.suspicious.whois.registeredDaysAgo,
    whoisRisk: whoisRisk(detection.suspicious.whois.registeredDaysAgo),
    htmlKitFingerprint: detection.suspicious.htmlKit,
    visualSimilarity: detection.suspicious.visualSimilarity / 100,
    sharedDrain: Boolean(shared),
    sharedDrainAddress: shared?.wallet,
    allowlisted: Boolean(allow),
    allowlistReason: allow?.reason,
    homoglyph,
    campaignSize: siblings.length + 1,
    campaignId: detection.campaignId,
    impersonationCopy,
  };
}

export function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function knownMaliciousKits(): Set<string> {
  return new Set([
    "wallet-connect-drainer-v3",
    "nova-login-clone-2024",
    "claim-portal-kit",
    "seed-harvest-kit",
    "fake-apk-kit",
    "social-eng-helpdesk",
  ]);
}
