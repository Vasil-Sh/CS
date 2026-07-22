import { describe, it, expect } from "vitest";

// ── useLogin: form state validation ──

function validateLoginForm(username: string, password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!username.trim()) errors.push("Username required");
  if (!password) errors.push("Password required");
  if (password.length > 0 && password.length < 3) errors.push("Password too short");
  return { valid: errors.length === 0, errors };
}

describe("useLogin validation", () => {
  it("rejects empty form", () => {
    const r = validateLoginForm("", "");
    expect(r.valid).toBe(false);
    expect(r.errors.length).toBeGreaterThanOrEqual(2);
  });

  it("rejects empty username", () => {
    expect(validateLoginForm("", "pass123").valid).toBe(false);
    expect(validateLoginForm("   ", "pass123").valid).toBe(false);
  });

  it("rejects empty password", () => {
    expect(validateLoginForm("user", "").valid).toBe(false);
  });

  it("rejects short password", () => {
    expect(validateLoginForm("user", "ab").valid).toBe(false);
  });

  it("accepts valid form", () => {
    expect(validateLoginForm("user", "pass").valid).toBe(true);
  });
});

// ── useExpressBuilder: event management ──

interface ExpressEvent {
  match: string;
  betType: string;
  selection: string;
  odds: string;
}

function addEvent(events: ExpressEvent[], max: number): ExpressEvent[] {
  if (events.length >= max) return events;
  return [...events, { match: "New vs New", betType: "П1", selection: "New", odds: "2.00" }];
}

function removeEvent(events: ExpressEvent[], index: number): ExpressEvent[] {
  return events.filter((_, i) => i !== index);
}

function updateEvent(events: ExpressEvent[], index: number, field: keyof ExpressEvent, value: string): ExpressEvent[] {
  return events.map((e, i) => (i === index ? { ...e, [field]: value } : e));
}

describe("useExpressBuilder event logic", () => {
  it("adds event below max", () => {
    const updated = addEvent([], 10);
    expect(updated).toHaveLength(1);
  });

  it("caps at max", () => {
    const full = Array.from({ length: 10 }, (_, i) => ({ match: `M${i}`, betType: "П1", selection: "X", odds: "2.00" }));
    expect(addEvent(full, 10)).toHaveLength(10);
  });

  it("removes event by index", () => {
    const events = [
      { match: "A vs B", betType: "П1", selection: "A", odds: "2.00" },
      { match: "C vs D", betType: "П2", selection: "D", odds: "1.80" },
    ];
    expect(removeEvent(events, 0)).toHaveLength(1);
    expect(removeEvent(events, 0)[0].match).toBe("C vs D");
  });

  it("updates event field", () => {
    const events = [{ match: "A vs B", betType: "П1", selection: "A", odds: "2.00" }];
    const updated = updateEvent(events, 0, "odds", "3.50");
    expect(updated[0].odds).toBe("3.50");
    expect(updated[0].match).toBe("A vs B"); // unchanged
  });

  it("handles multiple updates", () => {
    let events: ExpressEvent[] = [{ match: "A vs B", betType: "П1", selection: "A", odds: "2.00" }];
    events = updateEvent(events, 0, "selection", "B");
    events = updateEvent(events, 0, "odds", "1.50");
    expect(events[0].selection).toBe("B");
    expect(events[0].odds).toBe("1.50");
  });
});

// ── useBetForm: default form data ──

function getDefaultFormData(game: "CS2" | "Dota2" = "CS2") {
  const today = new Date();
  return {
    date: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`,
    game,
    matchUrl: "",
    tournament: "",
    team1: "",
    team2: "",
    format: "BO3",
    betType: "",
    selection: "",
    odds: "",
    stake: "",
    currency: "UAH",
    confidence: "",
  };
}

describe("useBetForm defaults", () => {
  it("sets today's date", () => {
    const { date } = getDefaultFormData();
    const today = new Date().toISOString().split("T")[0];
    expect(date).toBe(today);
  });

  it("defaults to CS2 game", () => {
    expect(getDefaultFormData().game).toBe("CS2");
  });

  it("Dota2 game can be selected", () => {
    expect(getDefaultFormData("Dota2").game).toBe("Dota2");
  });

  it("defaults to UAH currency", () => {
    expect(getDefaultFormData().currency).toBe("UAH");
  });

  it("empty strings for optional fields", () => {
    const data = getDefaultFormData();
    expect(data.matchUrl).toBe("");
    expect(data.tournament).toBe("");
    expect(data.team1).toBe("");
    expect(data.team2).toBe("");
    expect(data.betType).toBe("");
    expect(data.stake).toBe("");
  });

  it("format defaults to BO3", () => {
    expect(getDefaultFormData().format).toBe("BO3");
  });
});

// ── Form validation for CS2BettingForm ──

function validateBetForm(data: ReturnType<typeof getDefaultFormData>): { valid: boolean; errors: string[] } {
  const errs: string[] = [];
  if (!data.team1.trim()) errs.push("Team1 required");
  if (!data.team2.trim()) errs.push("Team2 required");
  if (!data.betType) errs.push("Bet type required");
  if (!data.selection) errs.push("Selection required");
  if (!data.odds || parseFloat(data.odds) <= 1) errs.push("Invalid odds");
  if (!data.stake || parseFloat(data.stake) <= 0) errs.push("Invalid stake");
  return { valid: errs.length === 0, errors: errs };
}

describe("validateBetForm", () => {
  it("rejects empty form", () => {
    const r = validateBetForm(getDefaultFormData());
    expect(r.valid).toBe(false);
    expect(r.errors.length).toBeGreaterThan(4);
  });

  it("rejects odds <= 1", () => {
    const data = { ...getDefaultFormData(), team1: "A", team2: "B", betType: "П1", selection: "A", odds: "1.0", stake: "100" };
    expect(validateBetForm(data).valid).toBe(false);
  });

  it("rejects negative stake", () => {
    const data = { ...getDefaultFormData(), team1: "A", team2: "B", betType: "П1", selection: "A", odds: "2.0", stake: "-100" };
    expect(validateBetForm(data).valid).toBe(false);
  });

  it("rejects zero stake", () => {
    const data = { ...getDefaultFormData(), team1: "A", team2: "B", betType: "П1", selection: "A", odds: "2.0", stake: "0" };
    expect(validateBetForm(data).valid).toBe(false);
  });

  it("accepts valid form", () => {
    const data = { ...getDefaultFormData(), team1: "NaVi", team2: "FaZe", betType: "П1", selection: "NaVi", odds: "2.50", stake: "100" };
    expect(validateBetForm(data).valid).toBe(true);
  });

  it("requires selection", () => {
    const data = { ...getDefaultFormData(), team1: "A", team2: "B", betType: "П1", selection: "", odds: "2.0", stake: "100" };
    expect(validateBetForm(data).valid).toBe(false);
  });

  it("accepts high odds", () => {
    const data = { ...getDefaultFormData(), team1: "A", team2: "B", betType: "П1", selection: "A", odds: "100.0", stake: "50" };
    expect(validateBetForm(data).valid).toBe(true);
  });

  it("accepts large stake", () => {
    const data = { ...getDefaultFormData(), team1: "A", team2: "B", betType: "П1", selection: "A", odds: "2.0", stake: "50000" };
    expect(validateBetForm(data).valid).toBe(true);
  });
});
