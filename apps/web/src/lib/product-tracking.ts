type ProductEvent =
  | "workflow_starter_click"
  | "workflow_room_created"
  | "workflow_starter_draft_used";

export function trackProductEvent(event: ProductEvent, target: string): void {
  if (typeof window === "undefined") return;
  const body = JSON.stringify({
    event,
    path: window.location.pathname,
    target,
    referrer: document.referrer || null,
    ts: Date.now(),
  });
  try {
    const blob = new Blob([body], { type: "application/json" });
    if (navigator.sendBeacon?.("/api/marketing/event", blob)) return;
  } catch {
    // Fall through to fetch below.
  }
  void fetch("/api/marketing/event", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {});
}
