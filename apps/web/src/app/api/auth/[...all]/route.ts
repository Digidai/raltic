import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createAuth } from "@raltic/auth-core";

/**
 * Better-auth catchall handler. Lives on the web origin so cookies and
 * verification email links share a single domain with the UI.
 *
 * The raltic-api Worker no longer serves /api/auth/*; it just trusts
 * Bearer sy_session_<token> headers, looking up sessions in the same D1.
 */
async function handler(req: Request): Promise<Response> {
  const { env } = getCloudflareContext();
  try {
    const auth = createAuth(env as never);
    return auth.handler(req);
  } catch (err) {
    if (canReturnLocalAnonymousSession(req, err)) {
      return Response.json(null);
    }
    throw err;
  }
}

export const GET = handler;
export const POST = handler;

function canReturnLocalAnonymousSession(req: Request, err: unknown): boolean {
  if (process.env.NODE_ENV !== "development") return false;
  if (!isMissingBetterAuthSecret(err)) return false;
  if (req.headers.get("cookie")) return false;
  return new URL(req.url).pathname.endsWith("/api/auth/get-session");
}

function isMissingBetterAuthSecret(err: unknown): boolean {
  return err instanceof Error && err.message.includes("BETTER_AUTH_SECRET is missing");
}
