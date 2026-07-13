// Money is always an integer number of cents. $12.99 is 1299.
//
// Floats cannot represent 0.1 exactly, so summing dollar amounts as numbers
// drifts. Integers do not drift. Convert at the edges only: parse dollars to
// cents on input, format cents to a string on display.

const USD = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

/** Format integer cents as a currency string. `1299` -> `"$12.99"`. */
export function formatCents(cents: number): string {
  return USD.format(cents / 100);
}

/**
 * Convert a dollar amount to integer cents, rounding to the nearest cent.
 *
 * `Math.round` matters: `12.99 * 100` is `1298.9999999999998` in binary
 * floating point, and truncating would silently undercharge by a cent.
 */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/** Convert integer cents to a dollar number, for prefilling a form input. */
export function centsToDollars(cents: number): number {
  return cents / 100;
}
