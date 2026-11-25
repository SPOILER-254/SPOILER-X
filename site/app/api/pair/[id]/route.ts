import { and, eq, gt } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pairingRequests } from "@/lib/db/schema";
import { isValidPairingToken } from "@/lib/pairing-token";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params;
  if (!/^\d{1,10}$/.test(rawId)) {
    return NextResponse.json({ error: "Pairing request not found." }, { status: 404 });
  }

  const id = Number(rawId);
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? null;
  if (!Number.isSafeInteger(id) || !isValidPairingToken(id, token)) {
    return NextResponse.json({ error: "Pairing request not found." }, { status: 404 });
  }

  try {
    const [pairing] = await db
      .select({
        status: pairingRequests.status,
        code: pairingRequests.pairingCode,
        expiresAt: pairingRequests.expiresAt,
      })
      .from(pairingRequests)
      .where(and(eq(pairingRequests.id, id), gt(pairingRequests.expiresAt, new Date())))
      .limit(1);

    if (!pairing) {
      return NextResponse.json({ status: "expired" }, { headers: { "Cache-Control": "no-store" } });
    }

    const status = ["pending", "processing", "code_generated", "connected", "failed"].includes(pairing.status)
      ? pairing.status
      : "pending";
    const result: { status: string; code?: string } = { status };
    if (status === "code_generated" && pairing.code) result.code = pairing.code;

    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Status is temporarily unavailable." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
