const apiKeyEl = (
  /** @type {HTMLInputElement} */
  document.getElementById("apiKey")
);
const serverUrlEl = (
  /** @type {HTMLInputElement} */
  document.getElementById("serverUrl")
);
const statusEl = (
  /** @type {HTMLElement} */
  document.getElementById("status")
);
const saveBtn = (
  /** @type {HTMLButtonElement} */
  document.getElementById("save")
);
const updatesBtn = (
  /** @type {HTMLButtonElement} */
  document.getElementById("updates")
);
const IPC_TIMEOUT_MS = 2e4;
function setStatus(text, isErr) {
  statusEl.textContent = text;
  statusEl.classList.toggle("err", !!isErr);
}
function withTimeout(promise, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = window.setTimeout(() => {
      reject(new Error(`${label} timed out. The bridge may still be finishing in the background.`));
    }, IPC_TIMEOUT_MS);
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timer) window.clearTimeout(timer);
  });
}
function isValidHttpUrl(raw) {
  try {
    const u = new URL(raw);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}
function bridgeStatusText(st, saved) {
  const serverIds = Array.isArray(st.serverIds) ? st.serverIds : st.serverId ? [st.serverId] : [];
  if (st.running) {
    if (serverIds.length > 1) return `Bridge is running for ${serverIds.length} workspaces.`;
    if (serverIds.length === 1) return `Bridge is running for workspace ${serverIds[0]}.`;
    return "Bridge is running.";
  }
  if (saved) return "Saved, but the bridge is idle. Check the key and try again.";
  return "Bridge is idle — add an API key to start.";
}
async function load() {
  try {
    const cfg = await withTimeout(window.raltic.getConfig(), "Load config");
    apiKeyEl.value = cfg.apiKey || "";
    serverUrlEl.value = cfg.serverUrl || "";
    if (cfg.serverUrl && !isValidHttpUrl(cfg.serverUrl)) {
      setStatus("Stored server URL is invalid. Correct it before saving.", true);
      return;
    }
    const st = await withTimeout(window.raltic.bridgeStatus(), "Load bridge status");
    setStatus(bridgeStatusText(st, false));
  } catch (e) {
    setStatus("Couldn't load config: " + (e && e.message ? e.message : e), true);
  }
}
saveBtn.addEventListener("click", async () => {
  saveBtn.disabled = true;
  setStatus("Saving + restarting bridge…");
  try {
    const r = await withTimeout(window.raltic.saveConfig({
      apiKey: apiKeyEl.value,
      serverUrl: serverUrlEl.value
    }), "Save");
    setStatus(bridgeStatusText(r, true));
  } catch (e) {
    setStatus("Save failed: " + (e && e.message ? e.message : e), true);
  } finally {
    saveBtn.disabled = false;
  }
});
updatesBtn.addEventListener("click", async () => {
  updatesBtn.disabled = true;
  setStatus("Checking for updates…");
  try {
    const result = await withTimeout(window.raltic.checkForUpdates(), "Update check");
    setStatus(result.message, result.status === "failed");
  } catch (e) {
    setStatus("Update check failed: " + (e && e.message ? e.message : e), true);
  } finally {
    updatesBtn.disabled = false;
  }
});
load();
