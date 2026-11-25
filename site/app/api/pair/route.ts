import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pairingRequests } from "@/lib/db/schema";
import { createPairingToken } from "@/lib/pairing-token";

export async function POST(request: Request) {
  try {
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");
    if (origin && host && new URL(origin).host !== host) {
      return NextResponse.json({ error: "Request could not be verified." }, { status: 403 });
    }

    const body: unknown = await request.json();
    const rawPhone = typeof body === "object" && body !== null && "phone" in body
      ? (body as { phone: unknown }).phone
      : null;
    if (typeof rawPhone !== "string" || rawPhone.length > 32 || !/^[+\d\s().-]+$/.test(rawPhone)) {
      return NextResponse.json({ error: "Enter a valid phone number with its country code." }, { status: 400 });
    }

    const phone = rawPhone.replace(/\D/g, "");
    if (phone.length < 7 || phone.length > 15) {
      return NextResponse.json({ error: "Enter a valid phone number with its country code." }, { status: 400 });
    }

    const [created] = await db.insert(pairingRequests).values({ phone }).returning({ id: pairingRequests.id });
    return NextResponse.json(
      { id: created.id, token: createPairingToken(created.id) },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "Pairing is temporarily unavailable. Please try again shortly." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
