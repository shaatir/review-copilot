import { isLlmConfigured } from "@/lib/agent/llm";
import { isChainPatrolConfigured } from "@/lib/chainpatrol";

export function runtimeFlags() {
  return {
    llmReady: isLlmConfigured(),
    chainPatrolReady: isChainPatrolConfigured(),
    scorer: isLlmConfigured() ? ("heuristic+llm" as const) : ("heuristic" as const),
  };
}
