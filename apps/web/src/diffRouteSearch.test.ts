import { describe, expect, it } from "vitest";

import {
  clearPanelSearchParams,
  parseBrowserRouteSearch,
  parseChatPanelsRouteSearch,
  parseDiffRouteSearch,
  stripPanelSearchParams,
} from "./diffRouteSearch";

describe("parseDiffRouteSearch", () => {
  it("parses valid diff search values", () => {
    const parsed = parseDiffRouteSearch({
      diff: "1",
      diffTurnId: "turn-1",
      diffFilePath: "src/app.ts",
    });

    expect(parsed).toEqual({
      diff: "1",
      diffTurnId: "turn-1",
      diffFilePath: "src/app.ts",
    });
  });

  it("treats numeric and boolean diff toggles as open", () => {
    expect(
      parseDiffRouteSearch({
        diff: 1,
        diffTurnId: "turn-1",
      }),
    ).toEqual({
      diff: "1",
      diffTurnId: "turn-1",
    });

    expect(
      parseDiffRouteSearch({
        diff: true,
        diffTurnId: "turn-1",
      }),
    ).toEqual({
      diff: "1",
      diffTurnId: "turn-1",
    });
  });

  it("drops turn and file values when diff is closed", () => {
    const parsed = parseDiffRouteSearch({
      diff: "0",
      diffTurnId: "turn-1",
      diffFilePath: "src/app.ts",
    });

    expect(parsed).toEqual({});
  });

  it("drops file value when turn is not selected", () => {
    const parsed = parseDiffRouteSearch({
      diff: "1",
      diffFilePath: "src/app.ts",
    });

    expect(parsed).toEqual({
      diff: "1",
    });
  });

  it("normalizes whitespace-only values", () => {
    const parsed = parseDiffRouteSearch({
      diff: "1",
      diffTurnId: "  ",
      diffFilePath: "  ",
    });

    expect(parsed).toEqual({
      diff: "1",
    });
  });
});

describe("parseBrowserRouteSearch", () => {
  it("parses valid browser toggle values", () => {
    expect(parseBrowserRouteSearch({ browser: "1" })).toEqual({ browser: "1" });
  });

  it("treats numeric and boolean browser toggles as open", () => {
    expect(parseBrowserRouteSearch({ browser: 1 })).toEqual({ browser: "1" });
    expect(parseBrowserRouteSearch({ browser: true })).toEqual({ browser: "1" });
  });

  it("drops closed browser values", () => {
    expect(parseBrowserRouteSearch({ browser: "0" })).toEqual({});
  });
});

describe("parseChatPanelsRouteSearch", () => {
  it("parses diff and browser params together", () => {
    expect(
      parseChatPanelsRouteSearch({
        browser: "1",
        diff: "1",
        diffTurnId: "turn-1",
        diffFilePath: "src/app.ts",
      }),
    ).toEqual({
      browser: "1",
      diff: "1",
      diffTurnId: "turn-1",
      diffFilePath: "src/app.ts",
    });
  });
});

describe("stripPanelSearchParams", () => {
  it("removes browser and diff params while preserving others", () => {
    expect(
      stripPanelSearchParams({
        browser: "1",
        diff: "1",
        diffTurnId: "turn-1",
        diffFilePath: "src/app.ts",
        keep: "value",
      }),
    ).toEqual({
      keep: "value",
    });
  });
});

describe("clearPanelSearchParams", () => {
  it("explicitly clears panel keys for retain-search middleware flows", () => {
    expect(
      clearPanelSearchParams({
        browser: "1",
        diff: "1",
        diffTurnId: "turn-1",
        diffFilePath: "src/app.ts",
        keep: "value",
      }),
    ).toEqual({
      browser: undefined,
      diff: undefined,
      diffTurnId: undefined,
      diffFilePath: undefined,
      keep: "value",
    });
  });
});
