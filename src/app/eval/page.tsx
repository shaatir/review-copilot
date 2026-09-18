import { EvalView } from "@/components/EvalView";
import { buildEvalReport } from "@/lib/eval";

export default function EvalPage() {
  return <EvalView report={buildEvalReport()} />;
}
