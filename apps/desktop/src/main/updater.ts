/**
 * Auto-updater wiring — uses electron-updater so we get differential
 * downloads, signature verification, and rollback semantics for free.
 *
 * For this phase we only WIRE the updater; actually publishing updates
 * requires:
 *   1. A signed/notarized .dmg (macOS) or .exe (Win) — needs Apple
 *      Developer cert + Windows code-signing cert.
 *   2. A publish target (GitHub Releases, S3, R2 with latest.yml).
 *
 * Both are owner-action items documented in docs/DESKTOP_RELEASE.md.
 * Until they're configured, `checkForUpdates()` is a no-op in dev and
 * fails-soft in packaged-but-unsigned builds. We never silently apply
 * an unsigned update — autoUpdater throws if signature verification
 * doesn't succeed.
 *
 * We poll on a 6h cadence which is plenty for a desktop app — checking
 * more often would just hammer the update channel without user value.
 */
import { app, dialog } from "electron";
import type { BrowserWindow } from "electron";
// electron-updater is a CJS module; import the default so we work under
// ESM main without /dist/index.js gymnastics.
import electronUpdater from "electron-updater";
const { autoUpdater } = electronUpdater;

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

let pollHandle: NodeJS.Timeout | null = null;
// State guard — without this, a manual "Check for updates" mid-download
// or a 6h tick firing while the user's still seeing the prompt would
// open a second dialog / start a parallel download.
let updateState: "idle" | "checking" | "prompting" | "downloading" = "idle";

export interface DesktopUpdateCheckResult {
  ok: boolean;
  status: "disabled" | "busy" | "sent" | "failed";
  message: string;
}

export function initAutoUpdater(getMainWindow: () => BrowserWindow | null): void {
  // Auto-updater is a no-op when running unpackaged (electron-vite dev).
  // Workers/CI builds run with app.isPackaged === false, so we skip
  // entirely instead of failing-loud on each check.
  if (!app.isPackaged) {
    console.log("[updater] not packaged — auto-update disabled in dev");
    return;
  }

  autoUpdater.autoDownload = false;          // don't pull bytes silently
  autoUpdater.autoInstallOnAppQuit = true;   // apply at next launch

  autoUpdater.on("error", (err) => {
    // Log but don't crash — update-server hiccups shouldn't bring the
    // app down. Reset state so a future check isn't stuck in a stale
    // prompting/downloading flag.
    console.warn("[updater] error:", err?.message ?? err);
    updateState = "idle";
  });

  autoUpdater.on("update-available", async (info) => {
    // A manual/timed check sets state=checking while the request is in
    // flight; that is the one non-idle state allowed to advance into
    // the update prompt.
    if (updateState !== "idle" && updateState !== "checking") return;
    updateState = "prompting";
    const win = getMainWindow();
    const opts = {
      type: "info" as const,
      buttons: ["Download", "Later"],
      defaultId: 0,
      cancelId: 1,
      title: "Update available",
      message: `Raltic ${info.version} is available`,
      detail: "Download now and apply on next launch?",
    };
    // Branch explicitly on window presence — dialog.showMessageBox has
    // distinct overloads for parent-attached vs parentless.
    try {
      const choice = win
        ? await dialog.showMessageBox(win, opts)
        : await dialog.showMessageBox(opts);
      if (choice.response === 0) {
        updateState = "downloading";
        autoUpdater.downloadUpdate().catch((e) => {
          console.warn("[updater] download failed:", e);
          updateState = "idle";
        });
      } else {
        updateState = "idle";
      }
    } catch (e) {
      console.warn("[updater] update prompt failed:", e);
      updateState = "idle";
    }
  });

  autoUpdater.on("update-downloaded", (info) => {
    console.log(`[updater] ${info.version} downloaded — will install on next quit`);
    updateState = "idle";
  });

  autoUpdater.on("update-not-available", () => {
    updateState = "idle";
  });

  // Check immediately on boot + every 6h.
  void checkForUpdates();
  pollHandle = setInterval(() => { void checkForUpdates(); }, SIX_HOURS_MS);
}

export async function checkForUpdates(): Promise<DesktopUpdateCheckResult> {
  if (!app.isPackaged) {
    return {
      ok: false,
      status: "disabled",
      message: "Update checks are disabled in this development build.",
    };
  }
  // Skip if a prior check is still mid-flow — overlapping checks would
  // queue multiple update-available events and confuse the state machine.
  if (updateState !== "idle") {
    return {
      ok: false,
      status: "busy",
      message: "An update check is already in progress.",
    };
  }
  updateState = "checking";
  try {
    await autoUpdater.checkForUpdates();
    if (updateState === "checking") updateState = "idle";
    return {
      ok: true,
      status: "sent",
      message: "Update check started. You'll see a dialog if an update is available.",
    };
  } catch (e) {
    console.warn("[updater] check failed:", e);
    updateState = "idle";
    return {
      ok: false,
      status: "failed",
      message: e instanceof Error ? e.message : String(e),
    };
  }
}

export function teardownAutoUpdater(): void {
  if (pollHandle) {
    clearInterval(pollHandle);
    pollHandle = null;
  }
}
