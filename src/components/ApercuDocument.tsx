interface DocumentApercu {
  id: string;
  nomFichier: string;
  typeMime: string;
}

export function ApercuDocument({ document }: { document: DocumentApercu }) {
  const url = `/api/documents/${document.id}`;

  if (document.typeMime.startsWith("image/")) {
    // Taille naturelle de l'image, jamais deformee ni etiree pour remplir le
    // conteneur : seule une limite maximale (largeur/hauteur du bloc) s'applique.
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={document.nomFichier}
        className="h-auto w-auto max-h-80 max-w-full border border-ink-soft/25 object-contain"
      />
    );
  }
  if (document.typeMime.startsWith("video/")) {
    return <video src={url} controls className="max-h-80 w-full border border-ink-soft/25" />;
  }
  if (document.typeMime.startsWith("audio/")) {
    return <audio src={url} controls className="w-full" />;
  }
  if (document.typeMime === "application/pdf") {
    return (
      <iframe
        src={url}
        title={document.nomFichier}
        className="h-96 w-full border border-ink-soft/30"
      />
    );
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center rounded-sm border border-ink-soft/50 px-3 py-1 font-body text-sm font-bold text-ink-blue underline decoration-1 underline-offset-2"
    >
      {document.nomFichier}
    </a>
  );
}
