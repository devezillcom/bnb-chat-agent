import Link from "next/link";

import { LEGAL_ENTITY_NAME, PRODUCT_NAME } from "@/lib/legal/constants";

type LegalPageLayoutProps = {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
};

export function LegalPageLayout({
  title,
  lastUpdated,
  children,
}: LegalPageLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-6">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-900 text-lg font-bold text-white dark:bg-neutral-100 dark:text-neutral-900">
              B
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {PRODUCT_NAME}
              </p>
              <p className="text-xs text-muted-foreground">by {LEGAL_ENTITY_NAME}</p>
            </div>
          </Link>
          <Link
            href="/sign-in"
            className="shrink-0 text-sm text-muted-foreground hover:text-foreground"
          >
            Sign in
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-8 space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {title}
          </h1>
          <p className="text-sm text-muted-foreground">
            Last updated: {lastUpdated}
          </p>
        </div>

        <article className="max-w-none space-y-4 text-sm leading-relaxed text-muted-foreground [&_a]:text-foreground [&_a]:underline [&_h2]:mt-8 [&_h2]:border-b [&_h2]:border-border [&_h2]:pb-2 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground [&_h3]:mt-6 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-foreground [&_li]:ml-4 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-4 [&_p]:leading-relaxed [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-4">
          {children}
        </article>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-muted-foreground">
          <p>
            © {new Date().getFullYear()} {LEGAL_ENTITY_NAME}. All rights
            reserved.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/privacy-policy" className="hover:text-foreground">
              Privacy Policy
            </Link>
            <Link href="/" className="hover:text-foreground">
              Home
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
