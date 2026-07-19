import React, { useState, useEffect } from "react";
import {
  X,
  MapPin,
  Compass,
  Navigation,
  Car,
  Bike,
  Info,
  Sparkles,
  Clock,
  ArrowRight,
  ExternalLink,
  Milestone
} from "lucide-react";
import { MeetupEvent, MatchProfile } from "../types";

interface MapPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  meetup: MeetupEvent;
  matches: MatchProfile[];
}

interface VenueInsight {
  description: string;
  address: string;
  transit: string;
  parking: string;
  tips: string;
  groundingAttribution?: string;
}

// Fixed coordinates for user (Alex Moore)
const USER_COORDS = { x: 220, y: 340, name: "Alex's Loft (You)" };

// Map venues to unique visual coordinates on our SVG map canvas
function getVenueCoords(id: string) {
  // Hash the id to consistent coordinates
  let sum = 0;
  for (let i = 0; i < id.length; i++) {
    sum += id.charCodeAt(i);
  }
  const x = 300 + (sum % 400); // 300 - 700 range
  const y = 100 + ((sum * 7) % 250); // 100 - 350 range
  return { x, y };
}

export default function MapPreviewModal({ isOpen, onClose, meetup, matches }: MapPreviewModalProps) {
  const [travelMode, setTravelMode] = useState<"driving" | "walking" | "cycling">("driving");
  const [insight, setInsight] = useState<VenueInsight | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [activePin, setActivePin] = useState<{ x: number; y: number; name: string }>({ x: 0, y: 0, name: "" });

  const venueCoords = getVenueCoords(meetup.id);

  // Fetch AI Maps Grounding insights
  useEffect(() => {
    if (!isOpen || !meetup) return;

    setLoadingInsight(true);
    setInsight(null);
    setActivePin({ ...venueCoords, name: meetup.location });

    fetch("/api/venue-insights", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ location: meetup.location, title: meetup.title }),
    })
      .then(res => res.json())
      .then(data => {
        setInsight(data);
        setLoadingInsight(false);
      })
      .catch(err => {
        console.error("Failed to load venue insights:", err);
        setLoadingInsight(false);
      });
  }, [isOpen, meetup.id]);

  if (!isOpen) return null;

  // Calculate dynamic travel metadata based on coords
  const distancePx = Math.sqrt(
    Math.pow(venueCoords.x - USER_COORDS.x, 2) + Math.pow(venueCoords.y - USER_COORDS.y, 2)
  );
  // Scale px distance to miles (e.g. 100px = 1.2 miles)
  const distanceMiles = (distancePx / 90).toFixed(1);

  const getTravelTime = () => {
    const baseMinutes = parseFloat(distanceMiles) * 5; // e.g. 2 miles = 10 mins base
    if (travelMode === "driving") return Math.max(Math.round(baseMinutes * 1.5), 4);
    if (travelMode === "cycling") return Math.max(Math.round(baseMinutes * 3.5), 10);
    return Math.max(Math.round(baseMinutes * 12), 25); // walking
  };

  const getStepByStepDirections = () => {
    const venueName = meetup.location;
    if (travelMode === "driving") {
      return [
        { text: "Exit Downtown Loft onto Grand Avenue.", duration: "1 min" },
        { text: `Merge onto Highway 5 North toward ${venueName}.`, duration: "3 mins" },
        { text: "Take Exit 18B toward the Waterfront Boulevard.", duration: "2 mins" },
        { text: `Turn right onto Pine St. The entrance to ${venueName} is on your right.`, duration: "1 min" }
      ];
    } else if (travelMode === "cycling") {
      return [
        { text: "Head north on the 4th Street Dedicated Bike Lane.", duration: "3 mins" },
        { text: "Turn right onto the Riverfront Cycle path.", duration: "5 mins" },
        { text: "Pass through the park tunnel crossing.", duration: "4 mins" },
        { text: `Exit right at the trailhead leading straight into ${venueName}.`, duration: "2 mins" }
      ];
    } else {
      return [
        { text: "Walk north along Grand Avenue past the espresso shop.", duration: "6 mins" },
        { text: "Take the scenic park trail shortcut past the central pond.", duration: "12 mins" },
        { text: "Turn right onto the wooden pedestrian walkway.", duration: "8 mins" },
        { text: `Arrive at the welcoming entrance of ${venueName}.`, duration: "2 mins" }
      ];
    }
  };

  // Static/dynamic custom points of interest for map texture
  const localPOI = [
    { x: 150, y: 180, name: "The Underground Press Cafe ☕", cat: "arts" },
    { x: 380, y: 120, name: "Solstice Park Peak 🌲", cat: "adventure" },
    { x: 550, y: 380, name: "Glasshouse Creative Workspace 💻", cat: "tech" },
    { x: 320, y: 260, name: "Neon Speakeasy Lounge 🍹", cat: "games" }
  ];

  return (
    <div id="modal-map-preview-overlay" className="fixed inset-0 z-50 bg-neutral-950/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-6xl smoked-glass border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:grid md:grid-cols-12 max-h-[92vh]">
        
        {/* LEFT COLUMN: Map view (Canvas / SVG) - spans 7 cols on desktop */}
        <div className="col-span-7 bg-neutral-950 relative flex flex-col h-[320px] sm:h-[450px] md:h-[600px] border-b md:border-b-0 md:border-r border-neutral-800/80">
          {/* Top Info HUD */}
          <div className="absolute top-4 left-4 z-10 smoked-glass-light p-3 rounded-2xl border border-neutral-700/50 space-y-1 max-w-[280px] pointer-events-none">
            <span className="text-[9px] font-mono tracking-widest text-orange-400 uppercase font-black block">Active Navigation HUD</span>
            <h4 className="text-xs font-bold font-display text-white truncate">{meetup.title}</h4>
            <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-300">
              <span className="text-emerald-400 font-bold">{distanceMiles} mi</span>
              <span className="text-neutral-500">•</span>
              <span>{getTravelTime()} mins via {travelMode}</span>
            </div>
          </div>

          {/* Map Controls */}
          <div className="absolute bottom-4 left-4 z-10 flex gap-1.5 bg-neutral-950/80 p-1 rounded-xl border border-neutral-800 backdrop-blur-md">
            <button
              onClick={() => setTravelMode("driving")}
              className={`p-2 rounded-lg transition-all cursor-pointer ${
                travelMode === "driving"
                  ? "bg-orange-600 text-white"
                  : "text-neutral-400 hover:text-white hover:bg-neutral-900"
              }`}
              title="Driving Route"
            >
              <Car className="w-4 h-4" />
            </button>
            <button
              onClick={() => setTravelMode("cycling")}
              className={`p-2 rounded-lg transition-all cursor-pointer ${
                travelMode === "cycling"
                  ? "bg-orange-600 text-white"
                  : "text-neutral-400 hover:text-white hover:bg-neutral-900"
              }`}
              title="Cycling Path"
            >
              <Bike className="w-4 h-4" />
            </button>
            <button
              onClick={() => setTravelMode("walking")}
              className={`p-2 rounded-lg transition-all cursor-pointer ${
                travelMode === "walking"
                  ? "bg-orange-600 text-white"
                  : "text-neutral-400 hover:text-white hover:bg-neutral-900"
              }`}
              title="Walking Path"
            >
              <Navigation className="w-4 h-4 rotate-45" />
            </button>
          </div>

          {/* SVG Canvas Map */}
          <div className="w-full h-full relative overflow-hidden flex-1 select-none">
            <svg
              viewBox="0 0 800 500"
              className="w-full h-full"
              style={{ background: "#060606" }}
            >
              <defs>
                {/* Grid Pattern */}
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#121212" strokeWidth="1" />
                </pattern>
                {/* Glowing glow effects */}
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <filter id="glow-orange" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="8" result="blur" />
                  <feComponentTransfer in="blur" result="boost">
                    <feFuncA type="linear" slope="1.5"/>
                  </feComponentTransfer>
                  <feMerge>
                    <feMergeNode in="boost" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Grid backdrop */}
              <rect width="100%" height="100%" fill="url(#grid)" />

              {/* Styled Water Body (Vibe River) */}
              <path
                d="M -50 420 Q 200 450 350 300 T 850 250"
                fill="none"
                stroke="#022c22"
                strokeWidth="45"
                opacity="0.4"
                strokeLinecap="round"
              />
              <path
                d="M -50 420 Q 200 450 350 300 T 850 250"
                fill="none"
                stroke="#059669"
                strokeWidth="6"
                opacity="0.3"
                strokeLinecap="round"
              />

              {/* Styled Streets & Boulevard lines */}
              {/* Grand Avenue */}
              <line x1="50" y1="100" x2="750" y2="450" stroke="#1f1f1f" strokeWidth="16" strokeLinecap="round" opacity="0.6" />
              <line x1="50" y1="100" x2="750" y2="450" stroke="#0ea5e9" strokeWidth="1.5" strokeDasharray="6,6" strokeLinecap="round" opacity="0.15" />
              
              {/* Broadway Drive */}
              <line x1="100" y1="400" x2="700" y2="50" stroke="#1f1f1f" strokeWidth="12" strokeLinecap="round" opacity="0.6" />
              
              {/* Pine Street Loop */}
              <path d="M 50 280 Q 250 150 450 350 T 750 300" fill="none" stroke="#1a1a1a" strokeWidth="8" opacity="0.7" />

              {/* POI Markers (Faded pins) */}
              {localPOI.map((poi, idx) => (
                <g key={idx} className="cursor-pointer opacity-40 hover:opacity-80 transition-opacity">
                  <circle cx={poi.x} cy={poi.y} r="10" fill="#262626" />
                  <circle cx={poi.x} cy={poi.y} r="4" fill="#525252" />
                </g>
              ))}

              {/* Interactive Glowing Route Line (Active navigation path) */}
              {/* Draws a path from Alex Loft to Meetup Location */}
              <path
                d={`M ${USER_COORDS.x} ${USER_COORDS.y} 
                    Q ${(USER_COORDS.x + venueCoords.x) / 2 - 40} ${(USER_COORDS.y + venueCoords.y) / 2 - 80} 
                    ${venueCoords.x} ${venueCoords.y}`}
                fill="none"
                stroke="#ea580c"
                strokeWidth="5"
                strokeLinecap="round"
                filter="url(#glow-orange)"
                opacity="0.95"
                className="animate-[dash_2.5s_linear_infinite]"
                style={{
                  strokeDasharray: "12, 10",
                }}
              />

              <path
                d={`M ${USER_COORDS.x} ${USER_COORDS.y} 
                    Q ${(USER_COORDS.x + venueCoords.x) / 2 - 40} ${(USER_COORDS.y + venueCoords.y) / 2 - 80} 
                    ${venueCoords.x} ${venueCoords.y}`}
                fill="none"
                stroke="#fdba74"
                strokeWidth="2"
                strokeLinecap="round"
              />

              {/* User Location (Blue Pin) */}
              <g transform={`translate(${USER_COORDS.x}, ${USER_COORDS.y})`}>
                <circle cx="0" cy="0" r="16" fill="#0284c7" opacity="0.3" className="animate-ping" />
                <circle cx="0" cy="0" r="10" fill="#0284c7" filter="url(#glow)" />
                <circle cx="0" cy="0" r="5" fill="#e0f2fe" />
                {/* Pointer tip */}
                <path d="M-6,-2 L0,12 L6,-2 Z" fill="#0284c7" />
              </g>

              {/* Selected Meetup Location (Glowing Orange Pin) */}
              <g transform={`translate(${venueCoords.x}, ${venueCoords.y})`}>
                <circle cx="0" cy="0" r="22" fill="#ea580c" opacity="0.25" className="animate-pulse" />
                <circle cx="0" cy="0" r="12" fill="#ea580c" filter="url(#glow-orange)" />
                <circle cx="0" cy="0" r="6" fill="#fff" />
                {/* Pointer tip */}
                <path d="M-7,-2 L0,15 L7,-2 Z" fill="#ea580c" />
              </g>

              {/* SVG Labels */}
              <text x={USER_COORDS.x} y={USER_COORDS.y - 20} fill="#bae6fd" fontSize="10" fontFamily="monospace" textAnchor="middle" className="font-bold">
                Alex (You)
              </text>
              <text x={venueCoords.x} y={venueCoords.y - 24} fill="#fed7aa" fontSize="11" fontFamily="sans-serif" textAnchor="middle" className="font-bold">
                📍 {meetup.location}
              </text>
              <text x="350" y="445" fill="#115e59" fontSize="9" fontFamily="monospace" transform="rotate(-5, 350, 445)">
                VIBE RIVER WATERWAY
              </text>
            </svg>

            {/* Custom SVG Path Animation Definition */}
            <style>{`
              @keyframes dash {
                to {
                  stroke-dashoffset: -40;
                }
              }
            `}</style>
          </div>
        </div>

        {/* RIGHT COLUMN: AI Venue Grounding & Navigation Directions (5 cols) */}
        <div className="col-span-5 flex flex-col h-[400px] sm:h-[480px] md:h-[600px] bg-neutral-900 overflow-y-auto">
          {/* Header */}
          <div className="p-5 border-b border-neutral-800 flex items-center justify-between shrink-0 sticky top-0 bg-neutral-900/95 backdrop-blur z-20">
            <div className="space-y-0.5">
              <h3 className="text-base font-bold font-display text-white">Curated Place Profile</h3>
              <p className="text-[10px] text-neutral-400 font-mono">Location Grounding Hub</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 space-y-6 flex-1">
            {/* AI Grounding Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 font-mono flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                  AI Venue Grounding
                </span>
                {insight && (
                  <span className="text-[9px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded-full font-mono flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    {insight.groundingAttribution || "Google Maps"}
                  </span>
                )}
              </div>

              {loadingInsight ? (
                <div className="space-y-2.5 p-4 bg-neutral-950/50 border border-neutral-800/80 rounded-2xl animate-pulse">
                  <div className="h-3.5 bg-neutral-800 rounded w-1/4"></div>
                  <div className="h-3.5 bg-neutral-800 rounded w-5/6"></div>
                  <div className="h-3 bg-neutral-800 rounded w-full"></div>
                  <div className="h-3 bg-neutral-800 rounded w-2/3"></div>
                </div>
              ) : insight ? (
                <div className="space-y-3 bg-neutral-950/60 p-4 rounded-2xl border border-neutral-800/80 text-xs text-neutral-300 font-sans">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest block">Real-World Description</span>
                    <p className="leading-relaxed font-sans">{insight.description}</p>
                  </div>

                  <div className="border-t border-neutral-800/50 pt-3 space-y-2 text-[11px]">
                    <div className="flex gap-2">
                      <span className="font-semibold text-neutral-400 w-16 shrink-0 font-mono">Address:</span>
                      <span className="text-neutral-200">{insight.address}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="font-semibold text-neutral-400 w-16 shrink-0 font-mono">Transit:</span>
                      <span className="text-neutral-200 leading-normal">{insight.transit}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="font-semibold text-neutral-400 w-16 shrink-0 font-mono">Parking:</span>
                      <span className="text-neutral-200 leading-normal">{insight.parking}</span>
                    </div>
                  </div>

                  <div className="bg-orange-950/20 border border-orange-900/30 p-2.5 rounded-xl flex items-start gap-2 text-[11px] text-orange-200 mt-1">
                    <Info className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold font-mono text-orange-400 uppercase tracking-wider text-[9px] block mb-0.5">Vibe Pro Tip</span>
                      <p className="leading-snug">{insight.tips}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-neutral-950/40 border border-neutral-800 rounded-2xl text-center text-xs text-neutral-400">
                  Select a point or wait for grounding dispatch...
                </div>
              )}
            </div>

            {/* Travel Route & Steps */}
            <div className="space-y-3">
              <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 font-mono flex items-center gap-1.5">
                <Milestone className="w-3.5 h-3.5 text-neutral-400" />
                Line Navigation Steps
              </span>

              <div className="space-y-2.5">
                {getStepByStepDirections().map((step, idx) => (
                  <div key={idx} className="flex gap-3 text-xs items-start bg-neutral-950/30 p-2.5 rounded-xl border border-neutral-800/40">
                    <span className="w-5 h-5 rounded-full bg-neutral-800 border border-neutral-700 text-neutral-300 font-mono text-[10px] flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div className="flex-1 space-y-0.5">
                      <p className="text-neutral-300 leading-snug">{step.text}</p>
                      <span className="text-[9px] text-neutral-500 font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {step.duration}
                      </span>
                    </div>
                    <ArrowRight className="w-3 h-3 text-neutral-600 self-center" />
                  </div>
                ))}
              </div>
            </div>

            {/* External Redirect Affirmation */}
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(meetup.location + " " + (insight?.address || ""))}`}
              target="_blank"
              rel="noreferrer"
              className="w-full py-2.5 rounded-xl bg-neutral-950 hover:bg-neutral-850 text-neutral-300 border border-neutral-800 transition-colors flex items-center justify-center gap-1.5 text-xs font-semibold font-mono cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5 text-orange-400" />
              Open in Google Maps App
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
