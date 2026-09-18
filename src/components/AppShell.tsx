import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { NavLink } from "@/components/NavLink";

type AppShellProps = {
  children: React.ReactNode;
  scorer: "heuristic" | "heuristic+llm";
  llmReady: boolean;
  chainPatrolReady: boolean;
};

export function AppShell({
  children,
  scorer,
  llmReady,
  chainPatrolReady,
}: AppShellProps) {
  return (
    <div className="min-h-full flex flex-col">
      <header className="sticky top-0 z-20 border-b border-line bg-bg/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-[1440px] items-center gap-6 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-dim text-accent ring-1 ring-accent/30">
              <ShieldCheck className="h-4 w-4" strokeWidth={2.2} />
            </span>
            <span className="leading-tight">
              <span className="block text-[13px] font-semibold tracking-tight">
                Review Copilot
              </span>
              <span className="block text-[11px] text-muted">
                Detection → human → blocklist
              </span>
            </span>
          </Link>

          <nav className="flex items-center gap-1 text-[13px]">
            <NavLink href="/">Queue</NavLink>
            <NavLink href="/eval">Eval</NavLink>
          </nav>

          <div className="ml-auto flex items-center gap-2 text-[11px]">
            <Pill tone="accent">Dry-run only</Pill>
            <Pill>{scorer}</Pill>
            <Pill tone={llmReady ? "accent" : undefined}>
              LLM {llmReady ? "ready" : "off"}
            </Pill>
            <Pill tone={chainPatrolReady ? "accent" : undefined}>
              ChainPatrol {chainPatrolReady ? "ready" : "offline"}
            </Pill>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-5 sm:px-6">
        {children}
      </main>
    </div>
  );
}

function Pill({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone?: "accent";
}) {
  return (
    <span
      className={`hidden rounded-full border px-2 py-0.5 font-medium sm:inline ${
        tone === "accent"
          ? "border-accent/30 bg-accent-dim text-accent"
          : "border-line bg-elevated text-muted"
      }`}
    >
      {children}
    </span>
  );
}
