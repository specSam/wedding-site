import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { ddbDocClient } from "@/lib/dynamodb";

const GUESTS_TABLE_NAME = process.env.GUESTS_TABLE_NAME || "Guests";

// The is_admin cookie is display-only. This re-checks the Guests table
// server-side and must be called by every write route before mutating data.
// Returns a NextResponse to send as-is when unauthorized, or null when the
// caller may proceed.
export async function requireAdmin(): Promise<NextResponse | null> {
  const cookieStore = await cookies();
  const guestId = cookieStore.get("guest_id")?.value;

  if (!guestId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const guestResult = await ddbDocClient.send(
    new GetCommand({
      TableName: GUESTS_TABLE_NAME,
      Key: { guest_id: guestId },
    })
  );

  if (guestResult.Item?.is_admin !== true) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return null;
}
