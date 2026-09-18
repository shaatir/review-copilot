import { decisionLabel } from "@/lib/format";
import type { Decision } from "@/lib/types";

export function DecisionBadge({
  decision,
  size = "sm",
}: {
  decision: Decision;
  size?: "sm" | "md";
}) {
  const { verb } = decisionLabel(decision);
  const tones = {
    APPROVE: "bg-approve-dim text-approve border-approve/30",
    REJECT: "bg-reject-dim text-reject border-reject/30",
    WATCHLIST: "bg-watch-dim text-watch border-watch/30",
  };
  return (
    <span
      title={verb}
      className={`inline-flex items-center rounded-[2px] border font-bold tracking-wide ${
        size === "md" ? "px-2 py-0.5 text-[12px]" : "px-1.5 py-[1px] text-[11px]"
      } ${tones[decision]}`}
    >
      {decision}
    </span>
  );
}
