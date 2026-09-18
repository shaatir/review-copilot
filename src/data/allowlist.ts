import type { AllowlistEntry } from "@/lib/types";

/** Official and known-good properties. Used as a strong REJECT signal. */
export const allowlist: AllowlistEntry[] = [
  { domain: "acmewallet.io", brandId: "acme-wallet", reason: "Official apex" },
  {
    domain: "app.acmewallet.io",
    brandId: "acme-wallet",
    reason: "Official app host",
  },
  {
    domain: "docs.acmewallet.io",
    brandId: "acme-wallet",
    reason: "Official documentation",
  },
  {
    domain: "status.acmewallet.io",
    brandId: "acme-wallet",
    reason: "Official status page",
  },
  {
    domain: "acmewallet.mirror.xyz",
    brandId: "acme-wallet",
    reason: "Official Mirror blog",
  },
  { domain: "nova.exchange", brandId: "nova-exchange", reason: "Official apex" },
  {
    domain: "app.nova.exchange",
    brandId: "nova-exchange",
    reason: "Official trading UI",
  },
  {
    domain: "blog.nova.exchange",
    brandId: "nova-exchange",
    reason: "Official blog",
  },
  {
    domain: "api.nova.exchange",
    brandId: "nova-exchange",
    reason: "Official API",
  },
  {
    domain: "nova-tv-widget.com",
    brandId: "nova-exchange",
    reason: "Licensed chart-widget partner",
  },
  {
    domain: "helixprotocol.xyz",
    brandId: "helix-protocol",
    reason: "Official apex",
  },
  {
    domain: "app.helixprotocol.xyz",
    brandId: "helix-protocol",
    reason: "Official app host",
  },
  {
    domain: "docs.helixprotocol.xyz",
    brandId: "helix-protocol",
    reason: "Official documentation",
  },
  {
    domain: "helixprotocol.github.io",
    brandId: "helix-protocol",
    reason: "Official GitHub Pages",
  },
];
