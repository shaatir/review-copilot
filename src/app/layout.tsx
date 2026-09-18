import { AppShell } from "@/components/AppShell";
import { runtimeFlags } from "@/lib/config";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Review Copilot",
  description:
    "HITL phishing triage agent for blockchain brand protection — dry-run drafts between detection and blocklist.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const flags = runtimeFlags();
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
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
