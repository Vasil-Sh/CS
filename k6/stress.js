/**
 * k6 Stress Test — поступове збільшення навантаження для пошуку меж.
 *
 * Usage: k6 run k6/stress.js
 * Або:   pnpm test:load:stress
 */

import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = __ENV.API_URL || "http://localhost:3001/api";

export const options = {
  stages: [
    { duration: "1m", target: 20 }, // Ramp-up: 0 → 20 VUs
    { duration: "3m", target: 20 }, // Stay at 20
    { duration: "1m", target: 50 }, // Ramp-up: 20 → 50
    { duration: "3m", target: 50 }, // Stay at 50
    { duration: "2m", target: 0 },  // Ramp-down: 50 → 0
  ],
  thresholds: {
    http_req_duration: ["p(95)<3000", "p(99)<5000"],
    http_req_failed: ["rate<0.10"],
  },
};

export default function () {
  const endpoints = [
    { method: "GET", path: "/v1/cs2-matches" },
    { method: "GET", path: "/v1/cs2-matches/live" },
    { method: "GET", path: "/health" },
  ];

  const ep = endpoints[Math.floor(Math.random() * endpoints.length)];

  const res = http.request(ep.method, `${BASE_URL}${ep.path}`);

  check(res, {
    [`${ep.path} status < 500`]: (r) => r.status < 500,
  });

  sleep(Math.random() * 2 + 1); // 1-3s пауза
}
