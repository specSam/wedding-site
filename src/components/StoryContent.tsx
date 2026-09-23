"use client";

import { useEffect, useState } from "react";
import { useAdminMode } from "@/context/AdminModeContext";
import OrnateCard from "@/components/ui/OrnateCard";

export default function StoryContent() {
  const { editing } = useAdminMode();

  const [body, setBody] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [isEditingBox, setIsEditingBox] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/content/story")
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load");
        return (await res.json()) as { body: string };
      })
      .then((data) => {
        if (!cancelled) setBody(data.body);
      })
      .catch(() => {
        if (!cancelled) setLoadError("Couldn't load the story right now.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function startEditing() {
    setDraft(body ?? "");
    setSaveError(null);
    setIsEditingBox(true);
  }

  function cancelEditing() {
    setIsEditingBox(false);
    setSaveError(null);
  }

  async function saveEditing() {
    setSaving(true);
    setSaveError(null);

    try {
      const res = await fetch("/api/content/story", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: draft }),
      });

      if (res.status === 403) {
        setSaveError("You don't have permission to edit this.");
        return;
      }
      if (!res.ok) {
        setSaveError("Something went wrong saving. Please try again.");
        return;
      }

      const data = (await res.json()) as { body: string };
      setBody(data.body);
      setIsEditingBox(false);
    } finally {
      setSaving(false);
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
    <div className="flex justify-center px-4 py-12">
      <div className="relative w-full max-w-2xl">
        {editing && !isEditingBox && (
          <button
            type="button"
            onClick={startEditing}
            className="absolute -top-3 right-0 z-10 rounded bg-forest px-3 py-1 text-sm font-medium text-white"
          >
            Edit
          </button>
        )}

        {isEditingBox ? (
          <OrnateCard contentClassName="space-y-3 p-8 sm:p-10">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              rows={10}
              className="w-full rounded border border-moss/40 bg-white/70 p-3 text-pine focus:border-forest focus:outline-none"
            />
            {saveError && (
              <p role="alert" className="text-sm text-blood">
                {saveError}
              </p>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={saveEditing}
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
          </OrnateCard>
        ) : (
          <OrnateCard contentClassName="p-8 sm:p-10">
            <p className="whitespace-pre-wrap font-body text-pine">{body}</p>
          </OrnateCard>
        )}
      </div>
    </div>
  );
}
