"use client";

import { useCallback, useEffect, useState } from "react";
import { useAdminMode } from "@/context/AdminModeContext";
import OrnateCard from "@/components/ui/OrnateCard";

interface RegistryItem {
  item_id: string;
  item_name: string;
  item_url: string;
  item_price: number;
  image_url: string;
  claimed_by?: string | null;
  isClaimedByViewer: boolean;
}

type Modal =
  | { type: "confirmClaim"; item: RegistryItem }
  | { type: "alreadyClaimed" }
  | null;

function formatPrice(price: number) {
  return `$${price.toFixed(2)}`;
}

export default function RegistryGrid() {
  const { editing } = useAdminMode();

  const [items, setItems] = useState<RegistryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [modal, setModal] = useState<Modal>(null);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [unclaimingId, setUnclaimingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    try {
      const res = await fetch("/api/registry");
      if (!res.ok) throw new Error("Failed to load");
      const data = (await res.json()) as { items: RegistryItem[] };
      setItems(data.items);
    } catch {
      setLoadError("Couldn't load the registry right now.");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/registry")
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load");
        return (await res.json()) as { items: RegistryItem[] };
      })
      .then((data) => {
        if (!cancelled) setItems(data.items);
      })
      .catch(() => {
        if (!cancelled) setLoadError("Couldn't load the registry right now.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function openClaimConfirm(item: RegistryItem) {
    setActionError(null);
    setModal({ type: "confirmClaim", item });
  }

  function closeModal() {
    setModal(null);
  }

  async function confirmClaim() {
    if (modal?.type !== "confirmClaim") return;
    const item = modal.item;

    setClaimingId(item.item_id);
    try {
      const res = await fetch(`/api/registry/${item.item_id}/claim`, {
        method: "POST",
      });

      if (res.status === 409) {
        setModal({ type: "alreadyClaimed" });
        await refetch();
        return;
      }
      if (!res.ok) {
        setActionError("Something went wrong claiming this item. Please try again.");
        setModal(null);
        return;
      }

      setModal(null);
      window.open(item.item_url, "_blank", "noopener,noreferrer");
      await refetch();
    } finally {
      setClaimingId(null);
    }
  }

  async function unclaimItem(item: RegistryItem) {
    setActionError(null);
    setUnclaimingId(item.item_id);

    try {
      const res = await fetch(`/api/registry/${item.item_id}/unclaim`, {
        method: "POST",
      });

      if (!res.ok) {
        setActionError("Something went wrong unclaiming this item. Please try again.");
        return;
      }

      await refetch();
    } finally {
      setUnclaimingId(null);
    }
  }

  async function removeItem(item: RegistryItem) {
    setActionError(null);
    setRemovingId(item.item_id);

    try {
      const res = await fetch(`/api/registry/${item.item_id}`, {
        method: "DELETE",
      });

      if (res.status === 403) {
        setActionError("You don't have permission to remove this item.");
        return;
      }
      if (!res.ok) {
        setActionError("Something went wrong removing this item. Please try again.");
        return;
      }

      await refetch();
    } finally {
      setRemovingId(null);
    }
  }

  function startAdding() {
    setNewName("");
    setNewUrl("");
    setNewPrice("");
    setNewImageUrl("");
    setAddError(null);
    setIsAdding(true);
  }

  function cancelAdding() {
    setIsAdding(false);
    setAddError(null);
  }

  async function saveNew() {
    const price = Number(newPrice);
    if (!newName || !newUrl || !newImageUrl || Number.isNaN(price)) {
      setAddError("Please fill in all fields with a valid price.");
      return;
    }

    setAddSaving(true);
    setAddError(null);

    try {
      const res = await fetch("/api/registry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item_name: newName,
          item_url: newUrl,
          item_price: price,
          image_url: newImageUrl,
        }),
      });

      if (res.status === 403) {
        setAddError("You don't have permission to add items.");
        return;
      }
      if (!res.ok) {
        setAddError("Something went wrong saving. Please try again.");
        return;
      }

      setIsAdding(false);
      await refetch();
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

  const visibleItems = editing
    ? items
    : items.filter((item) => !item.claimed_by || item.isClaimedByViewer);

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-2xl font-semibold text-pine">Registry</h1>

      {actionError && (
        <p role="alert" className="mt-4 text-sm text-blood">
          {actionError}
        </p>
      )}

      {editing && (
        <div className="mt-6">
          {isAdding ? (
            <OrnateCard
              accent="gold"
              contentClassName="grid gap-3 p-6 sm:grid-cols-2"
            >
              <input
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                className="rounded border border-moss/40 bg-white/70 p-2 text-pine focus:border-forest focus:outline-none"
                placeholder="Item name"
              />
              <input
                value={newUrl}
                onChange={(event) => setNewUrl(event.target.value)}
                className="rounded border border-moss/40 bg-white/70 p-2 text-pine focus:border-forest focus:outline-none"
                placeholder="Purchase URL"
              />
              <input
                value={newPrice}
                onChange={(event) => setNewPrice(event.target.value)}
                type="number"
                step="0.01"
                className="rounded border border-moss/40 bg-white/70 p-2 text-pine focus:border-forest focus:outline-none"
                placeholder="Price"
              />
              <input
                value={newImageUrl}
                onChange={(event) => setNewImageUrl(event.target.value)}
                className="rounded border border-moss/40 bg-white/70 p-2 text-pine focus:border-forest focus:outline-none"
                placeholder="Image URL"
              />
              {addError && (
                <p role="alert" className="sm:col-span-2 text-sm text-blood">
                  {addError}
                </p>
              )}
              <div className="flex gap-3 sm:col-span-2">
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
              Add item
            </button>
          )}
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {visibleItems.map((item) => (
          <OrnateCard key={item.item_id} className="flex flex-col" contentClassName="">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.image_url}
              alt={item.item_name}
              className="h-48 w-full object-cover"
            />
            <div className="flex flex-1 flex-col gap-2 p-5">
              <h2 className="font-semibold text-pine">{item.item_name}</h2>
              <p className="text-sm text-moss">{formatPrice(item.item_price)}</p>

              {item.claimed_by && item.isClaimedByViewer && (
                <span className="inline-block w-fit rounded-full bg-forest px-3 py-1 text-xs font-medium text-white">
                  Claimed by you
                </span>
              )}

              {item.claimed_by && !item.isClaimedByViewer && (
                <span className="inline-block w-fit rounded-full bg-moss px-3 py-1 text-xs font-medium text-gold">
                  Claimed by {item.claimed_by}
                </span>
              )}

              <div className="mt-auto flex flex-wrap gap-3 pt-3">
                {item.claimed_by && item.isClaimedByViewer && (
                  <button
                    type="button"
                    onClick={() => unclaimItem(item)}
                    disabled={unclaimingId === item.item_id}
                    className="rounded border border-moss/40 px-3 py-1 text-sm font-medium text-pine disabled:opacity-50"
                  >
                    {unclaimingId === item.item_id ? "Unclaiming…" : "Unclaim?"}
                  </button>
                )}

                {!item.claimed_by && (
                  <button
                    type="button"
                    onClick={() => openClaimConfirm(item)}
                    className="rounded bg-gold px-3 py-1 text-sm font-semibold text-pine hover:brightness-95"
                  >
                    Purchase Link
                  </button>
                )}

                {editing && (
                  <button
                    type="button"
                    onClick={() => removeItem(item)}
                    disabled={removingId === item.item_id}
                    className="rounded bg-blood px-3 py-1 text-sm font-medium text-white disabled:opacity-50"
                  >
                    {removingId === item.item_id ? "Removing…" : "Remove item"}
                  </button>
                )}
              </div>
            </div>
          </OrnateCard>
        ))}
      </div>

      {modal?.type === "confirmClaim" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <OrnateCard tone="pine" accent="blood" className="max-w-md" contentClassName="p-6 shadow-lg">
            <h2 className="mb-2 text-lg font-semibold text-gold">
              Claim this item?
            </h2>
            <p className="text-cream">
              You are about to navigate away from the wedding page to the
              retailer&apos;s page for this item. If you plan on purchasing
              this item for his lord and ladyship, click yes to claim this
              item. Wouldn&apos;t want someone else to steal your glory!
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                disabled={claimingId === modal.item.item_id}
                className="rounded border border-gold/40 px-4 py-2 text-sm font-medium text-gold disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmClaim}
                disabled={claimingId === modal.item.item_id}
                className="rounded bg-blood px-4 py-2 text-sm font-medium text-gold disabled:opacity-50"
              >
                {claimingId === modal.item.item_id ? "Claiming…" : "Yes, claim it"}
              </button>
            </div>
          </OrnateCard>
        </div>
      )}

      {modal?.type === "alreadyClaimed" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <OrnateCard className="max-w-md" contentClassName="p-6 shadow-lg">
            <p className="text-pine">
              This item has already been claimed. Please choose a different
              item.
            </p>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={closeModal}
                className="rounded bg-forest px-4 py-2 text-sm font-medium text-white"
              >
                OK
              </button>
            </div>
          </OrnateCard>
        </div>
      )}
    </div>
  );
}
