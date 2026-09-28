"use client";

import { useState } from "react";
import Link from "next/link";
import { useAdminMode } from "@/context/AdminModeContext";
import OrnateCard from "@/components/ui/OrnateCard";
import AdminRsvpOverlay from "@/components/AdminRsvpOverlay";

export type RsvpStatus = "pending" | "attending" | "not_attending";

export interface OwnGuest {
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

export default function RsvpStatusView({ guest }: { guest: OwnGuest }) {
  const { editing } = useAdminMode();

  const [current, setCurrent] = useState(guest);
  const [isEditing, setIsEditing] = useState(false);
  const [status, setStatus] = useState<"attending" | "not_attending" | "">(
    current.rsvp_status === "pending" ? "" : current.rsvp_status
  );
  const [guestCount, setGuestCount] = useState(
    current.rsvp_guest_count || 1
  );
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function startEditing() {
    setStatus(current.rsvp_status === "pending" ? "" : current.rsvp_status);
    setGuestCount(current.rsvp_guest_count || 1);
    setSubmitError(null);
    setIsEditing(true);
  }

  async function handleSubmit() {
    if (!status) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch(
        `/api/guest/${encodeURIComponent(current.guest_id)}/rsvp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status,
            rsvp_guest_count: status === "attending" ? guestCount : 0,
          }),
        }
      );

      if (!res.ok) throw new Error("RSVP submission failed");

      setCurrent((prev) => ({
        ...prev,
        rsvp_status: status,
        rsvp_guest_count: status === "attending" ? guestCount : 0,
      }));
      setIsEditing(false);
    } catch {
      setSubmitError("Something went wrong submitting your RSVP. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl px-6 py-12">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-pine">Your RSVP</h1>
        <Link
          href="/api/guest/change"
          className="rounded border border-moss/40 px-3 py-1.5 text-sm font-medium text-moss hover:border-forest hover:text-forest"
        >
          Change guest
        </Link>
      </div>

      <OrnateCard className="mt-6" accent="gold">
        {isEditing ? (
          <div className="space-y-4">
            <div>
              <p className="text-moss">
                Name: <span className="font-medium text-pine">{current.name}</span>
              </p>
              <p className="text-moss">
                Max guests:{" "}
                <span className="font-medium text-pine">
                  {current.allowed_guests}
                </span>
              </p>
            </div>

            <fieldset className="space-y-2">
              <legend className="font-medium text-pine">
                Will you be attending?
              </legend>
              <label className="flex items-center gap-2 text-moss">
                <input
                  type="radio"
                  name="status"
                  value="attending"
                  checked={status === "attending"}
                  onChange={() => setStatus("attending")}
                  className="accent-forest"
                />
                Attending
              </label>
              <label className="flex items-center gap-2 text-moss">
                <input
                  type="radio"
                  name="status"
                  value="not_attending"
                  checked={status === "not_attending"}
                  onChange={() => setStatus("not_attending")}
                  className="accent-forest"
                />
                Not Attending
              </label>
            </fieldset>

            <label className="block text-moss">
              Number attending
              <input
                type="number"
                min={1}
                max={current.allowed_guests}
                value={guestCount}
                disabled={status !== "attending"}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  const max = Number(current.allowed_guests) || 1;
                  setGuestCount(
                    Math.max(1, Math.min(Number.isNaN(value) ? 1 : value, max))
                  );
                }}
                className="mt-1 w-full rounded border border-moss/40 bg-white/70 px-3 py-2 text-pine disabled:bg-moss/10 disabled:text-moss/40 focus:border-forest focus:outline-none"
              />
            </label>

            {submitError && (
              <p role="alert" className="text-sm text-blood">
                {submitError}
              </p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!status || submitting}
                className="rounded bg-forest px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {submitting ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                disabled={submitting}
                className="rounded border border-moss/40 px-4 py-2 text-sm font-medium text-pine disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-moss">
              Name: <span className="font-medium text-pine">{current.name}</span>
            </p>
            <p className="text-moss">
              Status:{" "}
              <span className="font-medium text-pine">
                {statusLabel(current.rsvp_status)}
              </span>
            </p>
            {current.rsvp_status === "attending" && (
              <p className="text-moss">
                Guests attending:{" "}
                <span className="font-medium text-pine">
                  {current.rsvp_guest_count}
                </span>
              </p>
            )}
            <button
              type="button"
              onClick={startEditing}
              className="rounded bg-forest px-4 py-2 text-sm font-medium text-white"
            >
              Edit RSVP
            </button>
          </div>
        )}
      </OrnateCard>

      {editing && (
        <div className="mt-10">
          <AdminRsvpOverlay />
        </div>
      )}
    </div>
  );
}
