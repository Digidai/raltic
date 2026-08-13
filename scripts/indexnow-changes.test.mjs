import assert from "node:assert/strict";
import test from "node:test";
import { changedIndexableUrls, deletedIndexableUrls } from "./indexnow-changes.mjs";

const urls = [
  "https://raltic.com/",
  "https://raltic.com/workflows",
  "https://raltic.com/workflows/launch-readiness",
  "https://raltic.com/runtimes",
  "https://raltic.com/runtimes/claude",
  "https://raltic.com/features",
  "https://raltic.com/features/workflow-rooms",
  "https://raltic.com/built-for",
  "https://raltic.com/built-for/product-teams",
  "https://raltic.com/blog",
  "https://raltic.com/blog/what-is-an-agent-workflow",
  "https://raltic.com/answers",
  "https://raltic.com/answers/what-is-an-ai-workflow-room",
  "https://raltic.com/best",
  "https://raltic.com/best/ai-agent-orchestration-platforms",
  "https://raltic.com/privacy",
];

test("global marketing changes submit every indexable sitemap URL", () => {
  assert.deepEqual(changedIndexableUrls(["apps/web/src/lib/seo.ts"], urls), [...urls].sort());
});

test("workflow data changes submit only the workflow collection", () => {
  assert.deepEqual(
    changedIndexableUrls(["apps/web/src/lib/workflow-seo.ts"], urls),
    [
      "https://raltic.com/workflows",
      "https://raltic.com/workflows/launch-readiness",
    ],
  );
});

test("private app and auth-only changes do not notify IndexNow", () => {
  assert.deepEqual(
    changedIndexableUrls([
      "apps/web/src/app/s/[slug]/page.tsx",
      "apps/web/src/app/(auth)/login/page.tsx",
    ], urls),
    [],
  );
});

test("runtime detail changes include the runtime index and verified details", () => {
  assert.deepEqual(
    changedIndexableUrls(["apps/web/src/app/(marketing)/runtimes/claude/page.tsx"], urls),
    [
      "https://raltic.com/runtimes",
      "https://raltic.com/runtimes/claude",
    ],
  );
});

test("growth registries notify only their feature and audience collections", () => {
  assert.deepEqual(
    changedIndexableUrls(["apps/web/src/lib/growth-content.ts"], urls),
    [
      "https://raltic.com/built-for",
      "https://raltic.com/built-for/product-teams",
      "https://raltic.com/features",
      "https://raltic.com/features/workflow-rooms",
    ],
  );
});

test("editorial registry changes notify blog and answer collections", () => {
  assert.deepEqual(
    changedIndexableUrls(["apps/web/src/lib/editorial-content.ts"], urls),
    [
      "https://raltic.com/answers",
      "https://raltic.com/answers/what-is-an-ai-workflow-room",
      "https://raltic.com/blog",
      "https://raltic.com/blog/what-is-an-agent-workflow",
    ],
  );
});

test("buyer guide changes notify the complete buyer guide collection", () => {
  assert.deepEqual(
    changedIndexableUrls(["apps/web/src/lib/buyer-guide-content.ts"], urls),
    [
      "https://raltic.com/best",
      "https://raltic.com/best/ai-agent-orchestration-platforms",
    ],
  );
});

test("URLs removed from the deployed sitemap are submitted as deletions", () => {
  assert.deepEqual(
    deletedIndexableUrls(
      [...urls, "https://raltic.com/retired-page"],
      urls,
    ),
    ["https://raltic.com/retired-page"],
  );
});

test("homepage CTA and future marketing files remain discoverable", () => {
  assert.deepEqual(
    changedIndexableUrls(["apps/web/src/components/home-cta.tsx"], urls),
    ["https://raltic.com/"],
  );
  assert.deepEqual(
    changedIndexableUrls(["apps/web/src/app/(marketing)/future/page.tsx"], urls),
    [...urls].sort(),
  );
});
