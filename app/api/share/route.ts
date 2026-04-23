import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    if (!payload) {
      return NextResponse.json({ error: "Payload is required" }, { status: 400 });
    }

    const id = crypto.randomBytes(4).toString("hex");

    await sql`
      INSERT INTO shares (id, payload)
      VALUES (${id}, ${JSON.stringify(payload)}::jsonb)
    `;

    return NextResponse.json({ id });
  } catch (error) {
    console.error("Error creating share:", error);
    return NextResponse.json({ error: "Failed to create share" }, { status: 500 });
  }
}
