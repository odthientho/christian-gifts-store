// Money is always an integer number of cents. $12.99 is 1299. Shared so the
// API, storefront, and admin format and parse money identically.

const USD = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

/** `1299` -> `"$12.99"`. */
export function formatCents(cents: number): string {
  return USD.format(cents / 100);
}

/** Dollars to integer cents, rounded. `Math.round` avoids float undercharge. */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/** Integer cents to a dollar number, for prefilling a form input. */
export function centsToDollars(cents: number): number {
  return cents / 100;
}
