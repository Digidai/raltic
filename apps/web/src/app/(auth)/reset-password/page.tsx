"use client";

import { Suspense, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Card, CardHeader, CardTitle, CardDescription, CardPanel, CardFooter } from "@/components/heroui-pro/card";
import { Button } from "@/components/heroui-pro/button";
import { Input } from "@/components/heroui-pro/input";
import { Field, FieldDescription, FieldLabel } from "@/components/heroui-pro/field";
import { Alert, AlertDescription } from "@/components/heroui-pro/alert";

const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 256;

type PasswordField = "new" | "confirm";
type AuthClientError = {
  code?: string;
  message?: string;
} | null | undefined;

function resetPasswordErrorMessage(error: AuthClientError) {
  const code = (error?.code ?? "").toUpperCase();
  if (code === "INVALID_TOKEN") return "This reset link is invalid or expired.";
  if (code === "PASSWORD_TOO_SHORT") return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  if (code === "PASSWORD_TOO_LONG") return `Password must be ${PASSWORD_MAX_LENGTH} characters or fewer.`;
  return error?.message ?? "Reset failed";
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">Loading…</div>}>
      <ResetForm />
    </Suspense>
  );
}

function ResetForm() {
  const sp = useSearchParams();
  const router = useRouter();
  const token = sp.get("token") ?? "";
  const callbackError = sp.get("error");
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorField, setErrorField] = useState<PasswordField | null>(null);
  const newPasswordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);
  const linkError = callbackError
    ? "This reset link is invalid or expired."
    : token
      ? null
      : "Open the reset link from your email.";
  const statusMessage = error ?? linkError;
  const statusId = statusMessage ? "reset-password-status" : undefined;
  const requirementsId = "reset-password-requirements";
  const showRecoveryLink = Boolean(linkError) || statusMessage === "This reset link is invalid or expired.";

  function setFieldError(message: string, field?: PasswordField) {
    setError(message);
    setErrorField(field ?? null);
    const target = field === "new"
      ? newPasswordRef.current
      : field === "confirm"
        ? confirmPasswordRef.current
        : null;
    window.requestAnimationFrame(() => target?.focus());
  }

  function clearFieldError() {
    setError(null);
    setErrorField(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) { setFieldError("Reset link is missing the token."); return; }
    if (!pwd) { setFieldError("Enter a new password.", "new"); return; }
    if (pwd.length < PASSWORD_MIN_LENGTH) { setFieldError(`Password must be at least ${PASSWORD_MIN_LENGTH} characters.`, "new"); return; }
    if (pwd.length > PASSWORD_MAX_LENGTH) { setFieldError(`Password must be ${PASSWORD_MAX_LENGTH} characters or fewer.`, "new"); return; }
    if (!pwd2) { setFieldError("Confirm your new password.", "confirm"); return; }
    if (pwd !== pwd2) { setFieldError("Passwords don't match", "confirm"); return; }
    setLoading(true); clearFieldError();
    try {
      const { error } = await authClient.resetPassword({ newPassword: pwd, token });
      if (error) { setFieldError(resetPasswordErrorMessage(error)); return; }
      router.push("/login?reset=ok");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally { setLoading(false); }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm mx-4">
        <Card>
          <CardHeader className="text-center">
            <h1 className="sr-only">Set a new password</h1>
            <CardTitle className="text-2xl">Set a new password</CardTitle>
            <CardDescription>Pick something you'll remember.</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit} noValidate aria-describedby={statusId}>
            <CardPanel>
              <div className="space-y-4">
                <Field>
                  <FieldLabel htmlFor="reset-password-new">New password</FieldLabel>
                  <Input
                    ref={newPasswordRef}
                    id="reset-password-new"
                    aria-label="New password"
                    aria-describedby={[requirementsId, statusId].filter(Boolean).join(" ")}
                    aria-invalid={errorField === "new"}
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={PASSWORD_MIN_LENGTH}
                    maxLength={PASSWORD_MAX_LENGTH}
                    value={pwd}
                    onChange={(e) => {
                      setPwd((e.target as HTMLInputElement).value);
                      clearFieldError();
                    }} />
                  <FieldDescription id={requirementsId}>At least {PASSWORD_MIN_LENGTH} characters.</FieldDescription>
                </Field>
                <Field>
                  <FieldLabel htmlFor="reset-password-confirm">Confirm new password</FieldLabel>
                  <Input
                    ref={confirmPasswordRef}
                    id="reset-password-confirm"
                    aria-label="Confirm new password"
                    aria-describedby={statusId}
                    aria-invalid={errorField === "confirm"}
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={PASSWORD_MIN_LENGTH}
                    maxLength={PASSWORD_MAX_LENGTH}
                    value={pwd2}
                    onChange={(e) => {
                      setPwd2((e.target as HTMLInputElement).value);
                      clearFieldError();
                    }} />
                </Field>
                {statusMessage && (
                  <Alert variant="error">
                    <AlertDescription id="reset-password-status">
                      {statusMessage}{" "}
                      {showRecoveryLink && (
                        <Link href="/forgot-password" className="font-medium underline underline-offset-4">
                          Request a new reset email
                        </Link>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardPanel>
            <CardFooter className="flex-col gap-4">
              <Button type="submit" loading={loading} disabled={!token || loading} className="w-full">Update password</Button>
              <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">
                Back to sign in
              </Link>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
