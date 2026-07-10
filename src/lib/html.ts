import DOMPurify from "isomorphic-dompurify";

// Le contenu enrichi des blocs texte est produit par document.execCommand
// (gras, couleur, taille) : gras/italique/souligne + <font color/size> pour
// la couleur et la taille (comportement historique de execCommand).
export function nettoyerHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["b", "strong", "i", "em", "u", "font", "span", "br", "div", "p"],
    ALLOWED_ATTR: ["color", "size", "style"],
  });
}
