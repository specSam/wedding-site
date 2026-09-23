"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import OrnateCard from "@/components/ui/OrnateCard";

interface Guest {
  guest_id: string;
  name: string;
  allowed_guests: number;
}

type RsvpChoice = "attending" | "not_attending";

async function lookupGuest(query: string): Promise<Guest | null> {
  const res = await fetch(`/api/guest/${encodeURIComponent(query)}`);
  if (!res.ok) return null;
  return (await res.json()) as Guest;
}

export default function RsvpGate() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const guestParam = searchParams.get("guest");

  const [guest, setGuest] = useState<Guest | null>(null);
  const [lookupLoading, setLookupLoading] = useState(Boolean(guestParam));
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState("");

  const [status, setStatus] = useState<RsvpChoice | "">("");
  const [guestCount, setGuestCount] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

const mockGuest: Guest = {
  guest_id: "smith-family",
  name: "Sam",
  allowed_guests: 4,
};

  useEffect(() => {
    if (!guestParam) return;
    let cancelled = false;

    lookupGuest(guestParam)
      .then((found) => {
        if (cancelled) return;
        if (!found) {
          setLookupError(
            "We couldn't find an invitation for that link. Please check the URL or enter your name below."
          );
          return;
        }
        setGuest(found);
        setGuestCount(found.allowed_guests > 0 ? 1 : 0);
      })
      .finally(() => {
        if (!cancelled) setLookupLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [guestParam]);

  async function handleNameLookup() {
    const trimmed = nameInput.trim();
    if (!trimmed) return;

    setLookupLoading(true);
    setLookupError(null);

    const found = await lookupGuest(trimmed);

    if (!found) {
      setLookupError(
        "We couldn't find your invitation. Please check the spelling of your name."
      );
    } else {
      setGuest(found);
      setGuestCount(found.allowed_guests > 0 ? 1 : 0);
    }

    setLookupLoading(false);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!guest || !status) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch(
        `/api/guest/${encodeURIComponent(guest.guest_id)}/rsvp`,
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

      router.push("/story");
    } catch {
      setSubmitError("Something went wrong submitting your RSVP. Please try again.");
      setSubmitting(false);
    }
  }

  if (guestParam && lookupLoading && !guest) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-moss">Loading your invitation…</p>
      </div>
    );
  }

  if (!guest) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <OrnateCard className="w-full max-w-sm" accent="gold">
          <div className="space-y-4">
            <h1 className="text-2xl font-semibold text-pine">RSVP</h1>
            <p className="text-moss">
              Enter your name to find your invitation.
            </p>
            <input
              type="text"
              value={nameInput}
              onChange={(event) => setNameInput(event.target.value)}
              onBlur={handleNameLookup}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleNameLookup();
                }
              }}
              placeholder="Your full name"
              className="w-full rounded border border-moss/40 bg-white/70 px-3 py-2 text-pine placeholder:text-moss/50 focus:border-forest focus:outline-none"
            />
            {lookupLoading && (
              <p className="text-sm text-moss/70">Searching…</p>
            )}
            {lookupError && (
              <p role="alert" className="text-sm text-blood">
                {lookupError}
              </p>
            )}
          </div>
        </OrnateCard>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <OrnateCard className="w-full max-w-sm" accent="gold">
        <form onSubmit={handleSubmit} className="space-y-4">
          <h1 className="text-2xl font-semibold text-pine">RSVP</h1>
          <div>
            <p className="text-moss">
              Name: <span className="font-medium text-pine">{guest.name}</span>
            </p>
            <p className="text-moss">
              Max guests:{" "}
              <span className="font-medium text-pine">{guest.allowed_guests}</span>
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
              max={guest.allowed_guests}
              value={guestCount}
              disabled={status !== "attending"}
              onChange={(event) => {
                const value = Number(event.target.value);
                setGuestCount(
                  Math.max(1, Math.min(value, guest.allowed_guests))
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

          <button
            type="submit"
            disabled={!status || submitting}
            className="w-full rounded bg-forest px-4 py-2 font-medium text-white transition-colors hover:bg-pine disabled:opacity-50"
          >
            {submitting ? "Submitting…" : "Submit RSVP"}
          </button>
        </form>
      </OrnateCard>
    </div>
  );
}
