/**
 * Deprecated endpoint.
 *
 * The web client now uses /api/me/api-token, which mints a short-lived
 * HMAC token for cross-origin API calls. Returning the long-lived
 * better-auth session token to browser JavaScript would defeat the
 * HttpOnly session-cookie boundary.
 */
export async function GET(): Promise<Response> {
  return Response.json(
    { error: { code: "SESSION_TOKEN_ENDPOINT_DISABLED" } },
    { status: 404 },
  );
}
