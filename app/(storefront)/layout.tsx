import Link from "next/link";
import { SiteHeader } from "@/components/storefront/site-header";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">{children}</main>

      <footer className="mt-24 border-t bg-muted/40">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="flex flex-col gap-10 sm:flex-row sm:justify-between">
            <div className="max-w-xs">
              <p className="font-heading text-lg font-semibold tracking-tight">
                Cornerstone<span className="text-brass">.</span>
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Handmade gifts and carefully chosen books, for every season of
                faith.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-12 text-sm sm:gap-16">
              <FooterColumn title="Shop">
                <FooterLink href="/books">Books</FooterLink>
                <FooterLink href="/gifts">Gifts</FooterLink>
                <FooterLink href="/cart">Cart</FooterLink>
              </FooterColumn>

              <FooterColumn title="Account">
                <FooterLink href="/login">Sign in</FooterLink>
                <FooterLink href="/register">Create account</FooterLink>
              </FooterColumn>
            </div>
          </div>

          <div className="mt-12 border-t pt-6">
            {/* Keep the year and the name on one JSX text node. A text node
                that wraps onto another line has its leading space trimmed,
                which would render "© 2026Cornerstone". */}
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()}{" "}
              <span>Cornerstone Christian Gifts &amp; Books</span>
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-[0.12em] text-foreground">
        {title}
      </p>
      <ul className="mt-4 space-y-2.5">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: string }) {
  return (
    <li>
      <Link
        href={href}
        className="text-muted-foreground transition-colors hover:text-foreground"
      >
        {children}
      </Link>
    </li>
  );
}
