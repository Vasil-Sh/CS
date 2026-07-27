/**
 * MSW Browser — для використання в dev-режимі браузера.
 *
 * Дозволяє розробляти фронтенд без реального бекенду.
 * Активується через: VITE_ENABLE_MSW=true
 */
import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

export const worker = setupWorker(...handlers);
