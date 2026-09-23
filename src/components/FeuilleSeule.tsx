// Une page seule du cahier, hors de l'application : connexion, erreur
// d'authentification, 404. La réglure et la marge rouge, le contenu posé
// dans la colonne d'écriture.
export function FeuilleSeule({ children }: { children: React.ReactNode }) {
  return (
    <main className="regle cahier-marge relative flex flex-1 flex-col justify-center bg-paper px-[calc(var(--marge)+var(--carreau))] pr-[var(--carreau)]">
      <div className="flex max-w-sm flex-col gap-[var(--carreau)]">{children}</div>
    </main>
  );
}

// Annotation dans la marge, au stylo rouge (« 404 », « Refusé »…).
export function AnnotationMarge({ children }: { children: React.ReactNode }) {
  return (
    <span className="tabulaire font-mono text-sm uppercase tracking-wide text-bic-red">{children}</span>
  );
}
