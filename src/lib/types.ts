export type BrandId = "acme-wallet" | "nova-exchange" | "helix-protocol";

export type DetectionSource =
  | "url_scan"
  | "wallet_cluster"
  | "user_report"
  | "kit_match";

export type Decision = "APPROVE" | "REJECT" | "WATCHLIST";

export type WhoisStub = {
  registeredDaysAgo: number;
  registrar: string;
  nameservers: string[];
  country: string;
};

export type SuspiciousAsset = {
  domain: string;
  urls: string[];
  title: string;
  /** 0–360 hue used by the browser mock */
  faviconHue: number;
  htmlKit?: string;
  wallets: string[];
  whois: WhoisStub;
  pageExcerpt: string;
  visualNotes: string;
  /** Stubbed perceptual similarity vs official, 0–100 */
  visualSimilarity: number;
};

export type Brand = {
  id: BrandId;
  name: string;
  kind: "wallet" | "exchange" | "defi";
  officialDomain: string;
  officialUrls: string[];
  officialWallets: string[];
  colors: { bg: string; accent: string; text: string };
  tagline: string;
  logoText: string;
};

export type AllowlistEntry = {
  domain: string;
  brandId?: BrandId;
  reason: string;
};

export type Detection = {
  id: string;
  createdAt: string;
  brandId: BrandId;
  source: DetectionSource;
  campaignId?: string;
  suspicious: SuspiciousAsset;
  goldenLabel: Decision;
};

export type EvidenceItem = {
  id: string;
  label: string;
  present: boolean;
  detail: string;
  weight: number;
};

export type AgentSignals = {
  lookalikeScore: number;
  whoisAgeDays: number;
  whoisRisk: number;
  htmlKitFingerprint?: string;
  visualSimilarity: number;
  sharedDrain: boolean;
  sharedDrainAddress?: string;
  allowlisted: boolean;
  allowlistReason?: string;
  homoglyph: boolean;
  campaignSize: number;
  campaignId?: string;
  impersonationCopy: boolean;
};

export type DraftDecision = {
  decision: Decision;
  confidence: number;
  riskScore: number;
  rationale: string;
  evidence: EvidenceItem[];
  signals: AgentSignals;
  scorer: "heuristic" | "heuristic+llm";
  dryRun: true;
};

export type TriagedDetection = Detection & {
  brand: Brand;
  draft: DraftDecision;
};

export type Campaign = {
  id: string;
  name: string;
  brandId: BrandId;
  kind: "shared_drain" | "html_kit" | "airdrop_lure";
  summary: string;
  detectionIds: string[];
  sharedWallets: string[];
  htmlKit?: string;
};

export type HumanReview = {
  detectionId: string;
  decision: Decision;
  note: string;
  recordedAt: string;
};

export type ChainPatrolStatus = "UNKNOWN" | "ALLOWED" | "BLOCKED";

export type ChainPatrolCheckResult = {
  ok: boolean;
  skipped?: boolean;
  skipReason?: string;
  content: string;
  status?: ChainPatrolStatus;
  source?: string;
  reason?: string;
  sources?: { source: string; status: string }[];
  error?: string;
};

export type EvalCell = {
  golden: Decision;
  draft: Decision;
  count: number;
};

export type EvalReport = {
  total: number;
  accuracy: number;
  approvePrecision: number;
  approveRecall: number;
  approveF1: number;
  byBrand: Record<
    string,
    { total: number; accuracy: number; approvePrecision: number }
  >;
  confusion: EvalCell[];
  mismatches: {
    id: string;
    brand: string;
    domain: string;
    golden: Decision;
    draft: Decision;
    confidence: number;
  }[];
  scorer: DraftDecision["scorer"];
};
