import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { LigneObligation } from "@/components/LigneObligation";
import { SlipControle } from "@/components/SlipControle";
import { titrePage, titreSection } from "@/lib/ui";

function jours(entre: Date, et: Date): number {
  return Math.round((et.getTime() - entre.getTime()) / 86_400_000);
}

function dansLabel(n: number): string {
  if (n <= 0) return "aujourd'hui";
  if (n === 1) return "demain";
  if (n < 7) return `dans ${n} jours`;
  if (n < 14) return "la semaine prochaine";
  return `dans ${Math.round(n / 7)} semaines`;
}

export default async function PageTableauDeBord() {
  const session = await auth();
  const utilisateurId = session!.user.id;

  const maintenant = new Date();
  const debutAuj = new Date(maintenant);
  debutAuj.setHours(0, 0, 0, 0);
  const finAuj = new Date(debutAuj);
  finAuj.setDate(finAuj.getDate() + 1);
  const finDemain = new Date(debutAuj);
  finDemain.setDate(finDemain.getDate() + 2);
  const finSemaine = new Date(debutAuj);
  finSemaine.setDate(finSemaine.getDate() + 7);

  const [devoirs, controles, notes] = await Promise.all([
    prisma.devoir.findMany({
      where: { utilisateurId, statut: "A_FAIRE", date: { gte: debutAuj } },
      orderBy: { date: "asc" },
      take: 30,
      include: { matiere: true },
    }),
    prisma.controle.findMany({
      where: { utilisateurId, date: { gte: debutAuj } },
      orderBy: { date: "asc" },
      take: 12,
      include: { matiere: true },
    }),
    prisma.note.findMany({ where: { utilisateurId }, select: { noteObtenue: true, noteMaximale: true, coefficient: true } }),
  ]);

  const pondere = notes.reduce((a, n) => a + (n.noteObtenue / n.noteMaximale) * 20 * n.coefficient, 0);
  const coeffs = notes.reduce((a, n) => a + n.coefficient, 0);
  const moyenne = coeffs > 0 ? (pondere / coeffs).toFixed(2).replace(".", ",") : null;

  const pourAuj = devoirs.filter((d) => d.date < finAuj);
  const pourDemain = devoirs.filter((d) => d.date >= finAuj && d.date < finDemain);
  const pourPlusTard = devoirs.filter((d) => d.date >= finDemain).slice(0, 8);
  const controlesSemaine = controles.filter((c) => c.date < finSemaine);
  const prochainControle = controles[0];

  // La chose la plus urgente : le premier devoir d'aujourd'hui, sinon de demain.
  const idUrgent = (pourAuj[0] ?? pourDemain[0])?.id;

  const dateAuj = maintenant.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const fmt = (d: Date) => d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });

  return (
    <div className="flex flex-col gap-[var(--carreau)]">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h1 className={titrePage + " first-letter:uppercase"}>{dateAuj}</h1>
        {moyenne ? (
          <Link href="/notes" className="font-body text-sm text-ink-soft hover:text-ink-blue">
            moyenne générale <span className="tabulaire font-bold text-ink">{moyenne}</span>
            <span className="text-ink-soft">/20</span>
          </Link>
        ) : null}
      </div>

      <section className="flex flex-col">
        <h2 className={titreSection + " mb-1"}>Pour aujourd&apos;hui</h2>
        {pourAuj.length === 0 ? (
          <p className="leading-[var(--carreau)] text-ink-soft">Rien à rendre aujourd&apos;hui.</p>
        ) : (
          <ul className="flex flex-col">
            {pourAuj.map((d) => (
              <LigneObligation
                key={d.id}
                matiere={d.matiere.nom}
                intitule={d.titre}
                href={`/devoirs?focus=${d.id}`}
                urgent={d.id === idUrgent}
                devoir={{ id: d.id, coche: false }}
                retour="/"
              />
            ))}
          </ul>
        )}
      </section>

      {pourDemain.length > 0 && (
        <section className="flex flex-col">
          <h2 className={titreSection + " mb-1"}>Demain</h2>
          <ul className="flex flex-col">
            {pourDemain.map((d) => (
              <LigneObligation
                key={d.id}
                matiere={d.matiere.nom}
                intitule={d.titre}
                href={`/devoirs?focus=${d.id}`}
                urgent={d.id === idUrgent}
                devoir={{ id: d.id, coche: false }}
                retour="/"
              />
            ))}
          </ul>
        </section>
      )}

      {pourPlusTard.length > 0 && (
        <section className="flex flex-col">
          <h2 className={titreSection + " mb-1"}>Cette semaine et après</h2>
          <ul className="flex flex-col">
            {pourPlusTard.map((d) => (
              <LigneObligation
                key={d.id}
                matiere={d.matiere.nom}
                intitule={d.titre}
                date={fmt(d.date)}
                href={`/devoirs?focus=${d.id}`}
                devoir={{ id: d.id, coche: false }}
                retour="/"
              />
            ))}
          </ul>
        </section>
      )}

      {prochainControle && (
        <div className="pt-[calc(var(--carreau)*0.5)]">
          <SlipControle
            matiere={prochainControle.matiere.nom}
            intitule={prochainControle.chapitreLibre ?? ""}
            dateLabel={prochainControle.date.toLocaleDateString("fr-FR", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
            dansLabel={dansLabel(jours(debutAuj, prochainControle.date))}
            href={`/controles?focus=${prochainControle.id}`}
          />
        </div>
      )}

      {controlesSemaine.length > 1 && (
        <section className="flex flex-col">
          <h2 className={titreSection + " mb-1"}>Contrôles de la semaine</h2>
          <ul className="flex flex-col">
            {controlesSemaine.map((c) => (
              <LigneObligation
                key={c.id}
                matiere={c.matiere.nom}
                intitule={c.chapitreLibre ?? "Contrôle"}
                date={fmt(c.date)}
                href={`/controles?focus=${c.id}`}
              />
            ))}
          </ul>
        </section>
      )}

      {devoirs.length === 0 && controles.length === 0 && (
        <p className="leading-[var(--carreau)] text-ink-soft">
          Rien de prévu. Lance une synchronisation depuis les{" "}
          <Link href="/parametres" className="text-ink-blue underline underline-offset-2">
            paramètres
          </Link>
          .
        </p>
      )}
    </div>
  );
}
