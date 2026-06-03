const PROD_WEB_HOSTS = new Set(["raltic.com", "www.raltic.com"]);

export function isLocalWebTarget(): boolean {
  const raw = process.env.E2E_BASE_URL;
  if (!raw) return false;
  try {
    const hostname = new URL(raw).hostname.toLowerCase();
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
  } catch {
    return false;
  }
}

export function isProductionWebTarget(): boolean {
  const raw = process.env.E2E_BASE_URL;
  if (!raw) return false;
  try {
    return PROD_WEB_HOSTS.has(new URL(raw).hostname.toLowerCase());
  } catch {
    return false;
  }
}

export function isPreDeployProductionTarget(): boolean {
  return process.env.E2E_PREDEPLOY_PRODUCTION === "1" && isProductionWebTarget();
}

export function mutatingTargetSkipReason(): string | null {
  if (!isProductionWebTarget()) return null;
  if (process.env.E2E_ALLOW_PROD_WRITES === "1") return null;
  return "Refusing to run mutating E2E against production. Use staging/local, or set E2E_ALLOW_PROD_WRITES=1 intentionally.";
}
