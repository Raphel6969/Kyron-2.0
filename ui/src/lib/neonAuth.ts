import { createAuthClient } from "@neon/auth";

export const NEON_AUTH_URL =
  import.meta.env.VITE_NEON_AUTH_URL ||
  "https://ep-wispy-cherry-b4uertto.neonauth.c-6.us-east-2.aws.neon.tech/neondb/auth";

export const NEON_BRANCH = import.meta.env.VITE_NEON_BRANCH || "production";

export const authClient = createAuthClient(NEON_AUTH_URL);

export interface NeonAuthStatus {
  isConfigured: boolean;
  baseUrl: string;
  branch: string;
}

export function getNeonAuthStatus(): NeonAuthStatus {
  return {
    isConfigured: Boolean(NEON_AUTH_URL),
    baseUrl: NEON_AUTH_URL,
    branch: NEON_BRANCH,
  };
}
