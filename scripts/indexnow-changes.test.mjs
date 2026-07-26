import assert from "node:assert/strict";
import test from "node:test";
import { changedIndexableUrls, deletedIndexableUrls } from "./indexnow-changes.mjs";

const urls = [
  "https://raltic.com/",
  "https://raltic.com/workflows",
  "https://raltic.com/workflows/launch-readiness",
  "https://raltic.com/runtimes",
  "https://raltic.com/runtimes/claude",
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
