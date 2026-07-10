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
        className="h-auto w-auto max-h-80 max-w-full rounded object-contain"
      />
    );
  }
  if (document.typeMime.startsWith("video/")) {
    return <video src={url} controls className="max-h-80 w-full rounded" />;
  }
  if (document.typeMime.startsWith("audio/")) {
    return <audio src={url} controls className="w-full" />;
  }
  if (document.typeMime === "application/pdf") {
    return (
      <iframe
        src={url}
        title={document.nomFichier}
        className="h-96 w-full rounded border border-zinc-300 dark:border-zinc-700"
      />
    );
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-block rounded border border-zinc-300 px-3 py-1 text-sm text-zinc-700 underline dark:border-zinc-700 dark:text-zinc-300"
    >
      {document.nomFichier}
    </a>
  );
}
