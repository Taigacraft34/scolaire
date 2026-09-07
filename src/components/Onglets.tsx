"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Les intercalaires du classeur : une languette par section, celle en cours
// raccordée à la page.
export function Onglets({ liens }: { liens: { href: string; label: string }[] }) {
  const chemin = usePathname();

  return (
    <nav className="-mb-px flex gap-1 overflow-x-auto pl-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {liens.map((lien) => {
        const actif =
          lien.href === "/" ? chemin === "/" : chemin.startsWith(lien.href);
        return (
          <Link
            key={lien.href}
            href={lien.href}
            aria-current={actif ? "page" : undefined}
            className={
              "shrink-0 rounded-t-sm border border-b-0 px-3 py-1.5 font-body text-xs font-bold uppercase tracking-wide transition-colors " +
              (actif
                ? "border-ink-blue bg-paper text-ink-blue"
                : "border-ink-soft/35 bg-paper-2/50 text-ink-soft hover:text-ink")
            }
          >
            {lien.label}
          </Link>
        );
      })}
    </nav>
  );
}
