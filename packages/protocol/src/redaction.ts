const SECRET_PATTERNS: Array<[RegExp, string]> = [
  [/\bBearer\s+[A-Za-z0-9._~+/-]+=*/gi, "Bearer [redacted]"],
  [/\bck_[A-Za-z0-9]{32,}\b/g, "[redacted token]"],
  [/\bsy_(?:api|bridge)_[A-Za-z0-9._-]{8,}\b/g, "[redacted token]"],
  [/\b(?:sk|sk-ant|ghp|gho|ghu|ghs|ghr|github_pat|glpat|xox[baprs]?|hf|SG)-[A-Za-z0-9_./-]{8,}\b/g, "[redacted token]"],
  [/\bAKIA[0-9A-Z]{16}\b/g, "[redacted token]"],
  [/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, "[redacted token]"],
  [/([?&](?:access_token|api_key|auth|key|password|secret|token)=)[^&\s]+/gi, "$1[redacted]"],
  [/\b((?:api[_-]?key|authorization|password|secret|token)\s*[:=]\s*)[^\s,;]+/gi, "$1[redacted]"],
  [/\b([A-Z][A-Z0-9_]*(?:API_KEY|SECRET|TOKEN|PASSWORD|AUTH)[A-Z0-9_]*=)[^\s]+/g, "$1[redacted]"],
  [/https?:\/\/([^/\s:@]+):([^@\s/]+)@/gi, "https://[redacted]@"],
  [/\/Users\/[^\s)]+/g, "[local path]"],
  [/\/home\/[^\s)]+/g, "[local path]"],
  [/[A-Za-z]:\\Users\\[^\s)]+/g, "[local path]"],
];

export function sanitizeUserVisibleError(
  value: string | null | undefined,
  maxLength = 2000,
): string | null {
  if (value == null) return null;
  let out = value.replace(/\s+/g, " ").trim();
  for (const [pattern, replacement] of SECRET_PATTERNS) {
    out = out.replace(pattern, replacement);
  }
  return out.length > maxLength ? `${out.slice(0, Math.max(0, maxLength - 3))}...` : out;
}
