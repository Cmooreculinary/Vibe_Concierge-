import React, { useEffect, useState } from "react";
import { ExternalLink, Info, MapPin, ShieldCheck, Sparkles, Users, X } from "lucide-react";
import { MeetupEvent } from "../types";

interface MapPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  meetup: MeetupEvent;
}

interface VenueInsight {
  description: string;
  address: string;
  transit: string;
  parking: string;
  tips: string;
  groundingAttribution?: string;
}

function getVenueCoords(id: string) {
  let sum = 0;
  for (let index = 0; index < id.length; index += 1) sum += id.charCodeAt(index);
  return {
    x: 300 + (sum % 200),
    y: 180 + ((sum * 7) % 120),
  };
}

export default function MapPreviewModal({ isOpen, onClose, meetup }: MapPreviewModalProps) {
  const [insight, setInsight] = useState<VenueInsight | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const venueCoords = getVenueCoords(meetup.id);
  const safetyEligible =
    isOpen &&
    meetup.venueType === "public" &&
    meetup.joined &&
    meetup.attendeesCount >= 2;

  useEffect(() => {
    if (!safetyEligible) return;

    const controller = new AbortController();
    setLoadingInsight(true);
    setInsight(null);

    fetch("/api/venue-insights", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ location: meetup.location, title: meetup.title }),
      signal: controller.signal,
    })
      .then(response => {
        if (!response.ok) throw new Error(`Venue lookup failed with status ${response.status}`);
        return response.json();
      })
      .then(data => setInsight(data))
      .catch(error => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        console.error("Failed to load public venue insight:", error);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingInsight(false);
      });

    return () => controller.abort();
  }, [safetyEligible, meetup.id, meetup.location, meetup.title]);

  if (!safetyEligible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-neutral-950/90 p-2 backdrop-blur-md sm:p-4">
      <div className="grid max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-3xl border border-neutral-800 smoked-glass shadow-2xl md:grid-cols-12">
        <section className="relative col-span-7 flex h-[340px] flex-col border-b border-neutral-800 bg-neutral-950 md:h-[620px] md:border-b-0 md:border-r">
          <div className="absolute left-4 top-4 z-10 max-w-sm rounded-2xl border border-emerald-900/50 bg-neutral-950/90 p-3 backdrop-blur-md">
            <span className="flex items-center gap-1.5 font-mono text-[9px] font-black uppercase tracking-widest text-emerald-400">
              <ShieldCheck className="h-3.5 w-3.5" /> Confirmed public venue
            </span>
            <h4 className="mt-1 truncate font-display text-sm font-bold text-white">{meetup.title}</h4>
            <p className="mt-1 flex items-center gap-1.5 text-[10px] text-neutral-400">
              <Users className="h-3.5 w-3.5 text-orange-400" /> {meetup.attendeesCount} confirmed attendees
            </p>
          </div>

          <div className="h-full w-full select-none overflow-hidden">
            <svg viewBox="0 0 800 500" className="h-full w-full" style={{ background: "#070707" }}>
              <defs>
                <pattern id="public-venue-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M40 0H0V40" fill="none" stroke="#1E1E1E" strokeWidth="1" />
                </pattern>
                <filter id="public-venue-glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="8" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>
              <rect width="100%" height="100%" fill="url(#public-venue-grid)" />
              <path d="M-20 410Q190 450 360 300T830 230" fill="none" stroke="#141414" strokeWidth="54" />
              <path d="M40 100L760 430" stroke="#1E1E1E" strokeWidth="18" strokeLinecap="round" />
              <path d="M100 430L720 60" stroke="#1E1E1E" strokeWidth="12" strokeLinecap="round" />
              {[{ x: 170, y: 170 }, { x: 600, y: 120 }, { x: 630, y: 390 }, { x: 220, y: 390 }].map((point, index) => (
                <g key={index} opacity="0.35">
                  <circle cx={point.x} cy={point.y} r="10" fill="#2A2A2A" />
                  <circle cx={point.x} cy={point.y} r="3" fill="#A3A3A3" />
                </g>
              ))}
              <g transform={`translate(${venueCoords.x}, ${venueCoords.y})`}>
                <circle r="30" fill="#EC5B13" opacity="0.2" className="animate-pulse" />
                <circle r="14" fill="#EC5B13" filter="url(#public-venue-glow)" />
                <circle r="6" fill="#FFFFFF" />
                <path d="M-8-2L0 17 8-2Z" fill="#EC5B13" />
              </g>
              <text x={venueCoords.x} y={venueCoords.y - 30} fill="#FED7AA" fontSize="12" fontFamily="sans-serif" fontWeight="700" textAnchor="middle">
                PUBLIC MEETUP VENUE
              </text>
            </svg>
          </div>

          <div className="absolute bottom-4 left-4 right-4 rounded-xl border border-neutral-800 bg-neutral-950/90 p-3 text-[10px] leading-relaxed text-neutral-400 backdrop-blur-md">
            <span className="font-bold text-neutral-200">Privacy boundary:</span> this map contains one public destination pin. It does not display any attendee, home, device, or live location.
          </div>
        </section>

        <section className="col-span-5 flex h-[480px] flex-col overflow-y-auto bg-neutral-900 md:h-[620px]">
          <header className="sticky top-0 z-20 flex items-center justify-between border-b border-neutral-800 bg-neutral-900/95 p-5 backdrop-blur">
            <div>
              <h3 className="font-display text-base font-bold text-white">Public Venue Profile</h3>
              <p className="font-mono text-[10px] text-neutral-500">Destination only • no people tracking</p>
            </div>
            <button type="button" onClick={onClose} aria-label="Close public venue map" className="rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </header>

          <div className="flex-1 space-y-5 p-5">
            <div className="rounded-2xl border border-emerald-900/40 bg-emerald-950/15 p-4">
              <p className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                <ShieldCheck className="h-4 w-4" /> Safety requirements passed
              </p>
              <p className="mt-1 text-[10px] leading-relaxed text-neutral-400">Public venue confirmed • your RSVP confirmed • group minimum confirmed</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  <Sparkles className="h-3.5 w-3.5 text-orange-400" /> Venue information
                </span>
                {insight?.groundingAttribution && (
                  <span className="rounded-full border border-emerald-800 bg-emerald-950 px-2 py-0.5 font-mono text-[9px] text-emerald-400">{insight.groundingAttribution}</span>
                )}
              </div>

              {loadingInsight ? (
                <div className="space-y-2 rounded-2xl border border-neutral-800 bg-neutral-950/50 p-4 animate-pulse">
                  <div className="h-3 w-1/3 rounded bg-neutral-800" />
                  <div className="h-3 w-full rounded bg-neutral-800" />
                  <div className="h-3 w-4/5 rounded bg-neutral-800" />
                </div>
              ) : insight ? (
                <div className="space-y-3 rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4 text-xs text-neutral-300">
                  <p className="leading-relaxed">{insight.description}</p>
                  <div className="space-y-2 border-t border-neutral-800/60 pt-3 text-[11px]">
                    <p><span className="font-mono text-neutral-500">ADDRESS:</span> {insight.address}</p>
                    <p><span className="font-mono text-neutral-500">TRANSIT:</span> {insight.transit}</p>
                    <p><span className="font-mono text-neutral-500">PARKING:</span> {insight.parking}</p>
                  </div>
                  <div className="flex items-start gap-2 rounded-xl border border-orange-900/30 bg-orange-950/20 p-2.5 text-[11px] text-orange-200">
                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-orange-400" />
                    <p className="leading-snug">{insight.tips}</p>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-neutral-800 bg-neutral-950/40 p-4 text-center text-xs text-neutral-500">Venue information is temporarily unavailable.</div>
              )}
            </div>

            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(meetup.location + " " + (insight?.address || ""))}`}
              target="_blank"
              rel="noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-800 bg-neutral-950 py-3 font-mono text-xs font-semibold text-neutral-300 transition-colors hover:bg-neutral-800"
            >
              <MapPin className="h-4 w-4 text-orange-400" /> Open public destination in Maps <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
