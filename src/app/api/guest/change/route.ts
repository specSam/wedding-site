import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { GUEST_ID_COOKIE, IS_ADMIN_COOKIE } from "@/lib/guestCookies";

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  cookieStore.delete(GUEST_ID_COOKIE);
  cookieStore.delete(IS_ADMIN_COOKIE);

  return NextResponse.redirect(new URL("/", request.url));
}
