/**
 * k6 Soak Test — тривалий тест на стабільність (витоки пам'яті, деградація).
 *
 * Usage: k6 run k6/soak.js
 * Або:   pnpm test:load:soak
 *
 * ⚠️ Запускати обережно — тест триває 30 хвилин.
 */

import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = __ENV.API_URL || "http://localhost:3001/api";

export const options = {
  stages: [
    { duration: "2m", target: 10 }, // Ramp-up
    { duration: "26m", target: 10 }, // Stay at 10 VUs
    { duration: "2m", target: 0 },  // Ramp-down
  ],
  thresholds: {
    http_req_duration: ["p(95)<2000"],
    http_req_failed: ["rate<0.02"],
  },
};

export default function () {
  // Ротуємо ендпоінти з різною вагою
  const rnd = Math.random();

  let res;
  if (rnd < 0.4) {
    res = http.get(`${BASE_URL}/v1/cs2-matches`);
  } else if (rnd < 0.7) {
    res = http.get(`${BASE_URL}/health`);
  } else {
    res = http.get(`${BASE_URL}/v1/cs2-matches/live`);
  }

  check(res, { "status ok": (r) => r.status < 500 });

  sleep(Math.random() * 5 + 2); // 2-7s пауза (реалістичний трафік)
}
