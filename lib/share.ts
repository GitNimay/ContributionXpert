import type { SharePayload } from "@/lib/types";

function toBase64Url(base64: string) {
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  return padded.padEnd(Math.ceil(padded.length / 4) * 4, "=");
}

export function encodeSharePayload(payload: SharePayload) {
  const json = JSON.stringify(payload);

  if (typeof window === "undefined") {
    return Buffer.from(json, "utf8").toString("base64url");
  }

  const bytes = new TextEncoder().encode(json);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return toBase64Url(window.btoa(binary));
}

export function decodeSharePayload(value: string): SharePayload {
  try {
    if (typeof window === "undefined") {
      return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as SharePayload;
    }

    const binary = window.atob(fromBase64Url(value));
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes)) as SharePayload;
  } catch {
    throw new Error("This share link is invalid or expired.");
  }
}

export function shareUrlFor(payload: SharePayload) {
  const baseUrl =
    typeof window === "undefined"
      ? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
      : window.location.origin;

  return `${baseUrl}/share/${encodeSharePayload(payload)}`;
}
