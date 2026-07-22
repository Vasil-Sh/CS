import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// Pages that need zero providers or minimal setup

import NotFound from "@/pages/NotFound";
import Landing from "@/pages/Landing";

describe("NotFound", () => {
  it("renders 404 heading", () => {
    const { container } = render(<MemoryRouter><NotFound /></MemoryRouter>);
    expect(container.textContent).toContain("404");
  });
});

describe("Landing", () => {
  it("renders marketing page", () => {
    const { container } = render(<MemoryRouter><Landing /></MemoryRouter>);
    expect(container).toBeTruthy();
  });
});
