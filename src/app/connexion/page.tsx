import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";

export default async function PageConnexion({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  const { callbackUrl } = await searchParams;

  if (session) redirect(callbackUrl ?? "/");

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 bg-zinc-100 px-6 dark:bg-black">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Plateforme scolaire
        </h1>
        <p className="max-w-sm text-sm text-zinc-600 dark:text-zinc-400">
          La connexion se fait exclusivement via votre compte ZITADEL. Aucune
          inscription n&apos;est possible depuis cette page.
        </p>
      </div>
      <form
        action={async () => {
          "use server";
          await signIn("zitadel", { redirectTo: callbackUrl ?? "/" });
        }}
      >
        <button
          type="submit"
          className="rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
        >
          Se connecter avec ZITADEL
        </button>
      </form>
    </main>
  );
}
