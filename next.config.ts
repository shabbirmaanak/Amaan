import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // This app is session/cookie-driven end to end (guardian/volunteer/admin
  // auth, live scan data); there's no meaningful static shell to prerender,
  // so the experimental Cache Components model just adds friction here.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
