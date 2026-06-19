import { INDEXNOW_KEY } from "@/lib/indexnow";

export const dynamic = "force-static";

export function GET(): Response {
  return new Response(`${INDEXNOW_KEY}\n`, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}
