import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";
import { visualizer } from "rollup-plugin-visualizer";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    // viteSourceLocator disabled — caused React double-mount & DOM conflicts
    react(),
    ...(mode === "production"
      ? [
          VitePWA({
            registerType: "autoUpdate",
            includeAssets: [
              "favicon.svg",
              "favicon.ico",
              "robots.txt",
              "sitemap.xml",
              "assets/og-image.svg",
            ],
            manifest: {
              name: "MatchIQ — Betting Analytics",
              short_name: "MatchIQ",
              description:
                "Професійна аналітика ставок на CS2. EV-детектор, алгоритм Келлі, трекінг банкролу та AI-рекомендації.",
              theme_color: "#111827",
              background_color: "#f3f3f3",
              display: "standalone",
              orientation: "portrait-primary",
              start_url: "/",
              icons: [
                {
                  src: "/assets/icon-192.png",
                  sizes: "192x192",
                  type: "image/png",
                },
                {
                  src: "/assets/icon-512.png",
                  sizes: "512x512",
                  type: "image/png",
                },
                {
                  src: "/assets/icon-512.png",
                  sizes: "512x512",
                  type: "image/png",
                  purpose: "maskable",
                },
              ],
            },
            workbox: {
              globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
              runtimeCaching: [
                {
                  urlPattern: /^https:\/\/api\.cstest\.pp\.ua\/.*/i,
                  handler: "NetworkFirst",
                  options: {
                    cacheName: "api-cache",
                    expiration: { maxEntries: 50, maxAgeSeconds: 300 },
                  },
                },
              ],
            },
          }),
        ]
      : []),
    ...(mode === "analyze"
      ? [
          visualizer({
            open: true,
            filename: "dist/stats.html",
            gzipSize: true,
            brotliSize: true,
          }),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
