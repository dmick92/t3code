import { ExternalLinkIcon, RefreshCwIcon } from "lucide-react";
import { createElement, useCallback, useMemo, useState } from "react";

import { isElectron } from "~/env";

import { Button } from "./ui/button";
import { Input } from "./ui/input";

function resolveDefaultBrowserUrl(): string {
  const configuredPort = import.meta.env.VITE_BROWSER_PANEL_PORT?.trim();
  if (configuredPort && /^\d+$/.test(configuredPort)) {
    return `http://localhost:${configuredPort}/`;
  }

  return "http://localhost:3000/";
}

const DEFAULT_BROWSER_URL = resolveDefaultBrowserUrl();

function hasElectronUserAgent(): boolean {
  return typeof navigator !== "undefined" && /\bElectron\//.test(navigator.userAgent);
}

function supportsNativeWebview(): boolean {
  if (typeof window === "undefined") return false;
  if (!isElectron && !hasElectronUserAgent()) return false;
  return true;
}

function normalizeBrowserUrl(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }

  const prefixedValue = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    return new URL(prefixedValue).toString();
  } catch {
    return null;
  }
}

export function BrowserWebView() {
  const hasNativeWebview = supportsNativeWebview();
  const [addressInput, setAddressInput] = useState(DEFAULT_BROWSER_URL);
  const [currentUrl, setCurrentUrl] = useState(DEFAULT_BROWSER_URL);
  const [navigationVersion, setNavigationVersion] = useState(0);
  const [invalidAddressError, setInvalidAddressError] = useState<string | null>(null);

  const navigateToAddress = useCallback((value: string) => {
    const normalized = normalizeBrowserUrl(value);
    if (!normalized) {
      setInvalidAddressError("Enter a valid URL.");
      return;
    }

    setInvalidAddressError(null);
    setAddressInput(normalized);
    setCurrentUrl(normalized);
  }, []);

  const reload = useCallback(() => {
    setNavigationVersion((value) => value + 1);
  }, []);

  const openExternal = useCallback(() => {
    window.open(currentUrl, "_blank", "noopener,noreferrer");
  }, [currentUrl]);

  const browserView = useMemo(() => {
    if (hasNativeWebview) {
      return createElement("webview", {
        allowpopups: "true",
        className: "h-full w-full bg-background",
        key: `webview:${navigationVersion}:${currentUrl}`,
        src: currentUrl,
      });
    }

    // Intentionally unsandboxed in web mode so embedded apps retain normal interaction
    // behavior (cookies/storage/postMessage navigation).
    const embedFrameTag = "iframe";
    return createElement(embedFrameTag, {
      className: "h-full w-full border-0 bg-background",
      key: `iframe:${navigationVersion}:${currentUrl}`,
      src: currentUrl,
      title: "Browser panel preview",
    });
  }, [currentUrl, hasNativeWebview, navigationVersion]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 p-2">
      <form
        className="flex shrink-0 items-center gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          navigateToAddress(addressInput);
        }}
      >
        <Input
          value={addressInput}
          onChange={(event) => {
            setAddressInput(event.target.value);
            if (invalidAddressError) {
              setInvalidAddressError(null);
            }
          }}
          placeholder="Enter URL"
          aria-label="Browser URL"
        />
        <Button variant="outline" size="xs" onClick={reload} aria-label="Reload page">
          <RefreshCwIcon className="size-3.5" />
        </Button>
        <Button variant="outline" size="xs" onClick={openExternal} aria-label="Open in new tab">
          <ExternalLinkIcon className="size-3.5" />
        </Button>
        <Button size="xs" type="submit">
          Go
        </Button>
      </form>
      {invalidAddressError ? (
        <p className="px-1 text-xs text-destructive" role="alert">
          {invalidAddressError}
        </p>
      ) : null}
      {!hasNativeWebview ? (
        <p className="px-1 text-xs text-muted-foreground" role="status">
          Running in iframe fallback mode. Some sites block embedding and may not load here.
        </p>
      ) : null}
      <div className="min-h-0 flex-1 overflow-hidden rounded-md border border-border/70 bg-card/20">
        {browserView}
      </div>
    </div>
  );
}
