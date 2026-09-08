import Link from "next/link";

// Le prochain contrôle, sur un feuillet à coin corné épinglé à la page.
// `imminent` (< 48 h) passe l'intitulé au stylo rouge — le seul cas où ce
// feuillet crie. `chapitres` liste ce qu'il y a à réviser.
export function SlipControle({
  matiere,
  intitule,
  dateLabel,
  dansLabel,
  href,
  imminent = false,
  chapitres = [],
}: {
  matiere: string;
  intitule: string;
  dateLabel: string;
  dansLabel: string;
  href: string;
  imminent?: boolean;
  chapitres?: string[];
}) {
  return (
    <Link
      href={href}
      className={
        "group relative block w-full max-w-[calc(var(--carreau)*15)] border bg-paper-2/70 p-[calc(var(--carreau)*0.6)] pr-[calc(var(--carreau)*1.4)] transition-colors " +
        (imminent ? "border-bic-red/55 hover:border-bic-red" : "border-ink-soft/35 hover:border-ink-blue")
      }
      style={{ clipPath: "polygon(0 0, calc(100% - 1.1rem) 0, 100% 1.1rem, 100% 100%, 0 100%)" }}
    >
      <span
        aria-hidden
        className="absolute right-0 top-0 h-[1.1rem] w-[1.1rem] bg-ruling"
        style={{ clipPath: "polygon(0 0, 100% 100%, 0 100%)" }}
      />
      <p
        className={
          "font-body text-[0.72rem] font-bold uppercase tracking-[0.14em] " +
          (imminent ? "text-bic-red" : "text-ink-soft")
        }
      >
        Prochain contrôle · {dansLabel}
      </p>
      <p className="mt-0.5 font-display text-lg leading-snug text-ink">
        <span className={imminent ? "text-bic-red" : "text-ink-blue"}>{matiere}</span>
        {intitule ? ` — ${intitule}` : ""}
      </p>
      <p className="tabulaire mt-0.5 font-mono text-xs text-ink-soft">{dateLabel}</p>
      {chapitres.length > 0 && (
        <p className="mt-1.5 flex flex-wrap items-baseline gap-1 font-body text-xs text-ink-soft">
          <span className="font-bold uppercase tracking-wide text-ink-soft/80">à réviser</span>
          {chapitres.map((chap, i) => (
            <span key={chap}>
              {chap}
              {i < chapitres.length - 1 ? " ·" : ""}
            </span>
          ))}
        </p>
      )}
    </Link>
  );
}
