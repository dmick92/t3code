import * as React from "react";

type ReactSharedInternals = {
  H: {
    useMemoCache: (size: number) => unknown;
  } | null;
};

const reactSharedInternals = (
  React as unknown as {
    __CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE: ReactSharedInternals;
  }
).__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;

export function c(size: number) {
  const dispatcher = reactSharedInternals.H;
  if (dispatcher === null) {
    console.error(
      "Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for one of the following reasons:\n1. You might have mismatching versions of React and the renderer (such as React DOM)\n2. You might be breaking the Rules of Hooks\n3. You might have more than one copy of React in the same app\nSee https://react.dev/link/invalid-hook-call for tips about how to debug and fix this problem.",
    );
    throw new Error("React dispatcher is not available.");
  }
  return dispatcher.useMemoCache(size);
}

export default { c };
