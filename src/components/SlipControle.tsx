import Link from "next/link";

// Le prochain contrôle, sur un feuillet à coin corné épinglé à la page.
export function SlipControle({
  matiere,
  intitule,
  dateLabel,
  dansLabel,
  href,
}: {
  matiere: string;
  intitule: string;
  dateLabel: string;
  dansLabel: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group relative block w-full max-w-[calc(var(--carreau)*13)] border border-ink-soft/35 bg-paper-2/70 p-[calc(var(--carreau)*0.6)] pr-[calc(var(--carreau)*1.4)] transition-colors hover:border-ink-blue"
      style={{ clipPath: "polygon(0 0, calc(100% - 1.1rem) 0, 100% 1.1rem, 100% 100%, 0 100%)" }}
    >
      <span
        aria-hidden
        className="absolute right-0 top-0 h-[1.1rem] w-[1.1rem] bg-ruling"
        style={{ clipPath: "polygon(0 0, 100% 100%, 0 100%)" }}
      />
      <p className="font-body text-[0.72rem] font-bold uppercase tracking-[0.14em] text-ink-soft">
        Prochain contrôle · {dansLabel}
      </p>
      <p className="mt-0.5 font-display text-lg leading-tight text-ink">
        <span className="text-ink-blue">{matiere}</span>
        {intitule ? ` — ${intitule}` : ""}
      </p>
      <p className="tabulaire mt-0.5 font-mono text-xs text-ink-soft">{dateLabel}</p>
    </Link>
  );
}
