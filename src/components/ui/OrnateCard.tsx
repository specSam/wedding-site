import type { ReactNode } from "react";

type Tone = "paper" | "pine";
type Accent = "moss" | "gold" | "blood";

const toneClasses: Record<Tone, string> = {
  paper: "border-moss/30 bg-cream/90 text-pine",
  pine: "border-gold/30 bg-pine text-cream",
};

const accentClasses: Record<Accent, string> = {
  moss: "text-moss",
  gold: "text-gold",
  blood: "text-blood",
};

function CornerFlourish({ className }: { className: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      aria-hidden="true"
      className={`pointer-events-none absolute h-6 w-6 opacity-70 sm:h-8 sm:w-8 ${className}`}
    >
      <path
        d="M2 38 C2 20 20 2 38 2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M2 28 C11 24 15 17 15 8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.1"
      />
      <circle cx="15" cy="8" r="2" fill="currentColor" />
      <path
        d="M12 38 C16 30 21 26 30 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.1"
      />
      <circle cx="30" cy="24" r="1.6" fill="currentColor" />
    </svg>
  );
}

export default function OrnateCard({
  children,
  tone = "paper",
  accent = "moss",
  className = "",
  contentClassName = "p-6 sm:p-8",
}: {
  children: ReactNode;
  tone?: Tone;
  accent?: Accent;
  className?: string;
  contentClassName?: string;
}) {
  const flourishColor = accentClasses[accent];

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border shadow-sm ${toneClasses[tone]} ${className}`}
    >
      <CornerFlourish className={`left-1.5 top-1.5 ${flourishColor}`} />
      <CornerFlourish
        className={`right-1.5 top-1.5 -scale-x-100 ${flourishColor}`}
      />
      <CornerFlourish
        className={`bottom-1.5 left-1.5 -scale-y-100 ${flourishColor}`}
      />
      <CornerFlourish
        className={`bottom-1.5 right-1.5 -scale-x-100 -scale-y-100 ${flourishColor}`}
      />
      <div className={contentClassName}>{children}</div>
    </div>
  );
}
