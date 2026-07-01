/**
 * Unit tests: authService (backend API)
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { authService } from "@/lib/authService";

// Mock localStorage
const store: Record<string, string> = {};
beforeEach(() => {
  Object.keys(store).forEach((k) => delete store[k]);
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(
    (k) => store[String(k)] ?? null,
  );
  vi.spyOn(Storage.prototype, "setItem").mockImplementation((k, v) => {
    store[String(k)] = String(v);
  });
  vi.spyOn(Storage.prototype, "removeItem").mockImplementation((k) => {
    delete store[String(k)];
  });
  vi.spyOn(Storage.prototype, "clear").mockImplementation(() => {
    Object.keys(store).forEach((k) => delete store[k]);
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

function mockFetch(json: unknown, ok = true, status = 200) {
  globalThis.fetch = vi
    .fn()
    .mockResolvedValue({ ok, status, json: () => Promise.resolve(json) });
}

function mockLoginSuccess(isAdmin = false) {
  mockFetch({
    success: true,
    isAdmin,
    token: "test-access-token",
    refreshToken: "test-refresh-token",
    user: { username: "testuser", role: isAdmin ? "admin" : "user" },
  });
}

describe("authService", () => {
  beforeEach(() => localStorage.clear());

  describe("login", () => {
    it("success as regular user", async () => {
      mockLoginSuccess(false);
      const r = await authService.login("user", "pass");
      expect(r.success).toBe(true);
      expect(r.isAdmin).toBe(false);
    });

    it("success as admin", async () => {
      mockLoginSuccess(true);
      const r = await authService.login("admin", "pass");
      expect(r.success).toBe(true);
      expect(r.isAdmin).toBe(true);
    });

    it("wrong password (401)", async () => {
      mockFetch({ error: "Invalid credentials" }, false, 401);
      const r = await authService.login("user", "wrong");
      expect(r.success).toBe(false);
    });

    it("subscription expired (403)", async () => {
      mockFetch({ error: "Subscription expired" }, false, 403);
      const r = await authService.login("expired", "pass");
      expect(r.success).toBe(false);
      expect(r.error).toContain("підписка");
    });

    it("network error", async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error("Network error"));
      const r = await authService.login("user", "pass");
      expect(r.success).toBe(false);
    });
  });

  describe("validateAdmin", () => {
    it("true for admin", async () => {
      mockLoginSuccess(true);
      expect(await authService.validateAdmin("admin", "pass")).toBe(true);
    });

    it("false for regular user", async () => {
      mockLoginSuccess(false);
      expect(await authService.validateAdmin("user", "pass")).toBe(false);
    });
  });

  describe("validateUser", () => {
    it("active user", async () => {
      mockLoginSuccess(false);
      expect(await authService.validateUser("user", "pass")).toEqual({
        isValid: true,
      });
    });

    it("wrong password", async () => {
      mockFetch({ error: "Invalid credentials" }, false, 401);
      const r = await authService.validateUser("user", "wrong");
      expect(r.isValid).toBe(false);
    });
  });
});
