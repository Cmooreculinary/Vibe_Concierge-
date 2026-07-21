import React from "react";

interface PrivacyToggleProps {
  label: string;
  description: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  compact?: boolean;
}

export default function PrivacyToggle({
  label,
  description,
  enabled,
  onChange,
  compact = false,
}: PrivacyToggleProps) {
  return (
    <div className={`flex items-center justify-between gap-4 rounded-xl border border-neutral-800 bg-neutral-950/70 ${compact ? "p-2.5" : "p-3.5"}`}>
      <div className="min-w-0 space-y-0.5">
        <p className="text-xs font-semibold text-neutral-100">{label}</p>
        <p className={`${compact ? "text-[9px]" : "text-[10px]"} leading-relaxed text-neutral-500`}>{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label={label}
        onClick={() => onChange(!enabled)}
        className={`relative h-6 w-11 shrink-0 rounded-full border p-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 ${
          enabled
            ? "border-orange-500 bg-orange-600"
            : "border-neutral-700 bg-neutral-800"
        }`}
      >
        <span
          aria-hidden="true"
          className={`block h-4.5 w-4.5 rounded-full bg-white shadow transition-transform ${
            enabled ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}
