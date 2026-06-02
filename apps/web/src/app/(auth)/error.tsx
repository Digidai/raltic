"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Alert, AlertDescription } from "@/components/heroui-pro/alert";
import { Button } from "@/components/heroui-pro/button";
import { Card, CardDescription, CardFooter, CardHeader, CardPanel, CardTitle } from "@/components/heroui-pro/card";

/**
 * Auth-routes error boundary. Catches render errors on /login,
 * /signup, /reset-password, etc. Shows a focused recovery card so
 * a failed render doesn't kick the user back to root error.tsx
 * (which is meant for fully-broken pages, not "this form bricked").
 */
export default function AuthError({ error, reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.ReactElement {
  useEffect(() => { console.error("[auth error.tsx]", error); }, [error]);
  return (
    <div className="flex min-h-[calc(100svh-8rem)] items-center justify-center bg-background px-4 py-10 text-foreground">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle>Sign-in hit an error</CardTitle>
          <CardDescription>Try again, or return home and start from a fresh session.</CardDescription>
        </CardHeader>
        <CardPanel>
          <Alert variant="error">
            <AlertDescription>
              {error.message || "Something went wrong rendering this page."}
            </AlertDescription>
          </Alert>
          {error.digest && (
            <p className="mt-3 break-all text-center text-[11px] text-muted-foreground">
              Reference: {error.digest}
            </p>
          )}
        </CardPanel>
        <CardFooter className="flex-col-reverse sm:flex-row sm:justify-center">
          <Button variant="outline" size="sm" render={<Link href="/" />}>Home</Button>
          <Button type="button" onClick={() => reset()} size="sm">Try again</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
