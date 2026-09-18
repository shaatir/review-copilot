import type { Brand } from "@/lib/types";

export const brands: Brand[] = [
  {
    id: "acme-wallet",
    name: "Acme Wallet",
    kind: "wallet",
    officialDomain: "acmewallet.io",
    officialUrls: [
      "https://acmewallet.io",
      "https://app.acmewallet.io",
      "https://docs.acmewallet.io",
    ],
    officialWallets: ["0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa0001"],
    colors: { bg: "#0B1F17", accent: "#3DDC97", text: "#E8FFF4" },
    tagline: "Self-custody, without the sharp edges.",
    logoText: "AW",
  },
  {
    id: "nova-exchange",
    name: "Nova Exchange",
    kind: "exchange",
    officialDomain: "nova.exchange",
    officialUrls: [
      "https://nova.exchange",
      "https://app.nova.exchange",
      "https://blog.nova.exchange",
    ],
    officialWallets: ["0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb0002"],
    colors: { bg: "#12101F", accent: "#8B7CFF", text: "#F3F0FF" },
    tagline: "Spot, perps, and the order book you can actually read.",
    logoText: "NX",
  },
  {
    id: "helix-protocol",
    name: "Helix Protocol",
    kind: "defi",
    officialDomain: "helixprotocol.xyz",
    officialUrls: [
      "https://helixprotocol.xyz",
      "https://app.helixprotocol.xyz",
      "https://docs.helixprotocol.xyz",
    ],
    officialWallets: ["0xcccccccccccccccccccccccccccccccccccc0003"],
    colors: { bg: "#0E1726", accent: "#5EEAD4", text: "#ECFEFF" },
    tagline: "Modular liquidity. One settlement layer.",
    logoText: "HX",
  },
];

export const brandById = Object.fromEntries(
  brands.map((brand) => [brand.id, brand]),
) as Record<Brand["id"], Brand>;
