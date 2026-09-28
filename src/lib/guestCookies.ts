export const GUEST_ID_COOKIE = "guest_id";
export const IS_ADMIN_COOKIE = "is_admin";

export const GUEST_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};
