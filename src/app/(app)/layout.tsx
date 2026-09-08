import Link from "next/link";
import { auth, signOut } from "@/auth";
import { BasculeTheme } from "@/components/BasculeTheme";
import { BarreRecherche } from "@/components/BarreRecherche";
import { Onglets } from "@/components/Onglets";
import { NOM_APP } from "@/lib/marque";

const LIENS_NAV = [
  { href: "/", label: "Accueil" },
  { href: "/devoirs", label: "Devoirs" },
  { href: "/controles", label: "Contrôles" },
  { href: "/notes", label: "Notes" },
  { href: "/cours", label: "Cours" },
  { href: "/calendrier", label: "Calendrier" },
  { href: "/emploi-du-temps", label: "Emploi du temps" },
];

export default async function LayoutApplication({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  const liens =
    session?.user?.role === "ADMIN"
      ? [...LIENS_NAV, { href: "/admin", label: "Administration" }]
      : LIENS_NAV;

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <header className="print:hidden">
        <div className="mx-auto flex w-full max-w-[calc(var(--carreau)*46)] flex-wrap items-center justify-between gap-x-4 gap-y-2 px-[var(--marge)] pt-[calc(var(--carreau)*0.75)] pb-[calc(var(--carreau)*0.5)]">
          <Link
            href="/"
            className="shrink-0 font-display text-2xl font-semibold tracking-tight text-ink"
          >
            {NOM_APP}
          </Link>
          <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-x-4 gap-y-2 text-ink-soft">
            <div className="order-last w-full sm:order-none sm:w-56">
              <BarreRecherche />
            </div>
            <BasculeTheme />
            <Link
              href="/parametres"
              className="max-w-[9rem] truncate font-body text-xs font-bold text-ink-soft underline decoration-1 underline-offset-4 hover:text-ink-blue sm:max-w-none"
            >
              {session?.user?.name ?? session?.user?.email}
            </Link>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/connexion" });
              }}
            >
              <button
                type="submit"
                className="shrink-0 font-body text-xs font-bold text-ink-soft underline decoration-1 underline-offset-4 hover:text-bic-red"
              >
                Quitter
              </button>
            </form>
          </div>
        </div>

        <div className="mx-auto w-full max-w-[calc(var(--carreau)*46)] px-[var(--carreau)] sm:border-b sm:border-ink-blue sm:px-[calc(var(--marge)-0.25rem)]">
          <Onglets liens={liens} />
        </div>
      </header>

      <main className="regle cahier-marge relative mx-auto w-full max-w-[calc(var(--carreau)*46)] flex-1 pl-[calc(var(--marge)+var(--carreau))] pr-[var(--carreau)] pt-[calc(var(--carreau)*1.5)] pb-[calc(var(--carreau)*3)]">
        {children}
      </main>
    </div>
  );
}
