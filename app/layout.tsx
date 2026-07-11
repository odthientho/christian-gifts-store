import type { Metadata } from "next";
import { headers } from "next/headers";
import { Be_Vietnam_Pro, Playfair_Display, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { getLocale, getDictionary } from "@/lib/i18n";
import "./globals.css";

// Be Vietnam Pro for UI: a geometric sans in the Poppins family the reference
// uses, but — unlike Poppins, whose latin-ext omits U+1EA0–U+1EF1 — it carries a
// real `vietnamese` subset, so tone-marked vowels (ế, ộ, ữ) render in-font
// rather than falling back. The store defaults to Vietnamese, so this matters.
const bodyFont = Be_Vietnam_Pro({
  variable: "--font-be-vietnam",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin", "latin-ext", "vietnamese"],
});

// Playfair Display for headings: an elegant bookseller serif, and it also has a
// vietnamese subset. Stands in for the reference's Libre Baskerville, which does
// not cover Vietnamese.
const headingFont = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin", "vietnamese"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return {
    title: {
      default: "Hải Đăng — Christian Gifts & Books",
      template: "%s · Hải Đăng",
    },
    description: dict.brand.tagline,
  };
}

// Runs before first paint, so a dark-theme visitor never sees a white flash.
// It has to be inline and blocking; a deferred script paints too late.
const THEME_SCRIPT = `
try {
  var t = localStorage.getItem('cgs-theme');
  if (!t) t = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  if (t === 'dark') document.documentElement.classList.add('dark');
} catch (e) {}
`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // proxy.ts mints a nonce per request. An inline script without it is blocked
  // by `script-src 'self' 'nonce-…' 'strict-dynamic'`.
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const locale = await getLocale();

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${bodyFont.variable} ${headingFont.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* React strips the nonce attribute from the DOM after using it, so the
            hydrated tree sees nonce="" where the server sent a value. That diff
            is expected and harmless; suppress it on this element only. */}
        <script
          nonce={nonce}
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
