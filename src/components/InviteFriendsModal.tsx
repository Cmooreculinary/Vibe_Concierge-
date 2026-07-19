import React, { useState } from "react";
import { X, Search, Check, Send, Users, Sparkles, AlertCircle } from "lucide-react";
import { MeetupEvent, MatchProfile } from "../types";

interface InviteFriendsModalProps {
  isOpen: boolean;
  onClose: () => void;
  meetup: MeetupEvent;
  matches: MatchProfile[];
  onInviteFriend: (meetupId: string, friend: MatchProfile) => void;
}

export default function InviteFriendsModal({
  isOpen,
  onClose,
  meetup,
  matches,
  onInviteFriend,
}: InviteFriendsModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [invitingState, setInvitingState] = useState<Record<string, "idle" | "sending" | "done">>({});

  if (!isOpen) return null;

  // Filter friends: We show matches. To make it highly playable, if they are alreadyMatched or if we show all available profiles
  const filteredFriends = matches.filter(friend => {
    const matchesSearch = friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          friend.mutualInterests.some(i => i.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  const handleInvite = (friend: MatchProfile) => {
    setInvitingState(prev => ({ ...prev, [friend.id]: "sending" }));
    
    // Simulate natural networking delay
    setTimeout(() => {
      onInviteFriend(meetup.id, friend);
      setInvitingState(prev => ({ ...prev, [friend.id]: "done" }));
    }, 850);
  };

  return (
    <div id="modal-invite-friends" className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="max-w-md w-full smoked-glass border border-neutral-800 rounded-3xl p-6 shadow-2xl relative space-y-4">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-neutral-800/80 pb-3">
          <div className="space-y-0.5">
            <h3 className="text-base font-bold font-display text-white flex items-center gap-1.5">
              <Users className="w-4 h-4 text-orange-400" />
              Invite Friends to Outing
            </h3>
            <p className="text-[10px] text-neutral-400 font-mono">
              Share the spark for: <span className="text-orange-300 font-semibold">{meetup.title}</span>
            </p>
          </div>
          <button
            id="btn-close-invite-modal"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-100 p-1 rounded-lg cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 flex items-center gap-2">
          <Search className="w-4 h-4 text-neutral-500" />
          <input
            type="text"
            placeholder="Search friends by name or mutual interest..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="bg-transparent border-none text-xs text-neutral-200 outline-none flex-1"
          />
        </div>

        {/* Friends List */}
        <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
          {filteredFriends.length > 0 ? (
            filteredFriends.map(friend => {
              const state = invitingState[friend.id] || "idle";
              const isAlreadyAttendee = meetup.attendeeAvatars.includes(friend.image);

              return (
                <div
                  key={friend.id}
                  className="bg-neutral-950/50 hover:bg-neutral-950/80 p-3 rounded-2xl border border-neutral-800/50 flex items-center justify-between transition-colors gap-3"
                >
                  {/* Friend Info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={friend.image}
                      alt={friend.name}
                      className="w-10 h-10 rounded-full object-cover border border-neutral-800 shrink-0"
                    />
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-bold text-white truncate">{friend.name}</h4>
                        <span className="text-[9px] text-neutral-500 font-mono">({friend.age})</span>
                        {friend.isMatched && (
                          <span className="text-[8px] uppercase tracking-wider bg-orange-950 text-orange-400 px-1 py-0.2 rounded border border-orange-900 font-bold">
                            Match
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-neutral-400 truncate font-mono">
                        {friend.distance} • {friend.location}
                      </p>
                      {/* Mutual Interests tag list */}
                      <div className="flex gap-1 overflow-hidden">
                        {friend.mutualInterests.slice(0, 2).map((interest, i) => (
                          <span
                            key={i}
                            className="text-[8px] bg-neutral-900 border border-neutral-800 text-neutral-400 px-1.5 py-0.5 rounded"
                          >
                            {interest}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div>
                    {isAlreadyAttendee || state === "done" ? (
                      <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-900 px-2.5 py-1.5 rounded-xl font-bold font-mono flex items-center gap-1 shrink-0">
                        <Check className="w-3.5 h-3.5" /> Invited
                      </span>
                    ) : (
                      <button
                        onClick={() => handleInvite(friend)}
                        disabled={state === "sending"}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                          state === "sending"
                            ? "bg-neutral-800 text-neutral-500"
                            : "bg-orange-600 hover:bg-orange-500 text-white shadow shadow-orange-950/40"
                        }`}
                      >
                        <Send className="w-3 h-3" />
                        {state === "sending" ? "Inviting..." : "Invite"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 bg-neutral-950/30 rounded-2xl border border-neutral-800 border-dashed">
              <AlertCircle className="w-5 h-5 text-neutral-500 mx-auto mb-1.5" />
              <p className="text-xs text-neutral-400 font-sans">No matches or friends fit that search.</p>
            </div>
          )}
        </div>

        {/* Tip Section */}
        <div className="bg-neutral-950/80 p-3 rounded-2xl border border-neutral-800/80 flex gap-2 text-[10px] text-neutral-400 leading-normal">
          <Sparkles className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
          <p>
            Inviting matches automatically shares a custom, stylish invite card inside their direct chat, increasing your connection velocity and breaking the ice instantly.
          </p>
        </div>
      </div>
    </div>
  );
}
