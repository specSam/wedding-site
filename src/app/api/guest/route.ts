import { NextResponse } from "next/server";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { ddbDocClient } from "@/lib/dynamodb";
import { requireAdmin } from "@/lib/adminAuth";

const TABLE_NAME = process.env.GUESTS_TABLE_NAME || "Guests";

interface GuestRecord {
  guest_id: string;
  name: string;
  allowed_guests: number;
  rsvp_status?: "pending" | "attending" | "not_attending";
  rsvp_guest_count?: number;
}

export async function GET() {
  const authError = await requireAdmin();
  if (authError) return authError;

  const result = await ddbDocClient.send(new ScanCommand({ TableName: TABLE_NAME }));
  const items = (result.Items ?? []) as GuestRecord[];

  return NextResponse.json({
    items: items.map((guest) => ({
      guest_id: guest.guest_id,
      name: guest.name,
      allowed_guests: guest.allowed_guests,
      rsvp_status: guest.rsvp_status ?? "pending",
      rsvp_guest_count: guest.rsvp_guest_count ?? 0,
    })),
  });
}
