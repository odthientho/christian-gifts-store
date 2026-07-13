import type { NextConfig } from "next";

// Headers that never vary per request live here. The Content-Security-Policy
// needs a fresh nonce on every request, so it is set in proxy.ts instead.
const securityHeaders = [
  // Don't advertise the framework and version to scanners.
  { key: "X-DNS-Prefetch-Control", value: "on" },

  // Belt-and-braces with CSP `frame-ancestors 'none'`, for older browsers.
  { key: "X-Frame-Options", value: "DENY" },

  // Stop the browser guessing a response's type — the classic way an uploaded
  // "image" gets executed as a script.
  { key: "X-Content-Type-Options", value: "nosniff" },

  // Send the origin to other sites, the full URL only to our own. Keeps order
  // numbers in /checkout/success?order=… out of third-party referer logs.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },

  // Nothing here needs these, so deny them outright.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,

  // @gin/contracts ships TypeScript source; Next must compile it.
  transpilePackages: ["@gin/contracts"],

  async headers() {
    const headers = [...securityHeaders];

    // HSTS only in production: sending it from http://localhost would pin the
    // browser to https for localhost and break every other local project.
    if (process.env.NODE_ENV === "production") {
      headers.push({
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      });
    }

    return [{ source: "/:path*", headers }];
  },
};

export default nextConfig;
