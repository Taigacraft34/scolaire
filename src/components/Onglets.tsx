"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconeChevronBas } from "@/components/Icone";

// Desktop : les intercalaires du classeur, une languette par section.
// Mobile : un bouton qui déplie la liste des pages (pas de rangée qui déborde).
export function Onglets({ liens }: { liens: { href: string; label: string }[] }) {
  const chemin = usePathname();
  const estActif = (href: string) => (href === "/" ? chemin === "/" : chemin.startsWith(href));
  const lienActif = liens.find((l) => estActif(l.href)) ?? liens[0];

  const [ouvert, setOuvert] = useState(false);
  const zone = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ouvert) return;
    function dehors(e: PointerEvent) {
      if (zone.current && !zone.current.contains(e.target as Node)) setOuvert(false);
    }
    function echap(e: KeyboardEvent) {
      if (e.key === "Escape") setOuvert(false);
    }
    document.addEventListener("pointerdown", dehors);
    document.addEventListener("keydown", echap);
    return () => {
      document.removeEventListener("pointerdown", dehors);
      document.removeEventListener("keydown", echap);
    };
  }, [ouvert]);

  return (
    <>
      {/* Desktop */}
      <nav className="-mb-px hidden gap-1 overflow-x-auto pl-1 sm:flex [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {liens.map((lien) => (
          <Link
            key={lien.href}
            href={lien.href}
            aria-current={estActif(lien.href) ? "page" : undefined}
            className={
              "shrink-0 rounded-t-sm border border-b-0 px-3 py-1.5 font-body text-xs font-bold uppercase tracking-wide transition-colors " +
              (estActif(lien.href)
                ? "border-ink-blue bg-paper text-ink-blue"
                : "border-ink-soft/35 bg-paper-2/50 text-ink-soft hover:text-ink")
            }
          >
            {lien.label}
          </Link>
        ))}
      </nav>

      {/* Mobile */}
      <div ref={zone} className="relative py-[calc(var(--carreau)*0.4)] sm:hidden">
        <button
          type="button"
          onClick={() => setOuvert((v) => !v)}
          aria-expanded={ouvert}
          aria-haspopup="menu"
          aria-label="Menu de navigation"
          className="flex w-full items-center justify-between gap-2 rounded-sm border border-ink-blue bg-paper px-3 py-2 font-body text-xs font-bold uppercase tracking-wide text-ink-blue"
        >
          {lienActif.label}
          <IconeChevronBas className={"transition-transform " + (ouvert ? "rotate-180" : "")} />
        </button>
        {ouvert && (
          <div
            role="menu"
            aria-label="Pages"
            className="absolute inset-x-0 top-full z-40 mt-1 flex flex-col border border-ink-blue bg-paper"
            style={{ boxShadow: "0.25rem 0.35rem 1.2rem rgb(20 20 40 / 0.18)" }}
          >
            {liens.map((lien) => (
              <Link
                key={lien.href}
                href={lien.href}
                role="menuitem"
                onClick={() => setOuvert(false)}
                aria-current={estActif(lien.href) ? "page" : undefined}
                className={
                  "border-b border-ruling px-3 py-2.5 font-body text-xs font-bold uppercase tracking-wide last:border-b-0 " +
                  (estActif(lien.href)
                    ? "bg-paper-2 text-ink-blue"
                    : "text-ink-soft hover:text-ink")
                }
              >
                {lien.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
