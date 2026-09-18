import { DecisionBadge } from "@/components/DecisionBadge";
import { pct } from "@/lib/format";
import type { Decision, EvalReport } from "@/lib/types";

const DECISIONS: Decision[] = ["APPROVE", "REJECT", "WATCHLIST"];

export function EvalView({ report }: { report: EvalReport }) {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Eval panel</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Draft decisions versus golden labels on the synthetic fixture set.
          This measures the scorer, not a production blocklist. Positive class
          for precision/recall is <span className="text-ink">APPROVE</span>{" "}
          (recommend block).
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Metric label="Fixtures" value={String(report.total)} />
        <Metric label="3-class accuracy" value={pct(report.accuracy)} />
        <Metric label="Approve precision" value={pct(report.approvePrecision)} />
        <Metric label="Approve recall" value={pct(report.approveRecall)} />
        <Metric label="Approve F1" value={pct(report.approveF1)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        <section className="rounded-xl border border-line bg-elevated p-4">
          <h2 className="text-[12px] font-medium uppercase tracking-wider text-muted">
            Confusion matrix
          </h2>
          <p className="mt-1 text-[12px] text-faint">Rows = golden · columns = draft</p>
          <table className="mt-3 w-full text-center text-[12px]">
            <thead>
              <tr>
                <th />
                {DECISIONS.map((decision) => (
                  <th key={decision} className="px-2 py-1 font-medium text-muted">
                    {decision}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DECISIONS.map((golden) => (
                <tr key={golden}>
                  <th className="px-2 py-2 text-left font-medium text-muted">{golden}</th>
                  {DECISIONS.map((draft) => {
                    const cell = report.confusion.find(
                      (entry) => entry.golden === golden && entry.draft === draft,
                    );
                    const match = golden === draft;
                    return (
                      <td key={draft} className="px-2 py-2">
                        <span
                          className={`inline-flex min-w-8 justify-center rounded-md px-2 py-1 font-mono ${
                            match
                              ? "bg-accent-dim text-accent"
                              : "bg-hover text-ink"
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
        </section>

        <section className="rounded-xl border border-line bg-elevated p-4">
          <h2 className="text-[12px] font-medium uppercase tracking-wider text-muted">
            Per brand
          </h2>
          <div className="mt-3 space-y-2">
            {Object.entries(report.byBrand).map(([name, row]) => (
              <div
                key={name}
                className="flex items-center justify-between rounded-lg border border-line px-3 py-2 text-[13px]"
              >
                <span>
                  {name}
                  <span className="ml-2 text-[11px] text-faint">{row.total} fixtures</span>
                </span>
                <span className="font-mono text-[12px] text-muted">
                  acc {pct(row.accuracy)} · P {pct(row.approvePrecision)}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[12px] text-faint">
            Scorer: {report.scorer}. Heuristic is deterministic; enabling an LLM
            may change rationale more than labels.
          </p>
        </section>
      </div>

      <section className="rounded-xl border border-line bg-elevated p-4">
        <h2 className="text-[12px] font-medium uppercase tracking-wider text-muted">
          Mismatches
        </h2>
        {report.mismatches.length === 0 ? (
          <p className="mt-3 text-sm text-accent">
            Draft labels match golden labels on every fixture.
          </p>
        ) : (
          <table className="mt-3 w-full text-left text-[13px]">
            <thead className="text-[11px] uppercase tracking-wider text-faint">
              <tr>
                <th className="py-2 font-medium">ID</th>
                <th className="py-2 font-medium">Domain</th>
                <th className="py-2 font-medium">Golden</th>
                <th className="py-2 font-medium">Draft</th>
                <th className="py-2 font-medium">Conf.</th>
              </tr>
            </thead>
            <tbody>
              {report.mismatches.map((row) => (
                <tr key={row.id} className="border-t border-line">
                  <td className="py-2 font-mono text-[12px]">{row.id}</td>
                  <td className="py-2">
                    {row.domain}
                    <span className="ml-2 text-[11px] text-faint">{row.brand}</span>
                  </td>
                  <td className="py-2">
                    <DecisionBadge decision={row.golden} />
                  </td>
                  <td className="py-2">
                    <DecisionBadge decision={row.draft} />
                  </td>
                  <td className="py-2 font-mono text-[12px] text-muted">
                    {pct(row.confidence)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-elevated px-3 py-3">
      <div className="text-[10px] uppercase tracking-wider text-faint">{label}</div>
      <div className="mt-1 font-mono text-xl">{value}</div>
    </div>
  );
}
