import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminModeProvider } from "@/context/AdminModeContext";
import NavBar from "@/components/NavBar";

export default async function GuestLayout({
  children,
}: {
  children: ReactNode;
}) {
  const cookieStore = await cookies();
  const guestId = cookieStore.get("guest_id")?.value;

  if (!guestId) {
    redirect("/");
  }

  // isAdmin here only controls whether admin/edit UI is shown. Every write
  // API route must independently re-verify is_admin from the Guests table
  // server-side — this cookie is never sufficient for authorization.
  const isAdmin = cookieStore.get("is_admin")?.value === "true";

  return (
    <AdminModeProvider isAdmin={isAdmin}>
      <NavBar />
      <main className="flex-1">{children}</main>
    </AdminModeProvider>
  );
}
