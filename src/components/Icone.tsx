// Jeu d'icônes tracées à la main, une seule épaisseur de trait, bouts ronds —
// comme dessinées au stylo sur la page. 16px de base.

type Props = React.SVGProps<SVGSVGElement> & { titre?: string };

function Base({ titre, children, ...props }: Props & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 16 16"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={titre ? "img" : "presentation"}
      aria-hidden={titre ? undefined : true}
      aria-label={titre}
      {...props}
    >
      {titre ? <title>{titre}</title> : null}
      {children}
    </svg>
  );
}

export const IconeCoche = (p: Props) => (
  <Base {...p}>
    <path d="M2.6 8.9c1.3.5 2.7 1.7 3.4 3 .9-3.4 3.2-6.6 6.6-8.7" />
  </Base>
);

export const IconeCroix = (p: Props) => (
  <Base {...p}>
    <path d="M3.5 3.2 12.6 12.8M12.6 3.2 3.4 12.9" />
  </Base>
);

export const IconeChevronBas = (p: Props) => (
  <Base {...p}>
    <path d="M3 5.8c1.9 1.6 3.4 3 5 4.6 1.7-1.7 3.1-3 5-4.7" />
  </Base>
);

export const IconeChevronDroite = (p: Props) => (
  <Base {...p}>
    <path d="M5.8 3c1.6 1.9 3 3.4 4.6 5-1.7 1.7-3 3.1-4.7 5" />
  </Base>
);

export const IconeFlecheDroite = (p: Props) => (
  <Base {...p}>
    <path d="M2.4 8h11M9 3.6c1.3 1.7 2.6 3 4.4 4.4-1.8 1.4-3 2.7-4.4 4.4" />
  </Base>
);

export const IconeFlecheGauche = (p: Props) => (
  <Base {...p}>
    <path d="M13.6 8h-11M7 3.6C5.7 5.3 4.4 6.6 2.6 8c1.8 1.4 3 2.7 4.4 4.4" />
  </Base>
);

export const IconeLoupe = (p: Props) => (
  <Base {...p}>
    <circle cx="7" cy="7" r="4.3" />
    <path d="M10.3 10.4 14 14" />
  </Base>
);

export const IconeSoleil = (p: Props) => (
  <Base {...p}>
    <circle cx="8" cy="8" r="3.1" />
    <path d="M8 1.4v1.6M8 13v1.6M2.1 2.1l1.2 1.2M12.7 12.7l1.2 1.2M1.4 8h1.6M13 8h1.6M2.1 13.9l1.2-1.2M12.7 3.3l1.2-1.2" />
  </Base>
);

export const IconeLune = (p: Props) => (
  <Base {...p}>
    <path d="M13 9.3A5.6 5.6 0 0 1 6.6 3a5.6 5.6 0 1 0 6.4 6.3Z" />
  </Base>
);

export const IconeCorbeille = (p: Props) => (
  <Base {...p}>
    <path d="M2.8 4.3h10.4M6 4.1V2.9c0-.4.3-.7.7-.7h2.6c.4 0 .7.3.7.7v1.2M4 4.5l.7 8c0 .5.4.9.9.9h4.8c.5 0 .9-.4.9-.9l.7-8" />
  </Base>
);

export const IconePlus = (p: Props) => (
  <Base {...p}>
    <path d="M8 2.6v10.8M2.6 8h10.8" />
  </Base>
);

export const IconeImprimante = (p: Props) => (
  <Base {...p}>
    <path d="M4.5 6V2.7h7V6M4.5 12H3.2c-.6 0-1-.5-1-1V7.2c0-.6.4-1 1-1h9.6c.6 0 1 .4 1 1V11c0 .5-.4 1-1 1h-1.3M4.5 9.6h7v3.7h-7z" />
  </Base>
);

export const IconeCartable = (p: Props) => (
  <Base {...p}>
    <path d="M3 6.2c0-.9.7-1.6 1.6-1.6h6.8c.9 0 1.6.7 1.6 1.6v6c0 .5-.4 1-1 1H4c-.6 0-1-.5-1-1zM6 4.6V3.5c0-.5.4-.9.9-.9h2.2c.5 0 .9.4.9.9v1.1M3.2 8.6h9.6" />
  </Base>
);

export const IconeTrombone = (p: Props) => (
  <Base {...p}>
    <path d="M10.4 5.2 6 9.7c-.5.5-.5 1.2 0 1.6.4.4 1.1.4 1.6 0l4.7-4.8c.9-.9.9-2.4 0-3.3-.9-.9-2.4-.9-3.3 0L4.2 8c-1.4 1.4-1.4 3.6 0 5 1.4 1.4 3.6 1.4 5 0l3.6-3.7" />
  </Base>
);
