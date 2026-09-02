/**
 * Global safety net for errors that escape component-level try/catch:
 *  - Unhandled promise rejections
 *  - Uncaught JS errors (native ErrorUtils + web window events)
 *
 * Goal: the app should never hard-crash from an async error. We log a trimmed,
 * non-sensitive summary and swallow the failure so the UI stays alive.
 */

declare const __DEV__: boolean;

function summarize(error: unknown): string {
  try {
    const msg = error instanceof Error ? error.message : String(error);
    return (msg || "unknown error").slice(0, 200);
  } catch {
    return "unknown error";
  }
}

let installed = false;

export function installGlobalErrorHandlers() {
  if (installed) return;
  installed = true;

  // --- React Native / Hermes global error handler ---
  try {
    const g: any = globalThis as any;
    if (g?.ErrorUtils?.setGlobalHandler) {
      const previous = g.ErrorUtils.getGlobalHandler?.();
      g.ErrorUtils.setGlobalHandler((error: any, isFatal?: boolean) => {
        console.warn("[GlobalError]", summarize(error));
        // In development keep the original redbox for debuggability.
        if (typeof __DEV__ !== "undefined" && __DEV__ && typeof previous === "function") {
          previous(error, isFatal);
        }
        // In production-like previews we intentionally swallow to avoid a crash.
      });
    }
  } catch {
    /* noop */
  }

  // --- Web / DOM handlers ---
  try {
    const w: any = typeof window !== "undefined" ? window : undefined;
    if (w?.addEventListener) {
      w.addEventListener("unhandledrejection", (ev: any) => {
        try {
          console.warn("[UnhandledRejection]", summarize(ev?.reason));
          ev?.preventDefault?.();
        } catch {
          /* noop */
        }
      });
      w.addEventListener("error", (ev: any) => {
        try {
          console.warn("[WindowError]", summarize(ev?.error || ev?.message));
        } catch {
          /* noop */
        }
      });
    }
  } catch {
    /* noop */
  }
}
