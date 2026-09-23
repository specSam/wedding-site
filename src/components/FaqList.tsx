"use client";

import { useCallback, useEffect, useState } from "react";
import { useAdminMode } from "@/context/AdminModeContext";
import OrnateCard from "@/components/ui/OrnateCard";

interface FaqItem {
  faq_id: string;
  question: string;
  answer: string;
  sort_order: number;
}

// These two entries get special rendering below the plain answer text; the
// question/answer themselves stay plain editable text like any other entry.
const VENUE_LOCATION_ID = "venue-location";
const DAY_SCHEDULE_ID = "day-schedule";

function tryParseJson<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function VenueAnswer({ address }: { address: string }) {
  const encoded = encodeURIComponent(address);
  return (
    <div className="mt-3 space-y-3">
      <div className="overflow-hidden rounded-lg border border-moss/40">
        <iframe
          title="Venue location"
          src={`https://www.google.com/maps?q=${encoded}&output=embed`}
          className="h-64 w-full border-0"
          loading="lazy"
        />
      </div>
      <a
        href={`https://www.google.com/maps/dir/?api=1&destination=${encoded}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block text-sm font-semibold text-forest underline underline-offset-2 hover:text-pine"
      >
        Get Directions
      </a>
    </div>
  );
}

function ScheduleAnswer({
  items,
}: {
  items: { time: string; label: string }[];
}) {
  return (
    <ol className="mt-3 space-y-4 border-l-2 border-gold pl-4">
      {items.map((entry, index) => (
        <li key={index} className="relative">
          <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-forest" />
          <p className="text-sm font-semibold text-pine">{entry.time}</p>
          <p className="text-sm text-moss">{entry.label}</p>
        </li>
      ))}
    </ol>
  );
}

function renderAnswer(item: FaqItem) {
  if (item.faq_id === VENUE_LOCATION_ID) {
    const parsed = tryParseJson<{ address?: string }>(item.answer);
    if (parsed?.address) {
      return <VenueAnswer address={parsed.address} />;
    }
  }

  if (item.faq_id === DAY_SCHEDULE_ID) {
    const parsed = tryParseJson<{ items?: { time: string; label: string }[] }>(
      item.answer
    );
    if (parsed?.items?.length) {
      return <ScheduleAnswer items={parsed.items} />;
    }
  }

  return <p className="whitespace-pre-wrap text-moss">{item.answer}</p>;
}

export default function FaqList() {
  const { editing } = useAdminMode();

  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftQuestion, setDraftQuestion] = useState("");
  const [draftAnswer, setDraftAnswer] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [removingId, setRemovingId] = useState<string | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);

  const [isAdding, setIsAdding] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const refetchFaqs = useCallback(async () => {
    try {
      const res = await fetch("/api/faq");
      if (!res.ok) throw new Error("Failed to load");
      const data = (await res.json()) as { items: FaqItem[] };
      setFaqs(data.items);
    } catch {
      setLoadError("Couldn't load the FAQ right now.");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/faq")
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load");
        return (await res.json()) as { items: FaqItem[] };
      })
      .then((data) => {
        if (!cancelled) setFaqs(data.items);
      })
      .catch(() => {
        if (!cancelled) setLoadError("Couldn't load the FAQ right now.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function startEditing(item: FaqItem) {
    setEditingId(item.faq_id);
    setDraftQuestion(item.question);
    setDraftAnswer(item.answer);
    setSaveError(null);
  }

  function cancelEditing() {
    setEditingId(null);
    setSaveError(null);
  }

  async function saveEditing(id: string) {
    setSaving(true);
    setSaveError(null);

    try {
      const res = await fetch(`/api/faq/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: draftQuestion, answer: draftAnswer }),
      });

      if (res.status === 403) {
        setSaveError("You don't have permission to edit this.");
        return;
      }
      if (!res.ok) {
        setSaveError("Something went wrong saving. Please try again.");
        return;
      }

      setEditingId(null);
      await refetchFaqs();
    } finally {
      setSaving(false);
    }
  }

  async function removeFaq(id: string) {
    setRemovingId(id);
    setRemoveError(null);

    try {
      const res = await fetch(`/api/faq/${id}`, { method: "DELETE" });

      if (res.status === 403) {
        setRemoveError("You don't have permission to remove this.");
        return;
      }
      if (!res.ok) {
        setRemoveError("Something went wrong removing this. Please try again.");
        return;
      }

      await refetchFaqs();
    } finally {
      setRemovingId(null);
    }
  }

  function startAdding() {
    setNewQuestion("");
    setNewAnswer("");
    setAddError(null);
    setIsAdding(true);
  }

  function cancelAdding() {
    setIsAdding(false);
    setAddError(null);
  }

  async function saveNew() {
    setAddSaving(true);
    setAddError(null);

    try {
      const res = await fetch("/api/faq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: newQuestion, answer: newAnswer }),
      });

      if (res.status === 403) {
        setAddError("You don't have permission to add questions.");
        return;
      }
      if (!res.ok) {
        setAddError("Something went wrong saving. Please try again.");
        return;
      }

      setIsAdding(false);
      await refetchFaqs();
    } finally {
      setAddSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center px-4 py-12">
        <p className="text-moss">Loading…</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex justify-center px-4 py-12">
        <p className="text-blood">{loadError}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-semibold text-pine">FAQ</h1>

      <div className="mt-8 space-y-4">
        {faqs.map((item) => (
          <OrnateCard key={item.faq_id} className="relative">
            {editing && editingId !== item.faq_id && (
              <div className="absolute -top-3 right-4 z-10 flex gap-2">
                <button
                  type="button"
                  onClick={() => startEditing(item)}
                  className="rounded bg-forest px-3 py-1 text-sm font-medium text-white"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => removeFaq(item.faq_id)}
                  disabled={removingId === item.faq_id}
                  className="rounded bg-blood px-3 py-1 text-sm font-medium text-white disabled:opacity-50"
                >
                  {removingId === item.faq_id ? "Removing…" : "Remove"}
                </button>
              </div>
            )}

            {editingId === item.faq_id ? (
              <div className="space-y-3">
                <input
                  value={draftQuestion}
                  onChange={(event) => setDraftQuestion(event.target.value)}
                  className="w-full rounded border border-moss/40 bg-white/70 p-2 font-semibold text-pine focus:border-forest focus:outline-none"
                  placeholder="Question"
                />
                <textarea
                  value={draftAnswer}
                  onChange={(event) => setDraftAnswer(event.target.value)}
                  rows={4}
                  className="w-full rounded border border-moss/40 bg-white/70 p-2 text-pine focus:border-forest focus:outline-none"
                  placeholder="Answer"
                />
                {saveError && (
                  <p role="alert" className="text-sm text-blood">
                    {saveError}
                  </p>
                )}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => saveEditing(item.faq_id)}
                    disabled={saving}
                    className="rounded bg-forest px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                  >
                    {saving ? "Saving…" : "Save"}
                  </button>
                  <button
                    type="button"
                    onClick={cancelEditing}
                    disabled={saving}
                    className="rounded border border-moss/40 px-4 py-2 text-sm font-medium text-pine disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h2 className="font-semibold text-pine">{item.question}</h2>
                {renderAnswer(item)}
              </>
            )}
          </OrnateCard>
        ))}
      </div>

      {removeError && (
        <p role="alert" className="mt-4 text-sm text-blood">
          {removeError}
        </p>
      )}

      {editing && (
        <div className="mt-6">
          {isAdding ? (
            <OrnateCard accent="gold" contentClassName="space-y-3 p-6 sm:p-8">
              <input
                value={newQuestion}
                onChange={(event) => setNewQuestion(event.target.value)}
                className="w-full rounded border border-moss/40 bg-white/70 p-2 font-semibold text-pine focus:border-forest focus:outline-none"
                placeholder="Question"
              />
              <textarea
                value={newAnswer}
                onChange={(event) => setNewAnswer(event.target.value)}
                rows={4}
                className="w-full rounded border border-moss/40 bg-white/70 p-2 text-pine focus:border-forest focus:outline-none"
                placeholder="Answer"
              />
              {addError && (
                <p role="alert" className="text-sm text-blood">
                  {addError}
                </p>
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={saveNew}
                  disabled={addSaving}
                  className="rounded bg-forest px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  {addSaving ? "Saving…" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={cancelAdding}
                  disabled={addSaving}
                  className="rounded border border-moss/40 px-4 py-2 text-sm font-medium text-pine disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </OrnateCard>
          ) : (
            <button
              type="button"
              onClick={startAdding}
              className="rounded border border-moss/40 px-4 py-2 text-sm font-medium text-pine hover:border-forest hover:text-forest"
            >
              Add question
            </button>
          )}
        </div>
      )}
    </div>
  );
}
