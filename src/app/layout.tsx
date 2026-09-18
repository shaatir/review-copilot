import type { Metadata } from "next";
import { AppShell } from "@/components/AppShell";
import { runtimeFlags } from "@/lib/config";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Review Copilot",
    template: "%s · Review Copilot",
  },
  description:
    "HITL phishing triage agent for blockchain brand protection — dry-run drafts between detection and blocklist.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const flags = runtimeFlags();
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full font-sans">
        <AppShell
          scorer={flags.scorer}
          llmReady={flags.llmReady}
          chainPatrolReady={flags.chainPatrolReady}
        >
          {children}
        </AppShell>
      </body>
    </html>
  );
}
