import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import RsvpGate from "@/components/RsvpGate";
import { GUEST_ID_COOKIE } from "@/lib/guestCookies";

export default async function Home() {
  const cookieStore = await cookies();
  if (cookieStore.get(GUEST_ID_COOKIE)?.value) {
    redirect("/story");
  }

  return (
    <div className="flex flex-1 flex-col">
      <Suspense
        fallback={
          <div className="flex flex-1 items-center justify-center">
            <p className="text-moss">Loading…</p>
          </div>
        }
      >
        <RsvpGate />
      </Suspense>
    </div>
  );
}
