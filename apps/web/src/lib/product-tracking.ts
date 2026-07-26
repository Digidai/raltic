import { trackFunnelEvent } from "@/lib/funnel-analytics";

type ProductEvent =
  | "workflow_starter_match_selected"
  | "workflow_starter_click"
  | "workflow_starter_runtime_gate_opened"
  | "workflow_room_opened"
  | "workflow_room_created"
  | "workflow_room_joined"
  | "workflow_starter_draft_used"
  | "workflow_starter_brief_sent"
  | "workspace_opened";

export function trackProductEvent(event: ProductEvent, target: string): void {
  trackFunnelEvent(event, { target });
}
