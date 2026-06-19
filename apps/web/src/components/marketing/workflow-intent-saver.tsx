import type React from "react";
import {
  WORKFLOW_INTENT_STORAGE_KEY,
  WORKFLOW_INTENT_TTL_MS,
} from "@/lib/workflow-intent";
import type { WorkflowStarterKey } from "@/lib/workflow-starters";

export function WorkflowIntentSaver({ starterKey }: { starterKey: WorkflowStarterKey }): React.ReactElement {
  const source = [
    "try{",
    `window.localStorage.setItem(${JSON.stringify(WORKFLOW_INTENT_STORAGE_KEY)},`,
    `JSON.stringify({key:${JSON.stringify(starterKey)},expiresAt:Date.now()+${WORKFLOW_INTENT_TTL_MS}}));`,
    "}catch(e){}",
  ].join("");

  return (
    <script
      dangerouslySetInnerHTML={{
        __html: source,
      }}
    />
  );
}
