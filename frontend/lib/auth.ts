import type { AuthInfo } from "@/types";

export function getAuthInfo(): AuthInfo | null {
  if (typeof document === "undefined") return null;
  const cookies = document.cookie.split(";");
  const authInfoCookie = cookies.find((c) => c.trim().startsWith("auth-info="));
  if (!authInfoCookie) return null;
  try {
    const value = authInfoCookie.split("=").slice(1).join("=").trim();
    const decoded = atob(value);
    return JSON.parse(decoded) as AuthInfo;
  } catch {
    return null;
  }
}

export function isAdmin(): boolean {
  return getAuthInfo()?.role === "admin";
}
