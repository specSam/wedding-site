"use client";

import { useEffect, useState } from "react";
import OrnateCard from "@/components/ui/OrnateCard";
import type { RsvpStatus } from "@/components/RsvpStatusView";

interface AllGuestRecord {
  guest_id: string;
  name: string;
  allowed_guests: number;
  rsvp_status: RsvpStatus;
  rsvp_guest_count: number;
}

function statusLabel(status: RsvpStatus) {
  switch (status) {
    case "attending":
      return "Attending";
    case "not_attending":
      return "Not attending";
    default:
      return "Pending";
  }
}

function statusClass(status: RsvpStatus) {
  switch (status) {
    case "attending":
      return "bg-forest text-white";
    case "not_attending":
      return "bg-blood text-white";
    default:
      return "bg-moss/20 text-moss";
  }
}

export default function AdminRsvpOverlay() {
  const [guests, setGuests] = useState<AllGuestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;

    fetch("/api/guest")
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load");
        return (await res.json()) as { items: AllGuestRecord[] };
      })
      .then((data) => {
        if (!cancelled) setGuests(data.items);
      })
      .catch(() => {
        if (!cancelled) setLoadError("Couldn't load guest RSVPs right now.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const query = search.trim().toLowerCase();
  const visibleGuests = query
    ? guests.filter((g) => g.name?.toLowerCase().includes(query))
    : guests;

  return (
    <OrnateCard tone="pine" accent="gold" contentClassName="p-6 sm:p-8">
      <h2 className="text-lg font-semibold text-gold">All RSVPs</h2>

      <input
        type="text"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search guests by name…"
        className="mt-4 w-full rounded border border-gold/40 bg-cream/10 px-3 py-2 text-cream placeholder:text-cream/50 focus:border-gold focus:outline-none"
      />

      {loading && <p className="mt-4 text-cream/70">Loading…</p>}
      {loadError && (
        <p role="alert" className="mt-4 text-sm text-gold">
          {loadError}
        </p>
      )}

      {!loading && !loadError && (
        <ul className="mt-4 divide-y divide-gold/20">
          {visibleGuests.map((g) => (
            <li
              key={g.guest_id}
              className="flex items-center justify-between gap-4 py-3"
            >
              <div>
                <p className="font-medium text-cream">{g.name}</p>
                <p className="text-sm text-cream/60">
                  {g.rsvp_status === "attending"
                    ? `${g.rsvp_guest_count} / ${g.allowed_guests} attending`
                    : `Allowed: ${g.allowed_guests}`}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${statusClass(
                  g.rsvp_status
                )}`}
              >
                {statusLabel(g.rsvp_status)}
              </span>
            </li>
          ))}

          {visibleGuests.length === 0 && (
            <li className="py-3 text-cream/60">No guests match that search.</li>
          )}
        </ul>
      )}
    </OrnateCard>
  );
}
