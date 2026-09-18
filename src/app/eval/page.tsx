import { EvalView } from "@/components/EvalView";
import { buildEvalReport } from "@/lib/eval";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Eval",
};

export default function EvalPage() {
  return <EvalView report={buildEvalReport()} />;
}
