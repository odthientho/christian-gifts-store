import type { Metadata } from "next";
import { Mail, Phone, Clock } from "lucide-react";

import { getDictionary } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: dict.contact.title };
}

export default async function ContactPage() {
  const dict = await getDictionary();

  const rows = [
    {
      icon: <Mail className="size-5 text-primary" strokeWidth={1.75} />,
      label: dict.contact.emailLabel,
      value: "hello@ginstore.example",
      href: "mailto:hello@ginstore.example",
    },
    {
      icon: <Phone className="size-5 text-primary" strokeWidth={1.75} />,
      label: dict.contact.phoneLabel,
      value: "+1 (714) 589-7485",
      href: "tel:+17145897485",
    },
    {
      icon: <Clock className="size-5 text-primary" strokeWidth={1.75} />,
      label: dict.contact.hoursLabel,
      value: dict.contact.hours,
      href: null,
    },
  ];

  return (
    <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6 sm:py-20">
      <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
        {dict.contact.title}
      </h1>
      <p className="mt-3 leading-relaxed text-pretty text-muted-foreground">
        {dict.contact.intro}
      </p>

      <ul className="mt-10 divide-y rounded-xl border bg-card">
        {rows.map((row) => (
          <li key={row.label} className="flex items-center gap-4 px-5 py-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent">
              {row.icon}
            </span>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {row.label}
              </p>
              {row.href ? (
                <a
                  href={row.href}
                  className="font-medium hover:text-primary hover:underline"
                >
                  {row.value}
                </a>
              ) : (
                <p className="font-medium">{row.value}</p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
