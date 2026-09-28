import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { ddbDocClient } from "@/lib/dynamodb";
import {
  GUEST_COOKIE_OPTIONS,
  GUEST_ID_COOKIE,
  IS_ADMIN_COOKIE,
} from "@/lib/guestCookies";

const GUESTS_TABLE_NAME = process.env.GUESTS_TABLE_NAME || "Guests";

interface GuestRecord {
  guest_id: string;
  is_admin?: boolean;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ guestId: string }> }
) {
  const cookieStore = await cookies();

  if (cookieStore.get(GUEST_ID_COOKIE)?.value) {
    return NextResponse.redirect(new URL("/story", request.url));
  }

  const { guestId } = await params;

  const result = await ddbDocClient.send(
    new GetCommand({ TableName: GUESTS_TABLE_NAME, Key: { guest_id: guestId } })
  );
  const guest = result.Item as GuestRecord | undefined;

  if (!guest) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  cookieStore.set(GUEST_ID_COOKIE, guest.guest_id, GUEST_COOKIE_OPTIONS);
  cookieStore.set(
    IS_ADMIN_COOKIE,
    guest.is_admin === true ? "true" : "false",
    GUEST_COOKIE_OPTIONS
  );

  return NextResponse.redirect(new URL("/story", request.url));
}
