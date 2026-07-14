// Uploaded images are served by the API as a relative `/images/:id` path.
// Both server and client components need to turn that into a real,
// browser-loadable URL — this is safe in client components too since
// NEXT_PUBLIC_ vars are inlined at build time.
const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export function toAbsoluteImageUrl(url: string): string {
  return /^https?:\/\//.test(url) ? url : `${API_ORIGIN}${url}`;
}
