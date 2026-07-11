import Link from "next/link";

import { getDictionary } from "@/lib/i18n";
import { SiteHeader } from "@/components/storefront/site-header";

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const dict = await getDictionary();

  return (
    <>
      <SiteHeader />
      <main className="flex-1">{children}</main>

      <footer className="mt-24 border-t bg-ice">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="flex flex-col gap-10 sm:flex-row sm:justify-between">
            <div className="max-w-xs">
              <p className="font-heading text-lg font-semibold tracking-tight">
                Hải Đăng<span className="text-primary">.</span>
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {dict.brand.tagline}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-12 text-sm sm:gap-16">
              <FooterColumn title={dict.footer.shop}>
                <FooterLink href="/books">{dict.footer.books}</FooterLink>
                <FooterLink href="/gifts">{dict.footer.gifts}</FooterLink>
                <FooterLink href="/cart">{dict.footer.cart}</FooterLink>
              </FooterColumn>

              <FooterColumn title={dict.footer.account}>
                <FooterLink href="/login">{dict.footer.signIn}</FooterLink>
                <FooterLink href="/register">
                  {dict.footer.createAccount}
                </FooterLink>
              </FooterColumn>
            </div>
          </div>

          <div className="mt-12 border-t pt-6">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()}{" "}
              <span>Hải Đăng — Christian Gifts &amp; Books</span>
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
