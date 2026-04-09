import { ThreadId } from "@t3tools/contracts";
import { createFileRoute, retainSearchParams, useNavigate } from "@tanstack/react-router";
import {
  Suspense,
  lazy,
  type CSSProperties,
  type ReactNode,
  useCallback,
  useEffect,
  useState,
} from "react";

import BrowserPanel from "../components/BrowserPanel";
import ChatView from "../components/ChatView";
import { DiffWorkerPoolProvider } from "../components/DiffWorkerPoolProvider";
import {
  DiffPanelHeaderSkeleton,
  DiffPanelLoadingState,
  DiffPanelShell,
  type DiffPanelMode,
} from "../components/DiffPanelShell";
import { Sheet, SheetPopup } from "../components/ui/sheet";
import { useComposerDraftStore } from "../composerDraftStore";
import {
  clearPanelSearchParams,
  type ChatPanelsRouteSearch,
  parseChatPanelsRouteSearch,
} from "../diffRouteSearch";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { useStore } from "../store";
import { Sidebar, SidebarInset, SidebarProvider, SidebarRail } from "~/components/ui/sidebar";

const DiffPanel = lazy(() => import("../components/DiffPanel"));
const PANEL_INLINE_LAYOUT_MEDIA_QUERY = "(max-width: 1180px)";
const PANEL_INLINE_DEFAULT_WIDTH = "clamp(28rem,48vw,44rem)";
const PANEL_INLINE_SIDEBAR_MIN_WIDTH = 26 * 16;
const DIFF_INLINE_SIDEBAR_WIDTH_STORAGE_KEY = "chat_diff_sidebar_width";
const BROWSER_INLINE_SIDEBAR_WIDTH_STORAGE_KEY = "chat_browser_sidebar_width";
const COMPOSER_COMPACT_MIN_LEFT_CONTROLS_WIDTH_PX = 208;

const ChatPanelSheet = (props: { children: ReactNode; open: boolean; onClose: () => void }) => {
  return (
    <Sheet
      open={props.open}
      onOpenChange={(open) => {
        if (!open) {
          props.onClose();
        }
      }}
    >
      <SheetPopup
        side="right"
        showCloseButton={false}
        keepMounted
        className="w-[min(88vw,820px)] max-w-[820px] p-0"
      >
        {props.children}
      </SheetPopup>
    </Sheet>
  );
};

const DiffLoadingFallback = (props: { mode: DiffPanelMode }) => {
  return (
    <DiffPanelShell mode={props.mode} header={<DiffPanelHeaderSkeleton />}>
      <DiffPanelLoadingState label="Loading diff viewer..." />
    </DiffPanelShell>
  );
};

const LazyDiffPanel = (props: { mode: DiffPanelMode }) => {
  return (
    <DiffWorkerPoolProvider>
      <Suspense fallback={<DiffLoadingFallback mode={props.mode} />}>
        <DiffPanel mode={props.mode} />
      </Suspense>
    </DiffWorkerPoolProvider>
  );
};

const ChatPanelInlineSidebar = (props: {
  children: ReactNode;
  open: boolean;
  onClose: () => void;
  onOpen: () => void;
  storageKey: string;
}) => {
  const { children, open, onClose, onOpen, storageKey } = props;
  const onOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (nextOpen) {
        onOpen();
        return;
      }
      onClose();
    },
    [onClose, onOpen],
  );
  const shouldAcceptInlineSidebarWidth = useCallback(
    ({ nextWidth, wrapper }: { nextWidth: number; wrapper: HTMLElement }) => {
      const composerForm = document.querySelector<HTMLElement>("[data-chat-composer-form='true']");
      if (!composerForm) return true;
      const composerViewport = composerForm.parentElement;
      if (!composerViewport) return true;
      const previousSidebarWidth = wrapper.style.getPropertyValue("--sidebar-width");
      wrapper.style.setProperty("--sidebar-width", `${nextWidth}px`);

      const viewportStyle = window.getComputedStyle(composerViewport);
      const viewportPaddingLeft = Number.parseFloat(viewportStyle.paddingLeft) || 0;
      const viewportPaddingRight = Number.parseFloat(viewportStyle.paddingRight) || 0;
      const viewportContentWidth = Math.max(
        0,
        composerViewport.clientWidth - viewportPaddingLeft - viewportPaddingRight,
      );
      const formRect = composerForm.getBoundingClientRect();
      const composerFooter = composerForm.querySelector<HTMLElement>(
        "[data-chat-composer-footer='true']",
      );
      const composerRightActions = composerForm.querySelector<HTMLElement>(
        "[data-chat-composer-actions='right']",
      );
      const composerRightActionsWidth = composerRightActions?.getBoundingClientRect().width ?? 0;
      const composerFooterGap = composerFooter
        ? Number.parseFloat(window.getComputedStyle(composerFooter).columnGap) ||
          Number.parseFloat(window.getComputedStyle(composerFooter).gap) ||
          0
        : 0;
      const minimumComposerWidth =
        COMPOSER_COMPACT_MIN_LEFT_CONTROLS_WIDTH_PX + composerRightActionsWidth + composerFooterGap;
      const hasComposerOverflow = composerForm.scrollWidth > composerForm.clientWidth + 0.5;
      const overflowsViewport = formRect.width > viewportContentWidth + 0.5;
      const violatesMinimumComposerWidth = composerForm.clientWidth + 0.5 < minimumComposerWidth;

      if (previousSidebarWidth.length > 0) {
        wrapper.style.setProperty("--sidebar-width", previousSidebarWidth);
      } else {
        wrapper.style.removeProperty("--sidebar-width");
      }

      return !hasComposerOverflow && !overflowsViewport && !violatesMinimumComposerWidth;
    },
    [],
  );

  return (
    <SidebarProvider
      defaultOpen={false}
      open={open}
      onOpenChange={onOpenChange}
      className="w-auto min-h-0 flex-none bg-transparent"
      style={{ "--sidebar-width": PANEL_INLINE_DEFAULT_WIDTH } as CSSProperties}
    >
      <Sidebar
        side="right"
        collapsible="offcanvas"
        className="border-l border-border bg-card text-foreground"
        resizable={{
          minWidth: PANEL_INLINE_SIDEBAR_MIN_WIDTH,
          shouldAcceptWidth: shouldAcceptInlineSidebarWidth,
          storageKey,
        }}
      >
        {children}
        {open ? <SidebarRail /> : null}
      </Sidebar>
    </SidebarProvider>
  );
};

function ChatThreadRouteView() {
  const bootstrapComplete = useStore((store) => store.bootstrapComplete);
  const navigate = useNavigate();
  const threadId = Route.useParams({
    select: (params) => ThreadId.makeUnsafe(params.threadId),
  });
  const search = Route.useSearch();
  const threadExists = useStore((store) => store.threadShellById[threadId] !== undefined);
  const draftThreadExists = useComposerDraftStore((store) =>
    Object.hasOwn(store.draftThreadsByThreadId, threadId),
  );
  const routeThreadExists = threadExists || draftThreadExists;
  const isDiffSearchOpen = search.diff === "1";
  const isBrowserSearchOpen = search.browser === "1";
  const activePanel = isBrowserSearchOpen ? "browser" : isDiffSearchOpen ? "diff" : null;
  const diffOpen = activePanel === "diff";
  const browserOpen = activePanel === "browser";
  const shouldUsePanelSheet = useMediaQuery(PANEL_INLINE_LAYOUT_MEDIA_QUERY);
  // TanStack Router keeps active route components mounted across param-only navigations
  // unless remountDeps are configured, so this stays warm across thread switches.
  const [hasOpenedDiff, setHasOpenedDiff] = useState(isDiffSearchOpen);
  const closeDiff = useCallback(() => {
    void navigate({
      to: "/$threadId",
      params: { threadId },
      search: (previous) => clearPanelSearchParams(previous),
    });
  }, [navigate, threadId]);
  const openDiff = useCallback(() => {
    void navigate({
      to: "/$threadId",
      params: { threadId },
      search: (previous) => {
        const rest = clearPanelSearchParams(previous);
        return { ...rest, diff: "1" };
      },
    });
  }, [navigate, threadId]);
  const closeBrowser = useCallback(() => {
    void navigate({
      to: "/$threadId",
      params: { threadId },
      search: (previous) => clearPanelSearchParams(previous),
    });
  }, [navigate, threadId]);
  const openBrowser = useCallback(() => {
    void navigate({
      to: "/$threadId",
      params: { threadId },
      search: (previous) => {
        const rest = clearPanelSearchParams(previous);
        return { ...rest, browser: "1" };
      },
    });
  }, [navigate, threadId]);

  useEffect(() => {
    if (isDiffSearchOpen) {
      setHasOpenedDiff(true);
    }
  }, [isDiffSearchOpen]);

  useEffect(() => {
    if (!bootstrapComplete) {
      return;
    }

    if (!routeThreadExists) {
      void navigate({ to: "/", replace: true });
      return;
    }
  }, [bootstrapComplete, navigate, routeThreadExists, threadId]);

  if (!bootstrapComplete || !routeThreadExists) {
    return null;
  }

  const shouldRenderDiffContent = diffOpen || hasOpenedDiff;

  if (!shouldUsePanelSheet) {
    return (
      <>
        <SidebarInset className="h-dvh min-h-0 overflow-hidden overscroll-y-none bg-background text-foreground">
          <ChatView threadId={threadId} />
        </SidebarInset>
        <ChatPanelInlineSidebar
          open={diffOpen}
          onClose={closeDiff}
          onOpen={openDiff}
          storageKey={DIFF_INLINE_SIDEBAR_WIDTH_STORAGE_KEY}
        >
          {shouldRenderDiffContent ? <LazyDiffPanel mode="sidebar" /> : null}
        </ChatPanelInlineSidebar>
        <ChatPanelInlineSidebar
          open={browserOpen}
          onClose={closeBrowser}
          onOpen={openBrowser}
          storageKey={BROWSER_INLINE_SIDEBAR_WIDTH_STORAGE_KEY}
        >
          {browserOpen ? <BrowserPanel mode="sidebar" /> : null}
        </ChatPanelInlineSidebar>
      </>
    );
  }

  return (
    <>
      <SidebarInset className="h-dvh min-h-0 overflow-hidden overscroll-y-none bg-background text-foreground">
        <ChatView threadId={threadId} />
      </SidebarInset>
      <ChatPanelSheet open={diffOpen} onClose={closeDiff}>
        {shouldRenderDiffContent ? <LazyDiffPanel mode="sheet" /> : null}
      </ChatPanelSheet>
      <ChatPanelSheet open={browserOpen} onClose={closeBrowser}>
        {browserOpen ? <BrowserPanel mode="sheet" /> : null}
      </ChatPanelSheet>
    </>
  );
}

export const Route = createFileRoute("/_chat/$threadId")({
  validateSearch: (search) => parseChatPanelsRouteSearch(search),
  search: {
    middlewares: [retainSearchParams<ChatPanelsRouteSearch>(["diff", "browser"])],
  },
  component: ChatThreadRouteView,
});
