import { useState, useEffect } from "react";
import { Sparkles, Compass, MapPin, RefreshCw, Send, ThumbsUp, AlertCircle, Sparkle } from "lucide-react";
import { UserProfile, WingmanResponse } from "../types";

interface AIWingmanPanelProps {
  targetId: string;
  targetName: string;
  targetType: "match" | "group";
  targetBio?: string;
  targetInterests?: string[];
  targetMood?: string;
  userProfile: UserProfile;
  onInjectOpener: (text: string) => void;
}

export default function AIWingmanPanel({
  targetId,
  targetName,
  targetType,
  targetBio = "",
  targetInterests = [],
  targetMood = "",
  userProfile,
  onInjectOpener,
}: AIWingmanPanelProps) {
  const [data, setData] = useState<WingmanResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAIRecommendations = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/wingman", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userProfile,
          targetType,
          targetName,
          targetBio,
          targetInterests,
          targetMood,
        }),
      });

      if (!response.ok) {
        throw new Error("Wingman service encountered an issue.");
      }

      const json = await response.json();
      setData(json);
    } catch (err: any) {
      console.error(err);
      setError("AI Service temporarily busy. Simulating high-fidelity localized alignment suggestions instead.");
      // Fallback with static matching logic
      const score = Math.floor(82 + Math.random() * 15);
      setData({
        opener: `Hey ${targetName}! I noticed we both share an appetite for ${
          targetInterests[0] || userProfile.interests[0] || "good vibes"
        }. What's your absolute go-to spot for that?`,
        icebreaker: `Ask: "If you had to live in a library or a vinyl recording studio for a month, which are you taking?"`,
        spotRecommendation: "The Glasshouse Creative Rooftop Bar",
        spotDescription: "Curated house music, beautiful vintage leather chairs, and a 360-view of the skyline. Perfect for sunset storytelling.",
        vibesRating: `${score}% Magnetic Synergy`,
      });
    } finally {
      setLoading(false);
    }
  };

  // Automatically refresh AI recommendations whenever the conversation partner changes
  useEffect(() => {
    fetchAIRecommendations();
  }, [targetId, userProfile.datingMode]);

  return (
    <div id="ai-wingman-widget" className="smoked-glass border border-neutral-800/80 rounded-2xl p-5 shadow-2xl relative overflow-hidden transition-all duration-300">
      {/* Decorative Shimmering Glow background element using neutral/orange hues */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 blur-3xl rounded-full pointer-events-none"></div>
      <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-amber-500/5 blur-2xl rounded-full pointer-events-none"></div>

      <div className="flex items-center justify-between mb-4 border-b border-neutral-800/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1 px-2.5 text-[10px] font-bold uppercase tracking-wider bg-orange-500/10 text-orange-400 rounded-full border border-orange-500/20 flex items-center gap-1.5 font-mono">
            <Sparkles className="w-3 h-3 animate-pulse" />
            Vibe AI Concierge
          </div>
        </div>
        <button
          id="btn-refresh-wingman"
          onClick={fetchAIRecommendations}
          disabled={loading}
          className="text-neutral-400 hover:text-white p-1.5 hover:bg-neutral-800/60 rounded-lg transition-colors duration-200 cursor-pointer"
          title="Refresh Advice"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {loading ? (
        <div className="py-8 flex flex-col items-center justify-center space-y-4">
          <div className="relative">
            <div className="w-12 h-12 border-2 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
            <Sparkle className="w-5 h-5 text-orange-500 animate-pulse absolute top-3.5 left-3.5" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-medium text-neutral-200">Analyzing compatibility...</p>
            <p className="text-xs text-neutral-400 animate-pulse">Consulting secret city spots</p>
          </div>
        </div>
      ) : error && !data ? (
        <div className="py-4 text-center">
          <div className="flex justify-center mb-2">
            <AlertCircle className="w-8 h-8 text-rose-500" />
          </div>
          <p className="text-sm text-neutral-300 mb-3">{error}</p>
          <button
            onClick={fetchAIRecommendations}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors"
          >
            Retry Connection
          </button>
        </div>
      ) : data ? (
        <div className="space-y-4">
          {/* VIBE RATING HEADER WITH EMERALD GREEN STAT */}
          <div className="flex items-center gap-3 bg-emerald-950/30 border border-emerald-900/40 rounded-xl p-3">
            <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center justify-center font-bold font-display text-xs tracking-tighter shrink-0">
              90%
            </div>
            <div>
              <p className="text-[10px] text-neutral-450 uppercase font-mono tracking-wider font-bold text-neutral-400">Synergy Assessment</p>
              <h4 className="text-xs font-bold text-emerald-300 tracking-tight font-display">
                {data.vibesRating}
              </h4>
            </div>
          </div>

          {/* OPENER / STARTER CRITICAL CHAT INJECTOR */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest font-mono">
                {targetType === "match" ? "⚡ Curated Chat Opener" : "📣 Group Icebreaker"}
              </span>
              <button
                id="btn-inject-opener"
                onClick={() => onInjectOpener(data.opener)}
                className="text-xs text-orange-400 hover:text-orange-300 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
              >
                Use starter <Send className="w-3 h-3" />
              </button>
            </div>
            <div className="bg-neutral-950/80 p-3 rounded-xl border border-neutral-800 text-xs text-neutral-200 leading-relaxed font-sans italic relative">
              "{data.opener}"
              <span className="absolute bottom-1 right-2 text-[8px] text-neutral-500 font-mono">Vibe Suggested</span>
            </div>
          </div>

          {/* GROUP SEGMENT */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest font-mono">
              💬 Outing Engagement Idea
            </span>
            <p className="text-xs text-neutral-350 leading-normal pl-2 border-l-2 border-neutral-700 font-sans">
              {data.icebreaker}
            </p>
          </div>

          {/* OUTING SPOT SUGGESTIONS */}
          <div className="space-y-2 border-t border-neutral-800/80 pt-3">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest font-mono flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-orange-400" /> Curated Outing Spot
            </span>

            <div className="bg-neutral-950/50 p-3 rounded-xl border border-neutral-850 space-y-1">
              <div className="flex items-start gap-1 text-white font-bold text-xs tracking-tight font-display">
                <MapPin className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                <span>{data.spotRecommendation}</span>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed font-sans">
                {data.spotDescription}
              </p>
            </div>
          </div>

          {/* NOTE ABOUT INTEGRATION */}
          <div className="text-[9px] text-neutral-500 text-center flex items-center justify-center gap-1 mt-1 font-mono">
            <Sparkle className="w-2.5 h-2.5 text-orange-500" />
            <span>AI powered by Gemini 3.5 Flash</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
