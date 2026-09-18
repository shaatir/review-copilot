import { DecisionBadge } from "@/components/DecisionBadge";
import { Container, PageHeader, StatTile } from "@/components/console";
import { pct } from "@/lib/format";
import type { Decision, EvalReport } from "@/lib/types";
import Link from "next/link";

const DECISIONS: Decision[] = ["APPROVE", "REJECT", "WATCHLIST"];

export function EvalView({ report }: { report: EvalReport }) {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Eval"
        description={
          <>
            Draft decisions versus golden labels on the synthetic fixture set.
            This measures the scorer, not a production blocklist. Positive class
            for precision/recall is <span className="font-medium text-ink">APPROVE</span>{" "}
            (recommend block).
          </>
        }
      />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        <StatTile label="Fixtures" value={String(report.total)} />
        <StatTile label="3-class accuracy" value={pct(report.accuracy)} />
        <StatTile label="Approve precision" value={pct(report.approvePrecision)} />
        <StatTile label="Approve recall" value={pct(report.approveRecall)} />
        <StatTile label="Approve F1" value={pct(report.approveF1)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        <Container header="Confusion matrix" headerExtra="Rows = golden · columns = draft">
          <div className="overflow-x-auto">
            <table className="console-table text-center">
              <thead>
                <tr>
                  <th className="text-left">Golden</th>
                  {DECISIONS.map((decision) => (
                    <th key={decision}>{decision}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DECISIONS.map((golden) => (
                  <tr key={golden}>
                    <td className="text-left font-bold text-muted">{golden}</td>
                    {DECISIONS.map((draft) => {
                      const cell = report.confusion.find(
                        (entry) => entry.golden === golden && entry.draft === draft,
                      );
                      const match = golden === draft;
                      return (
                        <td key={draft}>
                          <span
                            className={`inline-flex min-w-8 justify-center px-2 py-1 font-mono text-[12px] ${
                              match
                                ? "bg-success-dim font-bold text-official"
                                : "text-ink"
                            }`}
                          >
                            {cell?.count ?? 0}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Container>

        <Container header="Per brand" noPad>
          <table className="console-table">
            <thead>
              <tr>
                <th>Brand</th>
                <th>Fixtures</th>
                <th>Accuracy</th>
                <th>Approve P</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(report.byBrand).map(([name, row]) => (
                <tr key={name}>
                  <td>{name}</td>
                  <td className="font-mono text-[12px] text-muted">{row.total}</td>
                  <td className="font-mono text-[12px]">{pct(row.accuracy)}</td>
                  <td className="font-mono text-[12px]">{pct(row.approvePrecision)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="border-t border-line px-4 py-3 text-[12px] text-faint">
            Scorer: {report.scorer}. Heuristic is deterministic; enabling an LLM
            may change rationale more than labels.
          </p>
        </Container>
      </div>

      <Container header="Mismatches" headerExtra={`${report.mismatches.length} rows`} noPad>
        {report.mismatches.length === 0 ? (
          <p className="px-4 py-6 text-[13px] text-official">
            Draft labels match golden labels on every fixture.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="console-table min-w-[640px]">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Domain</th>
                  <th>Golden</th>
                  <th>Draft</th>
                  <th>Conf.</th>
                </tr>
              </thead>
              <tbody>
                {report.mismatches.map((row) => (
                  <tr key={row.id}>
                    <td className="font-mono text-[12px]">
                      <Link
                        href={`/detections/${row.id}`}
                        className="text-blue hover:underline"
                      >
                        {row.id}
                      </Link>
                    </td>
                    <td>
                      {row.domain}
                      <span className="ml-2 text-[11px] text-faint">{row.brand}</span>
                    </td>
                    <td>
                      <DecisionBadge decision={row.golden} />
                    </td>
                    <td>
                      <DecisionBadge decision={row.draft} />
                    </td>
                    <td className="font-mono text-[12px] text-muted">
                      {pct(row.confidence)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Container>
    </div>
  );
}
