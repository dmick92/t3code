import { GlobeIcon } from "lucide-react";

import { isElectron } from "~/env";
import { cn } from "~/lib/utils";
import { BrowserWebView } from "./BrowserWebView";

export type BrowserPanelMode = "sheet" | "sidebar";

interface BrowserPanelProps {
  mode?: BrowserPanelMode;
}

function browserPanelHeaderClassName(mode: BrowserPanelMode): string {
  return cn(
    "flex items-center gap-2 px-4",
    isElectron && mode !== "sheet" ? "drag-region h-[52px] border-b border-border" : "h-12",
  );
}

export default function BrowserPanel({ mode = "sidebar" }: BrowserPanelProps) {
  return (
    <section className="flex h-full min-w-0 flex-col bg-background" aria-label="Browser panel">
      {isElectron && mode !== "sheet" ? (
        <div className={browserPanelHeaderClassName(mode)}>
          <GlobeIcon className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-medium text-foreground">Browser</h2>
        </div>
      ) : (
        <div className="border-b border-border">
          <div className={browserPanelHeaderClassName(mode)}>
            <GlobeIcon className="size-4 text-muted-foreground" />
            <h2 className="text-sm font-medium text-foreground">Browser</h2>
          </div>
        </div>
      )}
      <BrowserWebView />
    </section>
  );
}
