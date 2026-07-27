/**
 * MSW Server — для використання в тестах (Vitest + jsdom).
 *
 * Перехоплює мережеві запити на рівні Node.js і повертає
 * моковані відповіді згідно з handlers.ts.
 */
import { setupServer } from "msw/node";
import { handlers } from "./handlers";

export const server = setupServer(...handlers);
