import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";
import { boutonPrincipal } from "@/lib/ui";
import { NOM_APP } from "@/lib/marque";

export default async function PageConnexion({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  const { callbackUrl } = await searchParams;

  if (session) redirect(callbackUrl ?? "/");

  return (
    <main className="regle cahier-marge relative flex flex-1 flex-col justify-center bg-paper px-[calc(var(--marge)+var(--carreau))] pr-[var(--carreau)]">
      <div className="flex max-w-sm flex-col gap-[var(--carreau)]">
        <h1 className="font-display text-4xl font-semibold leading-tight text-ink">
          {NOM_APP}
          <span className="mt-1 block font-body text-sm font-normal text-ink-soft">
            ton cahier de bord, connecté à MonBureauNumérique
          </span>
        </h1>
        <p className="font-body text-sm leading-[var(--carreau)] text-ink-soft">
          La connexion se fait via ton compte ZITADEL. Aucune inscription depuis cette page — un
          administrateur doit d&apos;abord autoriser ton adresse.
        </p>
        <form
          action={async () => {
            "use server";
            await signIn("zitadel", { redirectTo: callbackUrl ?? "/" });
          }}
        >
          <button type="submit" className={boutonPrincipal + " px-6 py-2.5"}>
            Se connecter avec ZITADEL
          </button>
        </form>
      </div>
    </main>
  );
}
