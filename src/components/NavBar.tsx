"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAdminMode } from "@/context/AdminModeContext";

const links = [
  { href: "/story", label: "Our Story" },
  { href: "/faq", label: "FAQ" },
  { href: "/registry", label: "Registry" },
];

export default function NavBar() {
  const pathname = usePathname();
  const { isAdmin, editing, toggleEditing } = useAdminMode();

  return (
    <nav className="flex items-center justify-between border-b border-gold/20 bg-pine px-6 py-4">
      <div className="flex gap-6 font-display tracking-wide">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={
              pathname === link.href
                ? "font-semibold text-gold"
                : "text-cream/70 hover:text-gold"
            }
          >
            {link.label}
          </Link>
        ))}
      </div>

      {isAdmin && (
        <button
          type="button"
          onClick={toggleEditing}
          className={
            editing
              ? "rounded bg-gold px-3 py-1 text-sm font-medium text-pine"
              : "rounded border border-gold/50 px-3 py-1 text-sm font-medium text-gold"
          }
        >
          Admin Mode
        </button>
      )}
    </nav>
  );
}
