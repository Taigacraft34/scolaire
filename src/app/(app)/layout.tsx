import Link from "next/link";
import { auth, signOut } from "@/auth";

const LIENS_NAV = [
  { href: "/", label: "Tableau de bord" },
  { href: "/devoirs", label: "Devoirs" },
  { href: "/controles", label: "Controles" },
  { href: "/notes", label: "Notes" },
  { href: "/cours", label: "Cours" },
  { href: "/calendrier", label: "Calendrier" },
];

export default async function LayoutApplication({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3">
          <nav className="flex flex-wrap items-center gap-4 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {LIENS_NAV.map((lien) => (
              <Link
                key={lien.href}
                href={lien.href}
                className="hover:text-zinc-950 dark:hover:text-zinc-50"
              >
                {lien.label}
              </Link>
            ))}
            {session?.user?.role === "ADMIN" && (
              <Link href="/admin" className="hover:text-zinc-950 dark:hover:text-zinc-50">
                Administration
              </Link>
            )}
          </nav>
          <div className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
            <Link href="/parametres" className="hover:text-zinc-950 dark:hover:text-zinc-50">
              {session?.user?.email}
            </Link>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/connexion" });
              }}
            >
              <button type="submit" className="hover:text-zinc-950 dark:hover:text-zinc-50">
                Deconnexion
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
