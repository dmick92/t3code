import { TurnId } from "@t3tools/contracts";

export interface DiffRouteSearch {
  diff?: "1" | undefined;
  diffTurnId?: TurnId | undefined;
  diffFilePath?: string | undefined;
}

export interface BrowserRouteSearch {
  browser?: "1" | undefined;
}

export type ChatPanelsRouteSearch = DiffRouteSearch & BrowserRouteSearch;

function isOpenPanelValue(value: unknown): boolean {
  return value === "1" || value === 1 || value === true;
}

function normalizeSearchString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

export function stripDiffSearchParams<T extends Record<string, unknown>>(
  params: T,
): Omit<T, "diff" | "diffTurnId" | "diffFilePath"> {
  const { diff: _diff, diffTurnId: _diffTurnId, diffFilePath: _diffFilePath, ...rest } = params;
  return rest as Omit<T, "diff" | "diffTurnId" | "diffFilePath">;
}

export function stripBrowserSearchParams<T extends Record<string, unknown>>(
  params: T,
): Omit<T, "browser"> {
  const { browser: _browser, ...rest } = params;
  return rest as Omit<T, "browser">;
}

export function stripPanelSearchParams<T extends Record<string, unknown>>(
  params: T,
): Omit<T, "browser" | "diff" | "diffTurnId" | "diffFilePath"> {
  const withoutDiff = stripDiffSearchParams(params);
  const withoutPanels = stripBrowserSearchParams(withoutDiff);
  return withoutPanels as Omit<T, "browser" | "diff" | "diffTurnId" | "diffFilePath">;
}

export function clearPanelSearchParams<T extends Record<string, unknown>>(
  params: T,
): Omit<T, "browser" | "diff" | "diffTurnId" | "diffFilePath"> & {
  browser: undefined;
  diff: undefined;
  diffTurnId: undefined;
  diffFilePath: undefined;
} {
  const rest = stripPanelSearchParams(params);
  return {
    ...rest,
    browser: undefined,
    diff: undefined,
    diffTurnId: undefined,
    diffFilePath: undefined,
  };
}

export function parseDiffRouteSearch(search: Record<string, unknown>): DiffRouteSearch {
  const diff = isOpenPanelValue(search.diff) ? "1" : undefined;
  const diffTurnIdRaw = diff ? normalizeSearchString(search.diffTurnId) : undefined;
  const diffTurnId = diffTurnIdRaw ? TurnId.makeUnsafe(diffTurnIdRaw) : undefined;
  const diffFilePath = diff && diffTurnId ? normalizeSearchString(search.diffFilePath) : undefined;

  return {
    ...(diff ? { diff } : {}),
    ...(diffTurnId ? { diffTurnId } : {}),
    ...(diffFilePath ? { diffFilePath } : {}),
  };
}

export function parseBrowserRouteSearch(search: Record<string, unknown>): BrowserRouteSearch {
  return isOpenPanelValue(search.browser) ? { browser: "1" } : {};
}

export function parseChatPanelsRouteSearch(search: Record<string, unknown>): ChatPanelsRouteSearch {
  return {
    ...parseDiffRouteSearch(search),
    ...parseBrowserRouteSearch(search),
  };
}
