"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { Card, CardHeader, CardTitle, CardDescription, CardPanel, CardFooter } from "@/components/heroui-pro/card";
import { Button } from "@/components/heroui-pro/button";
import { Alert, AlertDescription } from "@/components/heroui-pro/alert";

interface Preview {
  server: { id: string; name: string; slug: string; description: string | null };
  role: string;
}

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const inviteId = params.id as string;
  const session = authClient.useSession();
  const [preview, setPreview] = useState<Preview | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api.previewInvite(inviteId);
        if (!cancelled) setPreview(data);
      } catch (e) {
        if (!cancelled) setLoadError(e instanceof ApiError ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [inviteId]);

  async function handleAccept() {
    setAccepting(true); setAcceptError(null);
    try {
      const res = await api.acceptInvite(inviteId);
      // `?welcome=joined` triggers a one-time toast on landing pointing
      // out the user's own personal workspace (top-left switcher) — most
      // invitees don't realize they have one and otherwise wonder why
      // their own agents are "missing" from this workspace's sidebar.
      router.push(`/s/${res.serverSlug}?welcome=joined`);
    } catch (e) {
      setAcceptError(e instanceof ApiError ? e.message : String(e));
      setAccepting(false);
    }
  }

  if (loading || session.isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-8">
        <Card className="w-full max-w-sm border-dashed text-center shadow-none">
          <CardPanel className="space-y-1 text-sm">
            <p className="font-medium text-foreground">
              {loading ? "Loading invite" : "Checking your account"}
            </p>
            <p className="text-muted-foreground">
              {loading ? "Confirming this invite is still available." : "Checking whether you're already signed in."}
            </p>
          </CardPanel>
        </Card>
      </div>
    );
  }

  if (loadError || !preview) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-8">
        <Card className="w-full max-w-sm text-center">
          <CardHeader>
            <h1 className="sr-only">Invite unavailable</h1>
            <CardTitle>Invite unavailable</CardTitle>
            <CardDescription>{loadError ?? "This invite can no longer be used."}</CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Button render={<Link href="/" />} variant="outline" size="sm">Go home</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!session.data?.user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="w-full max-w-sm mx-4">
          <Card>
            <CardHeader className="text-center">
              <h1 className="sr-only">Join {preview.server.name}</h1>
              <CardTitle>Join {preview.server.name}</CardTitle>
              <CardDescription>{preview.server.description ?? "You've been invited."}</CardDescription>
            </CardHeader>
            <CardPanel>
              <p className="text-center text-sm text-muted-foreground">
                Sign in or create an account to accept this invite.
              </p>
            </CardPanel>
            <CardFooter className="flex-col gap-2">
              <Button
                render={<Link href={`/login?next=${encodeURIComponent(`/invite/${inviteId}`)}`} />}
                className="w-full"
              >
                Sign in
              </Button>
              <Button
                render={<Link href={`/signup?next=${encodeURIComponent(`/invite/${inviteId}`)}`} />}
                variant="outline"
                className="w-full"
              >
                Create account
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm mx-4">
        <Card>
          <CardHeader className="text-center">
            <h1 className="sr-only">Join {preview.server.name}</h1>
            <CardTitle>Join {preview.server.name}</CardTitle>
            <CardDescription>
              {preview.server.description ?? `You've been invited to /${preview.server.slug}.`}
            </CardDescription>
          </CardHeader>
          <CardPanel>
            <p className="text-center text-sm text-muted-foreground">
              You'll join as <strong>{preview.role}</strong>.
            </p>
            {acceptError && (
              <Alert variant="error" className="mt-3">
                <AlertDescription>{acceptError}</AlertDescription>
              </Alert>
            )}
          </CardPanel>
          <CardFooter className="flex-col gap-2">
            <Button onClick={handleAccept} loading={accepting} className="w-full">Accept invite</Button>
            <Link href="/" className="text-xs text-muted-foreground hover:text-foreground">Decline</Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
