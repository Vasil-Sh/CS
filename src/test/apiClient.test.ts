/**
 * Unit tests: apiClient (token management + ApiError)
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { setTokens, clearToken, ApiError, api } from "@/lib/apiClient";

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
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ═══════════════════════════════════════════════════════════════════
// Token management
// ═══════════════════════════════════════════════════════════════════
describe("setTokens", () => {
  it("зберігає access і refresh токени в localStorage", () => {
    setTokens("access-123", "refresh-456");
    expect(localStorage.getItem("authToken")).toBe("access-123");
    expect(localStorage.getItem("refreshToken")).toBe("refresh-456");
  });

  it("зберігає навіть якщо refreshToken порожній", () => {
    setTokens("access-123", "");
    expect(localStorage.getItem("authToken")).toBe("access-123");
    expect(localStorage.getItem("refreshToken")).toBe("");
  });
});

describe("clearToken", () => {
  it("видаляє всі auth-ключі з localStorage", () => {
    localStorage.setItem("authToken", "abc");
    localStorage.setItem("refreshToken", "def");
    localStorage.setItem("userRole", "admin");
    localStorage.setItem("username", "test");

    clearToken();

    expect(localStorage.getItem("authToken")).toBeNull();
    expect(localStorage.getItem("refreshToken")).toBeNull();
    expect(localStorage.getItem("userRole")).toBeNull();
    expect(localStorage.getItem("username")).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════
// ApiError
// ═══════════════════════════════════════════════════════════════════
describe("ApiError", () => {
  it("зберігає message, status і details", () => {
    const err = new ApiError("Not found", 404, { detail: "missing" });
    expect(err.message).toBe("Not found");
    expect(err.status).toBe(404);
    expect(err.details).toEqual({ detail: "missing" });
    expect(err.name).toBe("ApiError");
  });

  it("працює без details", () => {
    const err = new ApiError("Server error", 500);
    expect(err.message).toBe("Server error");
    expect(err.status).toBe(500);
    expect(err.details).toBeUndefined();
  });

  it("є instanceOf Error", () => {
    const err = new ApiError("Oops", 400);
    expect(err).toBeInstanceOf(Error);
  });
});

// ═══════════════════════════════════════════════════════════════════
// API helpers smoke tests
// ═══════════════════════════════════════════════════════════════════
describe("api object", () => {
  it("має методи get, post, put, delete", () => {
    expect(typeof api.get).toBe("function");
    expect(typeof api.post).toBe("function");
    expect(typeof api.put).toBe("function");
    expect(typeof api.delete).toBe("function");
  });
});
