"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { User as UserIcon, Mail, LogOut, ShieldCheck, Upload, Home, Copy, KeyRound } from "lucide-react";
import { authClient, signOut, useSession } from "@/lib/auth-client";
import { api } from "@/lib/api";
import { notifySuccess, notifyThrown } from "@/lib/notify";
import { getApiOrigin } from "@/lib/auth-client";
import { Card, CardHeader, CardTitle, CardDescription, CardPanel } from "@/components/heroui-pro/card";
import { Button } from "@/components/heroui-pro/button";
import { Input } from "@/components/heroui-pro/input";
import { Field, FieldDescription, FieldLabel } from "@/components/heroui-pro/field";
import { Radio, RadioGroup } from "@/components/heroui-pro/radio";
import { Checkbox } from "@/components/heroui-pro/checkbox";
import { Chip } from "@/components/heroui-pro/chip";
import { Alert, AlertDescription } from "@/components/heroui-pro/alert";
import { SettingsSection } from "../layout";

const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 256;
const REAUTH_PASSWORD_MESSAGE = "For security, confirm your sign-in before changing your password.";

type AuthClientError = {
  code?: string;
  message?: string;
} | null | undefined;

type PasswordFieldKey = "current" | "new" | "confirm";

type PasswordFormStatus = {
  message: string;
  field?: PasswordFieldKey;
};

function passwordChangeErrorStatus(error: AuthClientError): PasswordFormStatus {
  const code = (error?.code ?? "").toUpperCase();
  const message = error?.message ?? "";
  const normalized = `${code} ${message}`.toLowerCase();

  if (code === "INVALID_PASSWORD" || normalized.includes("invalid password")) {
    return { message: "Current password is incorrect.", field: "current" };
  }
  if (code === "PASSWORD_TOO_SHORT" || normalized.includes("too short")) {
    return { message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`, field: "new" };
  }
  if (code === "PASSWORD_TOO_LONG" || normalized.includes("too long")) {
    return { message: `Password must be ${PASSWORD_MAX_LENGTH} characters or fewer.`, field: "new" };
  }
  if (code === "CREDENTIAL_ACCOUNT_NOT_FOUND" || normalized.includes("credential")) {
    return { message: "This account does not have a password yet. Send a reset email to create one." };
  }
  if (
    code === "SESSION_NOT_FRESH"
    || code === "SESSION_EXPIRED"
    || normalized.includes("not fresh")
    || normalized.includes("re-authenticate")
  ) {
    return { message: REAUTH_PASSWORD_MESSAGE };
  }
  if (code === "UNAUTHORIZED" || normalized.includes("unauthorized")) {
    return { message: "Your session expired. Sign in again before changing your password." };
  }

  return { message: message || "Couldn't change password." };
}

// Personal account settings — scoped to the signed-in user, not the
// workspace. Same surface no matter which workspace is in the URL bar:
// display name (renames you across every workspace), email (read-only,
// shown so users can verify which account they're signed in as), sign-out.
export default function AccountSettingsPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [revokeOtherSessions, setRevokeOtherSessions] = useState(true);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordErrorField, setPasswordErrorField] = useState<PasswordFieldKey | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const currentPasswordRef = useRef<HTMLInputElement>(null);
  const newPasswordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);

  // Hydrate the form once the session resolves. We avoid hydrating on
  // every re-render so the input doesn't snap back if the user is mid-edit.
  useEffect(() => {
    if (session?.user.name) setDisplayName(session.user.name);
  }, [session?.user.name]);

  if (isPending || !session) {
    return (
      <SettingsSection title="Account">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </SettingsSection>
    );
  }

  const user = session.user;
  const dirty = displayName.trim().length > 0 && displayName.trim() !== user.name;
  const passwordDirty = currentPassword.length > 0 || newPassword.length > 0 || confirmPassword.length > 0;
  const passwordStatusId = passwordError || passwordSuccess ? "account-password-status" : undefined;
  const passwordRequirementsId = "account-password-requirements";
  const passwordResetHref = user.email ? `/forgot-password?email=${encodeURIComponent(user.email)}` : "/forgot-password";
  const passwordReauthHref = `/login?next=${encodeURIComponent(pathname)}`;
  const passwordNeedsReauth = passwordError === REAUTH_PASSWORD_MESSAGE;

  function validatePasswordChange(): PasswordFormStatus | null {
    if (!currentPassword) return { message: "Enter your current password.", field: "current" };
    if (!newPassword) return { message: "Enter a new password.", field: "new" };
    if (newPassword.length < PASSWORD_MIN_LENGTH) return { message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`, field: "new" };
    if (newPassword.length > PASSWORD_MAX_LENGTH) return { message: `Password must be ${PASSWORD_MAX_LENGTH} characters or fewer.`, field: "new" };
    if (!confirmPassword) return { message: "Confirm your new password.", field: "confirm" };
    if (newPassword !== confirmPassword) return { message: "New passwords don't match.", field: "confirm" };
    if (currentPassword === newPassword) return { message: "New password must be different from your current password.", field: "new" };
    return null;
  }

  function focusPasswordField(field: PasswordFieldKey | undefined) {
    const target = field === "current"
      ? currentPasswordRef.current
      : field === "new"
        ? newPasswordRef.current
        : field === "confirm"
          ? confirmPasswordRef.current
          : null;
    window.requestAnimationFrame(() => target?.focus());
  }

  async function handleSaveName() {
    if (!dirty) return;
    setSaving(true);
    try {
      const { error } = await authClient.updateUser({ name: displayName.trim() });
      if (error) throw new Error(error.message ?? "Couldn't update name");
      notifySuccess("Display name updated");
      // No router.refresh needed — useSession watches the cookie and the
      // next access will see the new name. Sidebar avatars derived from
      // `image` aren't touched here.
    } catch (e) {
      notifyThrown("Couldn't update name", e);
    } finally {
      setSaving(false);
    }
  }

  async function copyEmail() {
    if (!user.email) return;
    try {
      await navigator.clipboard.writeText(user.email);
      notifySuccess("Email copied");
    } catch {
      notifyThrown("Clipboard blocked", new Error("Browser refused clipboard access"));
    }
  }

  async function handleChangePassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (changingPassword) return;

    const validationError = validatePasswordChange();
    setPasswordSuccess(null);
    setPasswordError(validationError?.message ?? null);
    setPasswordErrorField(validationError?.field ?? null);
    if (validationError) {
      focusPasswordField(validationError.field);
      return;
    }

    setChangingPassword(true);
    try {
      const { error } = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions,
      });
      if (error) {
        const nextStatus = passwordChangeErrorStatus(error);
        setPasswordError(nextStatus.message);
        setPasswordErrorField(nextStatus.field ?? null);
        focusPasswordField(nextStatus.field);
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordErrorField(null);
      await authClient.getSession({ query: { disableCookieCache: true } });
      const message = revokeOtherSessions
        ? "Password updated. Other sessions were signed out."
        : "Password updated. Other sessions stayed active.";
      setPasswordSuccess(message);
      notifySuccess("Password updated", revokeOtherSessions ? "Other sessions were signed out." : undefined);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setPasswordError(message || "Couldn't change password.");
      setPasswordErrorField(null);
      notifyThrown("Couldn't change password", error);
    } finally {
      setChangingPassword(false);
    }
  }

  async function handleAvatarUpload(file: File | null) {
    if (!file || uploadingAvatar) return;
    if (file.size > 2 * 1024 * 1024) {
      notifyThrown("Avatar upload failed", new Error("File must be under 2 MB"));
      return;
    }
    setUploadingAvatar(true);
    try {
      // Default purpose = "avatar" → PUT handler also updates user.image
      // server-side. No follow-up updateUser() needed; better-auth's
      // useSession will pick up the new image on next refetch.
      const meta = await api.startAvatarUpload(file.type);
      const apiOrigin = getApiOrigin();
      const uploadOrigin = (() => { try { return new URL(meta.uploadUrl).origin; } catch { return ""; } })();
      const sameOrigin = uploadOrigin === apiOrigin;
      const headers: Record<string, string> = { "Content-Type": file.type };
      if (sameOrigin) {
        const tokRes = await fetch("/api/me/api-token", { credentials: "include" });
        const tokBody = (await tokRes.json()) as { token: string };
        headers["Authorization"] = `Bearer sy_api_${tokBody.token}`;
      }
      const res = await fetch(meta.uploadUrl, { method: "PUT", headers, body: await file.arrayBuffer() });
      if (!res.ok) throw new Error(await res.text());
      // Force useSession to refetch so the new avatar shows immediately
      // in this view + sidebar + everywhere user.image is rendered.
      await authClient.getSession({ query: { disableCookieCache: true } });
      notifySuccess("Avatar updated");
    } catch (e) {
      notifyThrown("Couldn't upload avatar", e);
    } finally {
      setUploadingAvatar(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOut();
      router.replace("/login");
    } catch (e) {
      notifyThrown("Sign out failed", e);
      setSigningOut(false);
    }
  }

  return (
    <SettingsSection title="Account" description="Your personal profile — shared across every workspace you're in.">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><UserIcon className="h-4 w-4" /> Profile</CardTitle>
          <CardDescription>How teammates see you in messages and mentions.</CardDescription>
        </CardHeader>
        <CardPanel>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="shrink-0 self-start">
              {user.image ? (
                <img src={user.image} alt="Your avatar" className="h-16 w-16 rounded-full object-cover ring-1 ring-border" referrerPolicy="no-referrer" loading="lazy" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent-soft)] text-2xl font-semibold text-[var(--accent-soft-foreground)] ring-1 ring-accent/15">
                  {(user.name ?? user.email ?? "?").slice(0, 1).toUpperCase()}
                </div>
              )}
              {/* Upload affordance under the avatar — same vertical rhythm
                  as the Workspace tab's icon uploader so the two screens
                  feel like one design language. */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-2 h-auto px-2 py-1 text-[10.5px]"
                disabled={uploadingAvatar}
                onPress={() => fileRef.current?.click()}
              >
                <Upload className="h-3 w-3" aria-hidden="true" />
                {uploadingAvatar ? "Uploading…" : "Change"}
              </Button>
              <Input
                ref={fileRef}
                aria-label="Avatar image"
                type="file"
                accept="image/png,image/jpeg,image/gif,image/webp"
                className="hidden"
                disabled={uploadingAvatar}
                unstyled
                onChange={(e) => handleAvatarUpload(e.target.files?.[0] ?? null)}
              />
            </div>
            <div className="min-w-0 flex-1 space-y-3">
              <Field>
                <FieldLabel htmlFor="account-display-name">Display name</FieldLabel>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    id="account-display-name"
                    aria-label="Display name"
                    value={displayName}
                    onChange={(e) => setDisplayName((e.target as HTMLInputElement).value)}
                    maxLength={120}
                    placeholder="Your name"
                    className="min-w-0 flex-1"
                  />
                  <Button onClick={handleSaveName} disabled={!dirty || saving} loading={saving} size="sm" className="w-full sm:w-auto">
                    Save
                  </Button>
                </div>
              </Field>
            </div>
          </div>
        </CardPanel>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Mail className="h-4 w-4" /> Email</CardTitle>
          <CardDescription>The address you sign in with. Changing it requires re-verification (coming soon).</CardDescription>
        </CardHeader>
        <CardPanel>
          <div className="flex flex-wrap items-center gap-3">
            <Mail className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate font-mono text-sm" title={user.email ?? undefined}>
              {user.email ?? "no email"}
            </span>
            {user.emailVerified ? (
              <Chip size="sm" variant="soft" color="success" className="gap-1 text-[10px] uppercase tracking-wider">
                <ShieldCheck className="h-3 w-3" /> verified
              </Chip>
            ) : (
              <Chip size="sm" variant="soft" color="warning" className="text-[10px] uppercase tracking-wider">
                unverified
              </Chip>
            )}
            {user.email && (
              <Button type="button" onClick={copyEmail} variant="ghost" size="xs" className="shrink-0">
                <Copy className="h-3 w-3" />
                Copy
              </Button>
            )}
          </div>
        </CardPanel>
      </Card>

      <Card data-testid="account-password-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><KeyRound className="h-4 w-4" /> Password</CardTitle>
          <CardDescription>Change the password used for email sign-in. Workspace bridge keys are not affected.</CardDescription>
        </CardHeader>
        <form onSubmit={handleChangePassword} noValidate aria-busy={changingPassword} aria-describedby={passwordStatusId}>
          <CardPanel>
            <div className="space-y-4">
              <div className="grid gap-4 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
                <Field>
                  <FieldLabel htmlFor="account-current-password">Current password</FieldLabel>
                  <Input
                    ref={currentPasswordRef}
                    id="account-current-password"
                    name="current-password"
                    aria-label="Current password"
                    aria-describedby={passwordStatusId}
                    aria-invalid={passwordErrorField === "current"}
                    type="password"
                    autoComplete="current-password"
                    required
                    disabled={changingPassword}
                    value={currentPassword}
                    onChange={(e) => {
                      setCurrentPassword((e.target as HTMLInputElement).value);
                      setPasswordError(null);
                      setPasswordErrorField(null);
                      setPasswordSuccess(null);
                    }}
                  />
                </Field>
                <div className="grid min-w-0 gap-4 lg:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="account-new-password">New password</FieldLabel>
                    <Input
                      ref={newPasswordRef}
                      id="account-new-password"
                      name="new-password"
                      aria-label="New password"
                      aria-describedby={[passwordRequirementsId, passwordStatusId].filter(Boolean).join(" ")}
                      aria-invalid={passwordErrorField === "new"}
                      type="password"
                      autoComplete="new-password"
                      required
                      minLength={PASSWORD_MIN_LENGTH}
                      maxLength={PASSWORD_MAX_LENGTH}
                      disabled={changingPassword}
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword((e.target as HTMLInputElement).value);
                        setPasswordError(null);
                        setPasswordErrorField(null);
                        setPasswordSuccess(null);
                      }}
                    />
                    <FieldDescription id={passwordRequirementsId}>
                      Use at least {PASSWORD_MIN_LENGTH} characters.
                    </FieldDescription>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="account-confirm-password">Confirm new password</FieldLabel>
                    <Input
                      ref={confirmPasswordRef}
                      id="account-confirm-password"
                      name="confirm-new-password"
                      aria-label="Confirm new password"
                      aria-describedby={passwordStatusId}
                      aria-invalid={passwordErrorField === "confirm"}
                      type="password"
                      autoComplete="new-password"
                      required
                      minLength={PASSWORD_MIN_LENGTH}
                      maxLength={PASSWORD_MAX_LENGTH}
                      disabled={changingPassword}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword((e.target as HTMLInputElement).value);
                        setPasswordError(null);
                        setPasswordErrorField(null);
                        setPasswordSuccess(null);
                      }}
                    />
                  </Field>
                </div>
              </div>

              <Checkbox
                aria-label="Sign out other sessions"
                checked={revokeOtherSessions}
                isDisabled={changingPassword}
                onCheckedChange={setRevokeOtherSessions}
              >
                <span className="min-w-0">
                  <span className="block font-medium">Sign out other sessions</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    Recommended when you changed password because a device or browser may no longer be trusted. This browser stays signed in.
                  </span>
                </span>
              </Checkbox>

              <p className="text-xs text-muted-foreground">
                Forgot your current password?{" "}
                <Link href={passwordResetHref} className="font-medium text-foreground underline-offset-4 hover:underline">
                  Send a reset email
                </Link>
                .
              </p>

              {passwordError && (
                <Alert variant="error">
                  <AlertDescription id="account-password-status">
                    {passwordError}
                    {passwordNeedsReauth && (
                      <>
                        {" "}
                        <Link href={passwordReauthHref} className="font-medium underline underline-offset-4">
                          Sign in again
                        </Link>
                      </>
                    )}
                  </AlertDescription>
                </Alert>
              )}
              {passwordSuccess && (
                <Alert variant="success" role="status" aria-live="polite">
                  <AlertDescription id="account-password-status">{passwordSuccess}</AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end">
                <Button
                  type="submit"
                  loading={changingPassword}
                  disabled={!passwordDirty || changingPassword}
                  className="w-full sm:w-auto"
                >
                  Update password
                </Button>
              </div>
            </div>
          </CardPanel>
        </form>
      </Card>

      <DefaultWorkspaceCard />

      <Card>
        <CardHeader>
          <CardTitle>Session</CardTitle>
          <CardDescription>Sign out of this browser. Other sessions stay active.</CardDescription>
        </CardHeader>
        <CardPanel>
          <Button
            variant="outline"
            onClick={handleSignOut}
            loading={signingOut}
            disabled={signingOut}
          >
            <LogOut className="me-1.5 h-4 w-4" /> Sign out
          </Button>
        </CardPanel>
      </Card>
    </SettingsSection>
  );
}

// Default workspace = where the user lands after signing in (root `/`
// redirects here, the setup wizard targets it). Editing here mirrors
// the star button in the sidebar workspace switcher — both write to
// PATCH /api/v1/me/default-server. We keep this surface for users who
// look in Settings → Account when configuring their account.
function DefaultWorkspaceCard() {
  const [servers, setServers] = useState<Awaited<ReturnType<typeof api.me>>["servers"]>([]);
  const [defaultServerId, setDefaultServerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await api.me();
        if (cancelled) return;
        setServers(me.servers);
        setDefaultServerId(me.defaultServerId);
      } catch (e) {
        notifyThrown("Couldn't load workspaces", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  async function handleChange(nextId: string) {
    if (nextId === defaultServerId) return;
    setPending(nextId);
    try {
      await api.setDefaultServer(nextId);
      setDefaultServerId(nextId);
      notifySuccess("Default workspace updated");
    } catch (e) {
      notifyThrown("Couldn't update default workspace", e);
    } finally {
      setPending(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Home className="h-4 w-4" /> Default workspace</CardTitle>
        <CardDescription>
          The workspace you land on after signing in, and the one the setup
          wizard targets.
        </CardDescription>
      </CardHeader>
      <CardPanel>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : servers.length === 0 ? (
          <p className="text-sm text-muted-foreground">No workspaces yet.</p>
        ) : (
          <RadioGroup
            aria-label="Default workspace"
            value={defaultServerId ?? ""}
            onValueChange={handleChange}
            className="space-y-1"
          >
            {servers.map((s) => {
              const isPending = pending === s.id;
              return (
                <Radio
                  key={s.id}
                  value={s.id}
                  isDisabled={isPending}
                  className="text-sm"
                >
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{s.name}</div>
                      <div className="truncate text-[11px] text-muted-foreground">
                        /{s.slug} · {s.role}
                      </div>
                    </div>
                    {isPending && <span className="text-[11px] text-muted-foreground">Saving…</span>}
                </Radio>
              );
            })}
          </RadioGroup>
        )}
      </CardPanel>
    </Card>
  );
}
