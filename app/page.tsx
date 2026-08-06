import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">BNB Chat Agent</h1>
      <p className="mt-3 text-neutral-600 dark:text-neutral-300">
        Barebone scaffold is ready. Configure <code>.env</code> from{" "}
        <code>.env.example</code>, run <code>npm run db:push</code>, then start
        building agents.
      </p>
      <div className="mt-6 flex gap-3">
        <Link
          href="/sign-in"
          className="inline-flex h-10 items-center rounded-lg bg-neutral-900 px-4 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
        >
          Sign in
        </Link>
        <Link
          href="/sign-in?mode=signup"
          className="inline-flex h-10 items-center rounded-lg border border-neutral-300 px-4 text-sm font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
        >
          Create account
        </Link>
      </div>
    </main>
  );
}
