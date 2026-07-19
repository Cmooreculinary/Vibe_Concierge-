import React, { useState, useEffect } from "react";
import { Clock, Timer, Sparkles } from "lucide-react";

interface MeetupCountdownProps {
  dateStr: string;
  timeStr: string;
  isConfirmed: boolean;
}

export default function MeetupCountdown({ dateStr, timeStr, isConfirmed }: MeetupCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    totalMs: number;
  } | null>(null);

  useEffect(() => {
    // Helper to resolve the meetup date string to a concrete Date object
    const calculateTargetDate = () => {
      const now = new Date();
      const ds = dateStr.toLowerCase().trim();
      const ts = timeStr.toLowerCase().trim();

      let targetDate = new Date();

      // Parse relative dates
      if (ds === "today") {
        // Keep today
      } else if (ds === "tomorrow") {
        targetDate.setDate(now.getDate() + 1);
      } else if (ds === "this weekend" || ds.includes("saturday")) {
        const currentDay = now.getDay(); // 0 is Sunday, 6 is Saturday
        const daysUntilSaturday = (6 - currentDay + 7) % 7 || 7;
        targetDate.setDate(now.getDate() + daysUntilSaturday);
      } else if (ds.includes("sunday")) {
        const currentDay = now.getDay();
        const daysUntilSunday = (7 - currentDay) % 7 || 7;
        targetDate.setDate(now.getDate() + daysUntilSunday);
      } else if (ds.includes("monday")) {
        const currentDay = now.getDay();
        const daysUntilMonday = (1 - currentDay + 7) % 7 || 7;
        targetDate.setDate(now.getDate() + daysUntilMonday);
      } else if (ds.includes("tuesday")) {
        const currentDay = now.getDay();
        const daysUntilTuesday = (2 - currentDay + 7) % 7 || 7;
        targetDate.setDate(now.getDate() + daysUntilTuesday);
      } else if (ds.includes("wednesday")) {
        const currentDay = now.getDay();
        const daysUntilWednesday = (3 - currentDay + 7) % 7 || 7;
        targetDate.setDate(now.getDate() + daysUntilWednesday);
      } else if (ds.includes("thursday")) {
        const currentDay = now.getDay();
        const daysUntilThursday = (4 - currentDay + 7) % 7 || 7;
        targetDate.setDate(now.getDate() + daysUntilThursday);
      } else if (ds.includes("friday") || ds === "next friday") {
        const currentDay = now.getDay();
        const daysUntilFriday = (5 - currentDay + 7) % 7 || 7;
        targetDate.setDate(now.getDate() + daysUntilFriday);
      } else if (ds.startsWith("in ") && ds.endsWith(" days")) {
        const match = ds.match(/in (\d+) days/);
        if (match) {
          const days = parseInt(match[1], 10);
          targetDate.setDate(now.getDate() + days);
        }
      } else {
        // Attempt standard Date parsing
        const parsed = Date.parse(dateStr);
        if (!isNaN(parsed)) {
          targetDate = new Date(parsed);
        } else {
          // Fallback: Default to next Saturday
          const currentDay = now.getDay();
          const daysUntilSaturday = (6 - currentDay + 7) % 7 || 7;
          targetDate.setDate(now.getDate() + daysUntilSaturday);
        }
      }

      // Parse time string (e.g. "6:30 PM", "1:00 PM", "9:00 PM")
      let hours = 19; // Default to 7:00 PM
      let minutes = 0;

      const timeMatch = ts.match(/(\d+):(\d+)\s*(am|pm)?/);
      if (timeMatch) {
        let hr = parseInt(timeMatch[1], 10);
        const min = parseInt(timeMatch[2], 10);
        const ampm = timeMatch[3];

        if (ampm === "pm" && hr < 12) {
          hr += 12;
        } else if (ampm === "am" && hr === 12) {
          hr = 0;
        }
        hours = hr;
        minutes = min;
      } else {
        const simpleHrMatch = ts.match(/(\d+)\s*(am|pm)/);
        if (simpleHrMatch) {
          let hr = parseInt(simpleHrMatch[1], 10);
          const ampm = simpleHrMatch[2];
          if (ampm === "pm" && hr < 12) {
            hr += 12;
          } else if (ampm === "am" && hr === 12) {
            hr = 0;
          }
          hours = hr;
        }
      }

      targetDate.setHours(hours, minutes, 0, 0);
      return targetDate;
    };

    const target = calculateTargetDate();

    const updateTimer = () => {
      const now = new Date();
      const diff = target.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: diff });
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / 1000 / 60) % 60);
        const seconds = Math.floor((diff / 1000) % 60);
        setTimeLeft({ days, hours, minutes, seconds, totalMs: diff });
      }
    };

    updateTimer();
    const intervalId = setInterval(updateTimer, 1000);

    return () => clearInterval(intervalId);
  }, [dateStr, timeStr]);

  if (!timeLeft) return null;

  const isPast = timeLeft.totalMs <= 0;

  // Render anticipation tag
  const getAnticipationText = () => {
    if (isPast) return "Happening Now / Completed! 🎉";
    if (timeLeft.days === 0 && timeLeft.hours < 4) return "Get ready! Starting very soon! 🎒";
    if (timeLeft.days === 0) return "Happening today! ✨";
    if (timeLeft.days === 1) return "Gathering tomorrow! ⏰";
    return "Anticipation building... 🗓️";
  };

  return (
    <div
      className={`p-3.5 rounded-xl border transition-all duration-300 ${
        isConfirmed
          ? "bg-neutral-950/80 border-orange-500/40 shadow-lg shadow-orange-950/20"
          : "bg-neutral-950/40 border-neutral-800/80"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <div className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isConfirmed ? "bg-emerald-400" : "bg-orange-400"
              }`}
            ></span>
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isConfirmed ? "bg-emerald-500" : "bg-orange-500"
              }`}
            ></span>
          </div>
          <span
            className={`text-[10px] font-mono tracking-wider uppercase font-bold ${
              isConfirmed ? "text-emerald-400" : "text-orange-400"
            }`}
          >
            {isConfirmed ? "🔥 Confirmed Outing Countdown" : "⏳ Planned Outing Countdown"}
          </span>
        </div>
        <span className="text-[9px] font-mono text-neutral-500 italic">
          {getAnticipationText()}
        </span>
      </div>

      {isPast ? (
        <div className="flex items-center gap-2 py-1 text-center text-xs font-semibold font-mono text-emerald-400 bg-emerald-950/20 border border-emerald-900/30 rounded-lg justify-center">
          <Sparkles className="w-3.5 h-3.5" />
          <span>The adventure is underway! Have an incredible time!</span>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-1.5 text-center pt-0.5">
          <div className="bg-neutral-900/90 border border-neutral-800/60 rounded-lg p-1.5 min-w-[50px]">
            <div className={`text-base font-black font-mono leading-none tracking-tight ${isConfirmed ? "text-white" : "text-neutral-300"}`}>
              {String(timeLeft.days).padStart(2, "0")}
            </div>
            <div className="text-[9px] text-neutral-500 uppercase font-mono mt-0.5 scale-90">Days</div>
          </div>

          <div className="bg-neutral-900/90 border border-neutral-800/60 rounded-lg p-1.5 min-w-[50px]">
            <div className={`text-base font-black font-mono leading-none tracking-tight ${isConfirmed ? "text-white" : "text-neutral-300"}`}>
              {String(timeLeft.hours).padStart(2, "0")}
            </div>
            <div className="text-[9px] text-neutral-500 uppercase font-mono mt-0.5 scale-90">Hours</div>
          </div>

          <div className="bg-neutral-900/90 border border-neutral-800/60 rounded-lg p-1.5 min-w-[50px]">
            <div className={`text-base font-black font-mono leading-none tracking-tight ${isConfirmed ? "text-white" : "text-neutral-300"}`}>
              {String(timeLeft.minutes).padStart(2, "0")}
            </div>
            <div className="text-[9px] text-neutral-500 uppercase font-mono mt-0.5 scale-90">Mins</div>
          </div>

          <div className="bg-neutral-900/90 border border-neutral-800/60 rounded-lg p-1.5 min-w-[50px]">
            <div className={`text-base font-black font-mono leading-none tracking-tight ${isConfirmed ? "text-emerald-400 animate-pulse" : "text-orange-400 animate-pulse"}`}>
              {String(timeLeft.seconds).padStart(2, "0")}
            </div>
            <div className="text-[9px] text-neutral-500 uppercase font-mono mt-0.5 scale-90">Secs</div>
          </div>
        </div>
      )}
    </div>
  );
}
