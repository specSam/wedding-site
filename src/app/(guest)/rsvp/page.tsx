import { cookies } from "next/headers";
import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { ddbDocClient } from "@/lib/dynamodb";
import { GUEST_ID_COOKIE } from "@/lib/guestCookies";
import RsvpStatusView, { type OwnGuest } from "@/components/RsvpStatusView";

const GUESTS_TABLE_NAME = process.env.GUESTS_TABLE_NAME || "Guests";

export default async function RsvpPage() {
  const cookieStore = await cookies();
  const guestId = cookieStore.get(GUEST_ID_COOKIE)!.value;

  const result = await ddbDocClient.send(
    new GetCommand({ TableName: GUESTS_TABLE_NAME, Key: { guest_id: guestId } })
  );
  const guest = result.Item as OwnGuest | undefined;

  if (!guest) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <p className="text-moss">
          We couldn&apos;t find your invitation. Please contact the couple.
        </p>
      </div>
    );
  }

  return (
    <RsvpStatusView
      guest={{
        guest_id: guest.guest_id,
        name: guest.name,
        allowed_guests: guest.allowed_guests,
        rsvp_status: guest.rsvp_status ?? "pending",
        rsvp_guest_count: guest.rsvp_guest_count ?? 0,
      }}
    />
  );
}
