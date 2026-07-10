import type { Metadata } from "next";
import { headers } from "next/headers";
import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Display serif for headings and the wordmark. A bookseller's type, and it
// keeps the storefront from reading like a generic SaaS dashboard.
const fraunces = Fraunces({
  variable: "--font-serif",
  subsets: ["latin"],
  axes: ["SOFT", "WONK"],
});

export const metadata: Metadata = {
  title: {
    default: "Cornerstone — Christian Gifts & Books",
    template: "%s · Cornerstone",
  },
  description:
    "Thoughtfully chosen Christian books and handmade gifts for every season of faith.",
};

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

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
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
