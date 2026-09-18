"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BarChart3,
  Info,
  Layers3,
  ListChecks,
  Menu,
  X,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";

type AppShellProps = {
  children: ReactNode;
  scorer: "heuristic" | "heuristic+llm";
  llmReady: boolean;
  chainPatrolReady: boolean;
};

const NAV = [
  {
    href: "/",
    label: "Queue",
    icon: ListChecks,
    match: (pathname: string) => pathname === "/" || pathname.startsWith("/detections"),
  },
  {
    href: "/campaigns",
    label: "Campaigns",
    icon: Layers3,
  },
  {
    href: "/eval",
    label: "Eval",
    icon: BarChart3,
  },
  {
    href: "/about",
    label: "About",
    icon: Info,
  },
];

export function AppShell({
  children,
  scorer,
  llmReady,
  chainPatrolReady,
}: AppShellProps) {
  const pathname = usePathname();
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    if (!navOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setNavOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navOpen]);

  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-40 bg-header text-white">
        <div className="flex h-10 items-center gap-3 px-2 sm:px-3">
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center text-white/80 hover:bg-header-hover hover:text-white lg:hidden"
            aria-label={navOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={navOpen}
            onClick={() => setNavOpen((open) => !open)}
          >
            {navOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
          <Link
            href="/"
            className="flex items-center gap-2 shrink-0"
            onClick={() => setNavOpen(false)}
          >
            <span className="flex h-6 w-6 items-center justify-center bg-orange text-[10px] font-bold leading-none text-white">
              RC
            </span>
            <span className="text-[14px] font-medium tracking-tight">
              Review Copilot
            </span>
          </Link>
          <span className="hidden h-4 w-px bg-white/20 sm:block" />
          <HeaderBreadcrumb pathname={pathname} />
          <div className="ml-auto flex min-w-0 items-center gap-px text-[12px]">
            <UtilityPill accent>Dry-run only</UtilityPill>
            <UtilityPill>{scorer}</UtilityPill>
            <UtilityPill hideOnMobile tone={llmReady ? "ok" : "off"}>
              LLM {llmReady ? "ready" : "off"}
            </UtilityPill>
            <UtilityPill hideOnMobile tone={chainPatrolReady ? "ok" : "off"}>
              ChainPatrol {chainPatrolReady ? "ready" : "offline"}
            </UtilityPill>
          </div>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-40px)]">
        {navOpen ? (
          <button
            type="button"
            aria-label="Dismiss navigation"
            className="fixed inset-0 top-10 z-20 bg-black/40 lg:hidden"
            onClick={() => setNavOpen(false)}
          />
        ) : null}

        <aside
          className={`z-30 w-60 shrink-0 overflow-y-auto border-r border-line bg-panel max-lg:fixed max-lg:top-10 max-lg:bottom-0 max-lg:left-0 max-lg:transition-transform ${
            navOpen ? "max-lg:translate-x-0" : "max-lg:-translate-x-full"
          }`}
        >
          <div className="border-b border-line px-4 py-3">
            <div className="text-[16px] font-bold text-ink">Review Copilot</div>
            <div className="text-[12px] text-muted">HITL brand-protection triage</div>
          </div>
          <div className="px-4 pb-1 pt-3 micro-label">Resources</div>
          <nav className="pb-4" onClick={() => setNavOpen(false)}>
            {NAV.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink key={item.href} href={item.href} match={item.match}>
                  <Icon className="h-4 w-4 shrink-0 text-muted" strokeWidth={1.75} />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
          <div className="mt-auto border-t border-line px-4 py-3 text-[11px] leading-4 text-faint">
            Synthetic fixtures. Drafts never write a blocklist, registrar, or wallet.
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-4 sm:px-6">{children}</main>
      </div>
    </div>
  );
}

function HeaderBreadcrumb({ pathname }: { pathname: string }) {
  const crumbs = crumbsFor(pathname);
  return (
    <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-1.5 text-[12px] text-white/70 md:flex">
      {crumbs.map((crumb, index) => (
        <span key={`${crumb.href}-${crumb.label}`} className="flex min-w-0 items-center gap-1.5">
          {index > 0 ? <span className="text-white/35">/</span> : null}
          {crumb.href && index < crumbs.length - 1 ? (
            <Link href={crumb.href} className="truncate hover:text-white">
              {crumb.label}
            </Link>
          ) : (
            <span className="truncate text-white">{crumb.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

function crumbsFor(pathname: string): Array<{ label: string; href?: string }> {
  if (pathname.startsWith("/detections/")) {
    const id = pathname.split("/")[2] ?? "Detection";
    return [
      { label: "Queue", href: "/" },
      { label: decodeURIComponent(id) },
    ];
  }
  if (pathname.startsWith("/campaigns")) return [{ label: "Campaigns" }];
  if (pathname.startsWith("/eval")) return [{ label: "Eval" }];
  if (pathname.startsWith("/about")) return [{ label: "About" }];
  return [{ label: "Queue" }];
}

function UtilityPill({
  children,
  accent,
  tone,
  hideOnMobile,
}: {
  children: ReactNode;
  accent?: boolean;
  tone?: "ok" | "off";
  hideOnMobile?: boolean;
}) {
  const color = accent
    ? "text-[#fbd8b4]"
    : tone === "ok"
      ? "text-[#9ee0a8]"
      : "text-white/70";
  return (
    <span
      className={`${hideOnMobile ? "hidden sm:inline-flex" : "inline-flex"} items-center px-2 py-1 ${color}`}
    >
      {children}
    </span>
  );
}
