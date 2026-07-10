import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ApercuDocument } from "@/components/ApercuDocument";
import { BoutonImprimer } from "@/components/BoutonImprimer";
import { nettoyerHtml } from "@/lib/html";

// Vue dediee a l'impression (Ctrl+P -> "Enregistrer en PDF") : classes claires
// fixes plutot que dark:, l'entete de navigation est masquee via print:hidden
// sur le <header> du layout parent.
export default async function PageImprimerCours() {
  const session = await auth();
  const utilisateurId = session!.user.id;

  const matieres = await prisma.matiere.findMany({
    where: { utilisateurId },
    include: {
      chapitres: {
        orderBy: { nom: "asc" },
        include: { blocs: { orderBy: { ordre: "asc" }, include: { document: true } } },
      },
    },
    orderBy: { nom: "asc" },
  });

  return (
    <div className="flex flex-col gap-6 bg-white text-zinc-900">
      <div className="flex items-center justify-between print:hidden">
        <Link href="/cours" className="text-xs text-zinc-500 underline">
          ← Retour aux cours
        </Link>
        <BoutonImprimer />
      </div>

      <h1 className="text-2xl font-semibold">Tous les cours</h1>

      {matieres.length === 0 ? (
        <p className="text-sm text-zinc-500">Aucun cours pour le moment.</p>
      ) : (
        matieres.map((matiere, index) => (
          <section key={matiere.id} className={index > 0 ? "flex flex-col gap-4 break-before-page" : "flex flex-col gap-4"}>
            <h2 className="border-b border-zinc-300 pb-1 text-xl font-semibold">{matiere.nom}</h2>

            {matiere.chapitres.length === 0 ? (
              <p className="text-sm text-zinc-500">Aucun chapitre dans cette matiere.</p>
            ) : (
              matiere.chapitres.map((chapitre) => (
                <article key={chapitre.id} className="flex flex-col gap-2 break-inside-avoid">
                  <h3 className="text-lg font-medium">{chapitre.nom}</h3>
                  {chapitre.blocs.length === 0 ? (
                    <p className="text-sm text-zinc-500">Chapitre vide.</p>
                  ) : (
                    chapitre.blocs.map((bloc) =>
                      bloc.type === "TEXTE" ? (
                        <div
                          key={bloc.id}
                          className="text-sm text-zinc-800"
                          dangerouslySetInnerHTML={{ __html: nettoyerHtml(bloc.contenuHtml ?? "") }}
                        />
                      ) : bloc.document ? (
                        <ApercuDocument key={bloc.id} document={bloc.document} />
                      ) : null,
                    )
                  )}
                </article>
              ))
            )}
          </section>
        ))
      )}
    </div>
  );
}
