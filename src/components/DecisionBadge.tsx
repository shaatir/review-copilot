import { decisionLabel } from "@/lib/format";
import type { Decision } from "@/lib/types";

export function DecisionBadge({
  decision,
  size = "sm",
}: {
  decision: Decision;
  size?: "sm" | "md";
}) {
  const { title } = decisionLabel(decision);
  const tones = {
    APPROVE:
      "bg-approve-dim text-approve border-approve/30",
    REJECT: "bg-reject-dim text-reject border-reject/30",
    WATCHLIST: "bg-watch-dim text-watch border-watch/30",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium tracking-wide ${
        size === "md" ? "px-2.5 py-1 text-xs" : "px-2 py-0.5 text-[11px]"
      } ${tones[decision]}`}
    >
      {title}
    </span>
  );
}
