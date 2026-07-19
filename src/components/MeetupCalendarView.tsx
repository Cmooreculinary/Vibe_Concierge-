import React, { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Users,
  Check,
  Sparkles,
  Clock,
  Calendar,
  AlertCircle,
  Tag
} from "lucide-react";
import { MeetupEvent } from "../types";
import MeetupCountdown from "./MeetupCountdown";

interface MeetupCalendarViewProps {
  meetups: MeetupEvent[];
  onRsvpToggle: (meetupId: string) => void;
  searchQuery: string;
}

// Map meetup date string to actual Year/Month/Day
export function resolveMeetupDateString(dateStr: string, baseDate: Date = new Date("2026-07-08T12:00:00")): string {
  const date = new Date(baseDate);
  const s = dateStr.toLowerCase().trim();

  if (s === "today") {
    // Keep today (July 8, 2026)
  } else if (s === "tomorrow") {
    date.setDate(date.getDate() + 1);
  } else if (s === "this saturday") {
    const day = date.getDay(); // 3 for Wed
    const diff = (6 - day + 7) % 7 || 7;
    date.setDate(date.getDate() + diff);
  } else if (s === "this weekend") {
    const day = date.getDay();
    const diff = (6 - day + 7) % 7 || 7;
    date.setDate(date.getDate() + diff);
  } else if (s === "next thursday") {
    // July 16, 2026
    const day = date.getDay();
    const diff = (4 - day + 7) % 7 || 7;
    date.setDate(date.getDate() + diff + 7);
  } else if (s === "next friday") {
    // July 17, 2026
    const day = date.getDay();
    const diff = (5 - day + 7) % 7 || 7;
    date.setDate(date.getDate() + diff + 7);
  } else if (s.startsWith("in ") && s.endsWith(" days")) {
    const match = s.match(/in (\d+) days/);
    if (match) {
      date.setDate(date.getDate() + parseInt(match[1], 10));
    }
  } else {
    const parsed = Date.parse(dateStr);
    if (!isNaN(parsed)) {
      const parsedDate = new Date(parsed);
      return `${parsedDate.getFullYear()}-${String(parsedDate.getMonth() + 1).padStart(2, "0")}-${String(parsedDate.getDate()).padStart(2, "0")}`;
    }
  }

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function MeetupCalendarView({ meetups, onRsvpToggle, searchQuery }: MeetupCalendarViewProps) {
  // Base date centered around July 2026 since the application's timeline states 2026-07-08
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(6); // 0-indexed, so 6 is July

  // Track selected day (format "YYYY-MM-DD")
  const [selectedDay, setSelectedDay] = useState<string>("2026-07-08");

  // Format a map of meetup items by YYYY-MM-DD for fast lookup
  const meetupsByDay = useMemo(() => {
    const map: Record<string, MeetupEvent[]> = {};
    meetups.forEach(m => {
      const dateKey = resolveMeetupDateString(m.date);
      if (!map[dateKey]) {
        map[dateKey] = [];
      }
      map[dateKey].push(m);
    });
    return map;
  }, [meetups]);

  // Months labels
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Grid dates construction
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
    const prevMonthTotalDays = new Date(currentYear, currentMonth, 0).getDate();

    const daysList = [];

    // Prev month pad days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = prevMonthTotalDays - i;
      const m = currentMonth === 0 ? 11 : currentMonth - 1;
      const y = currentMonth === 0 ? currentYear - 1 : currentYear;
      daysList.push({
        day: d,
        month: m,
        year: y,
        isCurrentMonth: false,
        key: `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`
      });
    }

    // Current month days
    for (let d = 1; d <= totalDays; d++) {
      daysList.push({
        day: d,
        month: currentMonth,
        year: currentYear,
        isCurrentMonth: true,
        key: `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`
      });
    }

    // Next month pad days
    const remaining = 42 - daysList.length;
    for (let d = 1; d <= remaining; d++) {
      const m = currentMonth === 11 ? 0 : currentMonth + 1;
      const y = currentMonth === 11 ? currentYear + 1 : currentYear;
      daysList.push({
        day: d,
        month: m,
        year: y,
        isCurrentMonth: false,
        key: `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`
      });
    }

    return daysList;
  }, [currentYear, currentMonth]);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  // Meetups on the selected day
  const selectedDayMeetups = meetupsByDay[selectedDay] || [];

  // All meetups sorted by date key for the timeline
  const sortedTimelineMeetups = useMemo(() => {
    return [...meetups]
      .map(m => ({
        ...m,
        dateKey: resolveMeetupDateString(m.date),
      }))
      .sort((a, b) => a.dateKey.localeCompare(b.dateKey));
  }, [meetups]);

  // Highlight color maps for categories
  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case "adventure": return "border-emerald-500/35 text-emerald-400 bg-emerald-950/20";
      case "cuisine": return "border-yellow-500/35 text-yellow-400 bg-yellow-950/20";
      case "arts": return "border-rose-500/35 text-rose-400 bg-rose-950/20";
      case "games": return "border-amber-500/35 text-amber-400 bg-amber-950/20";
      default: return "border-orange-500/35 text-orange-400 bg-orange-950/20";
    }
  };

  return (
    <div id="meetup-calendar-timeline" className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-8">
      {/* LEFT PANEL: The Interactive Calendar Grid */}
      <div className="lg:col-span-7 smoked-glass border border-neutral-800 rounded-2xl p-5 flex flex-col justify-between shadow-xl">
        <div>
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-neutral-800/60">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-500" />
              <h2 className="text-sm font-bold text-neutral-200 font-mono">
                {monthNames[currentMonth]} {currentYear}
              </h2>
            </div>
            <div className="flex gap-1">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 bg-neutral-950 hover:bg-neutral-850 rounded-lg border border-neutral-800 transition-colors text-neutral-400 hover:text-white cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  const now = new Date("2026-07-08T12:00:00");
                  setCurrentYear(now.getFullYear());
                  setCurrentMonth(now.getMonth());
                  setSelectedDay("2026-07-08");
                }}
                className="px-2.5 py-1 text-[10px] bg-neutral-950 hover:bg-neutral-850 rounded-lg border border-neutral-800 font-mono text-neutral-400 hover:text-orange-400 cursor-pointer"
              >
                Today
              </button>
              <button
                onClick={handleNextMonth}
                className="p-1.5 bg-neutral-950 hover:bg-neutral-850 rounded-lg border border-neutral-800 transition-colors text-neutral-400 hover:text-white cursor-pointer"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 text-center gap-1 mb-2">
            {["S", "M", "T", "W", "T", "F", "S"].map((w, index) => (
              <span key={index} className="text-[10px] font-mono text-neutral-500 font-bold uppercase py-1">
                {w}
              </span>
            ))}
          </div>

          {/* Calendar Day Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {calendarDays.map((cell) => {
              const hasMeetups = meetupsByDay[cell.key] && meetupsByDay[cell.key].length > 0;
              const cellMeetups = meetupsByDay[cell.key] || [];
              const isSelected = selectedDay === cell.key;
              const isToday = cell.key === "2026-07-08";

              // Detect if user has any RSVPs on this day
              const hasRsvps = cellMeetups.some(m => m.joined);

              return (
                <button
                  key={cell.key}
                  onClick={() => setSelectedDay(cell.key)}
                  className={`relative aspect-square rounded-xl p-1 flex flex-col items-center justify-between transition-all duration-200 cursor-pointer text-xs font-mono font-medium ${
                    !cell.isCurrentMonth
                      ? "text-neutral-600 hover:bg-neutral-850/30"
                      : isSelected
                      ? "bg-orange-600 text-white shadow-lg shadow-orange-950/30 ring-2 ring-orange-500/50"
                      : isToday
                      ? "bg-neutral-800 border border-neutral-700 text-orange-400"
                      : "hover:bg-neutral-800 text-neutral-300 bg-neutral-950/20"
                  }`}
                >
                  <div className="w-full flex justify-between items-center px-1">
                    <span className={`text-[11px] ${isToday && !isSelected ? "font-bold text-orange-400" : ""}`}>
                      {cell.day}
                    </span>
                    {isToday && (
                      <span className="w-1 h-1 rounded-full bg-orange-400" title="Today"></span>
                    )}
                  </div>

                  {/* Indicators area */}
                  <div className="flex gap-1 items-center justify-center h-2 pb-0.5">
                    {cellMeetups.slice(0, 3).map((m) => (
                      <span
                        key={m.id}
                        className={`w-1.5 h-1.5 rounded-full ${
                          m.joined
                            ? "bg-emerald-400 animate-pulse"
                            : m.category === "adventure"
                            ? "bg-emerald-500"
                            : m.category === "cuisine"
                            ? "bg-yellow-500"
                            : m.category === "arts"
                            ? "bg-rose-500"
                            : "bg-orange-500"
                        }`}
                        title={`${m.title} (${m.time})`}
                      />
                    ))}
                    {cellMeetups.length > 3 && (
                      <span className="text-[8px] font-mono leading-none text-neutral-500 font-bold">+</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 p-3 bg-neutral-950/40 rounded-xl border border-neutral-800/60 flex flex-wrap items-center justify-between gap-3 text-[10px] font-mono text-neutral-400">
          <div className="flex gap-3.5 flex-wrap">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
              <span>RSVP Confirmed</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-orange-500 inline-block" />
              <span>Standard Proposed</span>
            </span>
          </div>
          <span className="text-neutral-500">Click a day to view timeline</span>
        </div>
      </div>

      {/* RIGHT PANEL: Meetups Timeline & Day Detail */}
      <div className="lg:col-span-5 flex flex-col gap-5">
        
        {/* Selected Day Details Panel */}
        <div className="smoked-glass border border-neutral-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800/60 mb-4">
            <div className="space-y-0.5">
              <h3 className="text-xs font-bold font-mono text-neutral-400 uppercase tracking-widest">
                Plans on Selected Day
              </h3>
              <p className="text-sm font-black text-white font-display">
                {new Date(selectedDay + "T12:00:00").toLocaleDateString(undefined, {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </p>
            </div>
            <span className="px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-[10px] font-bold text-orange-400 font-mono">
              {selectedDayMeetups.length} scheduled
            </span>
          </div>

          {selectedDayMeetups.length > 0 ? (
            <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
              {selectedDayMeetups.map((m) => {
                const badgeStyle = getCategoryColor(m.category);
                return (
                  <div
                    key={m.id}
                    className="group bg-neutral-950/80 border border-neutral-800/80 hover:border-neutral-700 rounded-xl p-3.5 transition-all duration-300"
                  >
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <div>
                        <span className={`text-[8px] uppercase tracking-widest font-black font-mono border px-1.5 py-0.5 rounded-md ${badgeStyle}`}>
                          {m.category}
                        </span>
                        <h4 className="text-sm font-bold text-neutral-150 group-hover:text-orange-400 transition-colors mt-1.5 leading-snug">
                          {m.title}
                        </h4>
                      </div>
                      <span className="text-[10px] font-mono text-orange-400 shrink-0 bg-orange-950/20 px-2 py-0.5 rounded border border-orange-900/30">
                        {m.time}
                      </span>
                    </div>

                    <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed mb-3">
                      {m.description}
                    </p>

                    <div className="flex items-center justify-between gap-2 text-[10px] font-mono text-neutral-500 mb-3">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-neutral-400 shrink-0" />
                        <span className="truncate max-w-[120px]">{m.location}</span>
                      </span>
                      <span className="flex items-center gap-1 shrink-0">
                        <Users className="w-3 h-3 text-neutral-400" />
                        <span>{m.attendeesCount} RSVPed</span>
                      </span>
                    </div>

                    {/* Integrated Countdown for instant build of excitement */}
                    <div className="mb-3.5">
                      <MeetupCountdown dateStr={m.date} timeStr={m.time} isConfirmed={m.joined} />
                    </div>

                    <button
                      onClick={() => onRsvpToggle(m.id)}
                      className={`w-full py-2 rounded-lg text-xs font-bold transition-all ${
                        m.joined
                          ? "bg-emerald-900/20 text-emerald-400 border border-emerald-800/40 hover:bg-emerald-900/30"
                          : "bg-neutral-900 hover:bg-neutral-850 text-neutral-300 border border-neutral-800"
                      } flex items-center justify-center gap-1 cursor-pointer`}
                    >
                      {m.joined ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Going (Click to leave)</span>
                        </>
                      ) : (
                        <span>Accept Outing Invitation</span>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 bg-neutral-950/30 border border-dashed border-neutral-800 rounded-xl space-y-2">
              <AlertCircle className="w-6 h-6 text-neutral-500 mx-auto opacity-60" />
              <p className="text-[11px] font-mono text-neutral-400 px-4">
                No hangouts scheduled for this day yet. Try clicking highlighted days or tap "Propose Outing" above!
              </p>
            </div>
          )}
        </div>

        {/* Master Timeline View Card */}
        <div className="smoked-glass border border-neutral-800 rounded-2xl p-5 shadow-xl flex-1">
          <h3 className="text-xs font-bold font-mono text-neutral-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-orange-400" />
            <span>Outings Timeline</span>
          </h3>

          <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1 relative">
            {/* The vertical connector line */}
            <div className="absolute left-3 top-2 bottom-4 w-0.5 bg-neutral-800/80 border-dashed border-l border-neutral-800" />

            {sortedTimelineMeetups.length > 0 ? (
              sortedTimelineMeetups.map((m, index) => {
                const isSelected = selectedDay === m.dateKey;
                const isConfirmed = m.joined;
                
                return (
                  <div
                    key={m.id}
                    onClick={() => setSelectedDay(m.dateKey)}
                    className={`relative pl-8 flex flex-col gap-1 cursor-pointer group transition-all ${
                      isSelected ? "scale-[1.01]" : ""
                    }`}
                  >
                    {/* Circle Node Indicator */}
                    <div
                      className={`absolute left-1.5 top-1.5 w-3 h-3 rounded-full border-2 transition-all ${
                        isConfirmed
                          ? "bg-emerald-400 border-emerald-950 ring-4 ring-emerald-900/20"
                          : isSelected
                          ? "bg-orange-400 border-orange-950 ring-4 ring-orange-900/25"
                          : "bg-neutral-900 border-neutral-700 hover:border-neutral-500"
                      }`}
                    />

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <span className="text-[10px] font-bold font-mono text-orange-400 uppercase">
                        {m.date} • {m.time}
                      </span>
                      <span className="text-[9px] font-mono text-neutral-500">
                        {m.location}
                      </span>
                    </div>

                    <h4 className={`text-xs font-bold leading-tight group-hover:text-orange-300 transition-colors ${
                      isConfirmed ? "text-emerald-400" : "text-white"
                    }`}>
                      {m.title}
                    </h4>

                    <div className="flex items-center gap-1.5 text-[9px] font-mono text-neutral-500 mt-0.5">
                      <span className="text-neutral-450">Host: {m.organizerName}</span>
                      <span>•</span>
                      <span>{m.attendeesCount} joined</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-[11px] font-mono text-neutral-500 text-center py-4">
                No upcoming events to display on the timeline.
              </p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
