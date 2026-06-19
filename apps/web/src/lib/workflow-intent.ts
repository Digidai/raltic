import { WORKFLOW_STARTERS, type WorkflowStarterKey } from "@/lib/workflow-starters";

export const WORKFLOW_INTENT_STORAGE_KEY = "raltic:workflow:intent";
export const WORKFLOW_INTENT_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const WORKFLOW_KEYS = new Set<WorkflowStarterKey>(WORKFLOW_STARTERS.map((starter) => starter.key));

type StoredWorkflowIntent = {
  key: WorkflowStarterKey;
  expiresAt: number;
};

export function isWorkflowStarterKey(value: string | null | undefined): value is WorkflowStarterKey {
  return Boolean(value && WORKFLOW_KEYS.has(value as WorkflowStarterKey));
}

export function persistWorkflowStarterIntent(key: WorkflowStarterKey): void {
  if (typeof window === "undefined") return;
  const payload: StoredWorkflowIntent = {
    key,
    expiresAt: Date.now() + WORKFLOW_INTENT_TTL_MS,
  };
  try {
    window.localStorage.setItem(WORKFLOW_INTENT_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Private browsing or blocked storage degrades to normal Start page selection.
  }
}

export function readStoredWorkflowStarterIntent(): WorkflowStarterKey | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(WORKFLOW_INTENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredWorkflowIntent>;
    if (!isWorkflowStarterKey(parsed.key)) return null;
    if (typeof parsed.expiresAt !== "number" || parsed.expiresAt < Date.now()) {
      clearStoredWorkflowStarterIntent();
      return null;
    }
    return parsed.key;
  } catch {
    return null;
  }
}

export function clearStoredWorkflowStarterIntent(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(WORKFLOW_INTENT_STORAGE_KEY);
  } catch {
    // ignore
  }
}
