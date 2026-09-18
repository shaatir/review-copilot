export function shortWallet(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function pct(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function formatWhen(iso: string): string {
  const date = new Date(iso);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    hourCycle: "h23",
  }).format(date) + " UTC";
}

export function decisionLabel(decision: "APPROVE" | "REJECT" | "WATCHLIST"): {
  title: string;
  verb: string;
} {
  if (decision === "APPROVE") {
    return { title: "Approve block", verb: "Recommend blocklist" };
  }
  if (decision === "REJECT") {
    return { title: "Reject detection", verb: "Recommend dismiss" };
  }
  return { title: "Watchlist", verb: "Hold for review" };
}
