"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/heroui-pro/button";
import { Alert, AlertDescription } from "@/components/heroui-pro/alert";
import { Card, CardDescription, CardFooter, CardHeader, CardPanel, CardTitle } from "@/components/heroui-pro/card";

/**
 * Invite-acceptance error boundary. If invite metadata fetch fails
 * we want a focused "this invite link is broken" UI, not the full
 * root error.tsx which is too heavy for what's typically a copy-paste
 * link issue.
 */
export default function InviteError({ error, reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.ReactElement {
  useEffect(() => { console.error("[invite error.tsx]", error); }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-8">
      <Card className="w-full max-w-sm text-center">
        <CardHeader>
          <CardTitle>Invite link issue</CardTitle>
          <CardDescription>We couldn't load this invite.</CardDescription>
        </CardHeader>
        <CardPanel>
          <Alert variant="error" className="text-left">
            <AlertDescription>The link may be expired, already used, or unavailable right now.</AlertDescription>
          </Alert>
          {error.digest && <p className="mt-3 text-[11px] text-muted-foreground">Reference: {error.digest}</p>}
        </CardPanel>
        <CardFooter className="justify-center">
          <Button type="button" onClick={() => reset()} size="sm">Try again</Button>
          <Button variant="outline" size="sm" render={<Link href="/" />}>Home</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
