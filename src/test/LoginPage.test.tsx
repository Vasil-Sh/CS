import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  act,
} from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import LoginPage from "@/pages/LoginPage";

const { login } = vi.hoisted(() => ({ login: vi.fn() }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ login }) }));
vi.mock("@/components/SEO", () => ({ SEO: () => null }));
beforeEach(() => {
  login.mockReset();
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: false,
    media: query,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
  }));
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
function setup(demo = false) {
  return render(
    <MemoryRouter initialEntries={["/login"]}>
      <Routes>
        <Route path="/login" element={<LoginPage demo={demo} />} />
        <Route path="/app/analytics" element={<h1>Особиста аналітика</h1>} />
      </Routes>
    </MemoryRouter>,
  );
}
function fill() {
  fireEvent.change(screen.getByLabelText("Ім’я користувача"), {
    target: { value: "sample" },
  });
  fireEvent.change(screen.getByLabelText("Пароль", { exact: true }), {
    target: { value: "test-password" },
  });
}
describe("Login page", () => {
  it("toggles password visibility without submitting", () => {
    setup();
    fill();
    const password = screen.getByLabelText("Пароль", { exact: true });
    expect(password).toHaveAttribute("type", "password");
    fireEvent.click(screen.getByRole("button", { name: "Показати пароль" }));
    expect(password).toHaveAttribute("type", "text");
    expect(password).toHaveValue("test-password");
    fireEvent.click(screen.getByRole("button", { name: "Приховати пароль" }));
    expect(password).toHaveAttribute("type", "password");
    expect(login).not.toHaveBeenCalled();
  });
  it("preserves login credentials and successful navigation", async () => {
    login.mockResolvedValue({ success: true });
    setup();
    fill();
    fireEvent.submit(screen.getByRole("form", { name: "Вхід до MatchIQ" }));
    expect(
      await screen.findByRole("heading", { name: "Особиста аналітика" }),
    ).toBeInTheDocument();
    expect(login).toHaveBeenCalledWith("sample", "test-password");
  });
  it("disables controls while loading and announces a rejected login", async () => {
    let finish!: (result: { success: boolean; error: string }) => void;
    login.mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    setup();
    fill();
    fireEvent.submit(screen.getByRole("form", { name: "Вхід до MatchIQ" }));
    expect(screen.getByRole("button", { name: "Входимо…" })).toBeDisabled();
    expect(screen.getByLabelText("Ім’я користувача")).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent("Перевіряємо");
    await act(async () =>
      finish({ success: false, error: "Невірний логін або пароль" }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Невірний логін або пароль",
    );
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Увійти", exact: true }),
      ).not.toBeDisabled(),
    );
  });
  it("explains demo credentials and provides real navigation links", () => {
    const { container } = setup(true);
    expect(
      screen.getByText(/логін і пароль демо-облікового запису/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Переглянути приклади/ }),
    ).toHaveAttribute("href", "/#possibilities");
    expect(
      screen.getByRole("link", { name: "Вхід у власний акаунт" }),
    ).toHaveAttribute("href", "/login");
    expect(container.querySelector('a[href="#"]')).toBeNull();
    expect(
      container.querySelector('img[src="/assets/landing-arena.png"]'),
    ).toBeNull();
  });
});
