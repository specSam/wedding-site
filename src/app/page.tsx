import { Suspense } from "react";
import RsvpGate from "@/components/RsvpGate";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <Suspense
        fallback={
          <div className="flex flex-1 items-center justify-center">
            <p className="text-moss">Loading…</p>
          </div>
        }
      >
        <RsvpGate />
      </Suspense>
    </div>
  );
}
