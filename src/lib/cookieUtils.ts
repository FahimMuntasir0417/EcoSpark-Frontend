type CookieOptions = {
  path?: string;
  domain?: string;
  expires?: Date;
  maxAge?: number;
  secure?: boolean;
  sameSite?: "Strict" | "Lax" | "None";
};

export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;

  const key = encodeURIComponent(name) + "=";
  const parts = document.cookie.split(";");

  for (const part of parts) {
    const cookie = part.trim();
    if (cookie.startsWith(key)) {
      return decodeURIComponent(cookie.slice(key.length));
    }
  }

  return null;
}

export function setCookie(name: string, value: string, options: CookieOptions = {}): void {
  if (typeof document === "undefined") return;

  const segments = [
    `${encodeURIComponent(name)}=${encodeURIComponent(value)}`,
    `Path=${options.path ?? "/"}`,
  ];

  if (options.domain) segments.push(`Domain=${options.domain}`);
  if (options.expires) segments.push(`Expires=${options.expires.toUTCString()}`);
  if (typeof options.maxAge === "number") segments.push(`Max-Age=${options.maxAge}`);
  if (options.secure) segments.push("Secure");
  if (options.sameSite) segments.push(`SameSite=${options.sameSite}`);

  document.cookie = segments.join("; ");
}

export function deleteCookie(name: string, path = "/"): void {
  if (typeof document === "undefined") return;

  document.cookie = `${encodeURIComponent(name)}=; Path=${path}; Max-Age=0`;
}
