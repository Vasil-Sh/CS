/**
 * k6 Smoke Test — швидка перевірка працездатності API.
 *
 * Usage: k6 run k6/smoke.js
 * Або:   pnpm test:load
 */

import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = __ENV.API_URL || "http://localhost:3001/api";

export const options = {
  // Smoke: мінімальне навантаження, швидка перевірка
  vus: 3, // 3 віртуальних користувачі
  duration: "30s",
  thresholds: {
    http_req_duration: ["p(95)<2000"], // 95% запитів < 2s
    http_req_failed: ["rate<0.05"], // менше 5% помилок
  },
};

export default function () {
  // ── Health Check ──
  const health = http.get(`${BASE_URL}/health`);
  check(health, {
    "health status 200": (r) => r.status === 200,
  });

  // ── CS2 Matches ──
  const matches = http.get(`${BASE_URL}/v1/cs2-matches`);
  check(matches, {
    "matches status 200": (r) => r.status === 200,
    "matches is array": (r) => Array.isArray(r.json()),
  });

  sleep(1);
}
