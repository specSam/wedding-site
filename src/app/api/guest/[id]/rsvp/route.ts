import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ddbDocClient } from "@/lib/dynamodb";
import {
  GUEST_COOKIE_OPTIONS,
  GUEST_ID_COOKIE,
  IS_ADMIN_COOKIE,
} from "@/lib/guestCookies";

const TABLE_NAME = process.env.GUESTS_TABLE_NAME || "Guests";

interface GuestRecord {
  guest_id: string;
  allowed_guests: number;
  is_admin?: boolean;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body: { status?: string; rsvp_guest_count?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { status, rsvp_guest_count } = body;

  if (status !== "attending" && status !== "not_attending") {
    return NextResponse.json({ error: "Invalid RSVP status" }, { status: 400 });
  }

  const existing = await ddbDocClient.send(
    new GetCommand({ TableName: TABLE_NAME, Key: { guest_id: id } })
  );
  const guest = existing.Item as GuestRecord | undefined;

  if (!guest) {
    return NextResponse.json({ error: "Guest not found" }, { status: 404 });
  }

  const count =
    status === "attending"
      ? Math.max(0, Math.min(Number(rsvp_guest_count) || 0, guest.allowed_guests))
      : 0;

  await ddbDocClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { guest_id: id },
      UpdateExpression: "SET rsvp_status = :status, rsvp_guest_count = :count",
      ExpressionAttributeValues: {
        ":status": status,
        ":count": count,
      },
    })
  );

  const cookieStore = await cookies();
  cookieStore.set(GUEST_ID_COOKIE, guest.guest_id, GUEST_COOKIE_OPTIONS);
  cookieStore.set(
    IS_ADMIN_COOKIE,
    guest.is_admin === true ? "true" : "false",
    GUEST_COOKIE_OPTIONS
  );

  return NextResponse.json({ success: true });
}
