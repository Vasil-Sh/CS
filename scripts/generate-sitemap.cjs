/**
 * Dynamic sitemap generator for MatchIQ.
 * Run: node scripts/generate-sitemap.cjs
 *
 * Reads route configuration and generates a complete sitemap.xml
 * with hreflang alternates (uk/en), changefreq, and priority.
 */

const BASE_URL = "https://matchiq.pro";

const routes = [
  { path: "/", changefreq: "weekly", priority: 1.0, hreflang: true },
  { path: "/login", changefreq: "monthly", priority: 0.8 },
  { path: "/login-digesto-demo", changefreq: "monthly", priority: 0.7 },
  { path: "/app/analytics", changefreq: "monthly", priority: 0.5 },
  { path: "/app/matches", changefreq: "daily", priority: 0.6 },
  { path: "/app/my-bets", changefreq: "monthly", priority: 0.5 },
  { path: "/app/strategy", changefreq: "monthly", priority: 0.5 },
  { path: "/app/telegram", changefreq: "monthly", priority: 0.4 },
  { path: "/app/profile", changefreq: "monthly", priority: 0.4 },
];

const hreflangBlock = (path) =>
  `    <xhtml:link rel="alternate" hreflang="uk" href="${BASE_URL}${path}"/>
    <xhtml:link rel="alternate" hreflang="en" href="${BASE_URL}${path}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${BASE_URL}${path}"/>`;

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${routes
  .map(
    (r) =>
      `  <url>
    <loc>${BASE_URL}${r.path}</loc>${r.hreflang ? "\n" + hreflangBlock(r.path) : ""}
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>
`;

// Write to public/ for Vite to serve statically
const fs = require("fs");
const path = require("path");
const target = path.resolve(__dirname, "..", "public", "sitemap.xml");
fs.writeFileSync(target, sitemap, "utf-8");
console.log("Sitemap generated: " + target);
console.log("  " + routes.length + " URLs");
