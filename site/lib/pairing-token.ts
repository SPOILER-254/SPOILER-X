import { createHmac, timingSafeEqual } from "node:crypto";

function signingKey() {
  const key = process.env.PAIRING_TOKEN_SECRET || process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;
  if (!key) throw new Error("Pairing token signing key is unavailable.");
  return key;
}

export function createPairingToken(id: number) {
  return createHmac("sha256", signingKey()).update(String(id)).digest("hex");
}

export function isValidPairingToken(id: number, token: string | null) {
  if (!token || !/^[a-f0-9]{64}$/i.test(token)) return false;
  const expected = Buffer.from(createPairingToken(id), "hex");
  const supplied = Buffer.from(token, "hex");
  return expected.length === supplied.length && timingSafeEqual(expected, supplied);
}
