"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLink({
  href,
  children,
  match,
}: {
  href: string;
  children: ReactNode;
  match?: (pathname: string) => boolean;
}) {
  const pathname = usePathname();
  const active = match
    ? match(pathname)
    : href === "/"
      ? pathname === "/"
      : pathname.startsWith(href);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-2 border-l-[3px] px-4 py-2 text-[13px] ${
        active
          ? "border-orange bg-nav font-bold text-ink"
          : "border-transparent text-ink hover:bg-row-alt"
      }`}
    >
      {children}
    </Link>
  );
}
