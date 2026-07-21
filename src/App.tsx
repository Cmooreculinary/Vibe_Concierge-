import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Sparkles,
  MapPin,
  Users,
  Heart,
  MessageSquare,
  Calendar,
  User,
  Plus,
  Check,
  ChevronRight,
  Send,
  X,
  Info,
  Compass,
  ArrowRight,
  Smile,
  Sliders,
  ChevronDown,
  Trash2,
  Bookmark,
  Share2,
  Grid,
  BarChart3,
  ShieldCheck,
  LockKeyhole,
  Radio,
  Settings2,
} from "lucide-react";
import { DEFAULT_PRIVACY_SETTINGS, DEFAULT_USER, INITIAL_MATCHES, INITIAL_GROUPS, INITIAL_MEETUPS } from "./data";
import { UserProfile, MatchProfile, Group, MeetupEvent, ChatMessage, PrivacySettingKey, PrivacySettings, WorkspaceTab } from "./types";
import AIWingmanPanel from "./components/AIWingmanPanel";
import MeetupCountdown from "./components/MeetupCountdown";
import MeetupCalendarView from "./components/MeetupCalendarView";
import MapPreviewModal from "./components/MapPreviewModal";
import InviteFriendsModal from "./components/InviteFriendsModal";
import PrivacyToggle from "./components/PrivacyToggle";

const loadPrivacySettings = (): PrivacySettings => {
  const saved = localStorage.getItem("vibe_privacy_settings");
  if (!saved) return DEFAULT_PRIVACY_SETTINGS;

  try {
    const parsed = JSON.parse(saved) as Partial<PrivacySettings>;
    const readBoolean = (key: PrivacySettingKey) =>
      typeof parsed[key] === "boolean" ? parsed[key] : DEFAULT_PRIVACY_SETTINGS[key];

    return {
      profileDiscoverable: readBoolean("profileDiscoverable"),
      shareLocation: readBoolean("shareLocation"),
      showOnlineStatus: readBoolean("showOnlineStatus"),
      allowDirectMessages: readBoolean("allowDirectMessages"),
      allowMeetupInvites: readBoolean("allowMeetupInvites"),
      shareProfileInCrews: readBoolean("shareProfileInCrews"),
      aiPersonalization: readBoolean("aiPersonalization"),
    };
  } catch (error) {
    console.error("Unable to read privacy settings", error);
    return DEFAULT_PRIVACY_SETTINGS;
  }
};

export default function App() {
  // --- Persistent LocalState ---
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem("vibe_user_profile");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return DEFAULT_USER;
  });

  const [matches, setMatches] = useState<MatchProfile[]>(() => {
    const saved = localStorage.getItem("vibe_matches");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_MATCHES;
  });

  const [groups, setGroups] = useState<Group[]>(() => {
    const saved = localStorage.getItem("vibe_groups");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_GROUPS;
  });

  const [meetups, setMeetups] = useState<MeetupEvent[]>(() => {
    const saved = localStorage.getItem("vibe_meetups");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_MEETUPS;
  });

  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>(loadPrivacySettings);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem("vibe_user_profile", JSON.stringify(userProfile));
  }, [userProfile]);

  useEffect(() => {
    localStorage.setItem("vibe_matches", JSON.stringify(matches));
  }, [matches]);

  useEffect(() => {
    localStorage.setItem("vibe_groups", JSON.stringify(groups));
  }, [groups]);

  useEffect(() => {
    localStorage.setItem("vibe_meetups", JSON.stringify(meetups));
  }, [meetups]);

  useEffect(() => {
    localStorage.setItem("vibe_privacy_settings", JSON.stringify(privacySettings));
  }, [privacySettings]);

  // --- UI / Onboarding & Navigation States ---
  const [onboarded, setOnboarded] = useState<boolean>(() => {
    return localStorage.getItem("vibe_onboarded") === "true";
  });
  const [onboardName, setOnboardName] = useState("");
  const [onboardEmail, setOnboardEmail] = useState("");
  const [currentTab, setCurrentTab] = useState<WorkspaceTab>(() => {
    const savedDestination = localStorage.getItem("vibe_last_workspace");
    return savedDestination === "roundtable" || savedDestination === "chats" || savedDestination === "profile"
      ? savedDestination
      : "dusk";
  });

  const navigateToWorkspace = (destination: WorkspaceTab) => {
    localStorage.setItem("vibe_last_workspace", destination);
    setCurrentTab(destination);
  };

  const handleOnboardSubmit = (name: string, email: string) => {
    setUserProfile(prev => ({ ...prev, name: name.trim() }));
    localStorage.setItem("vibe_onboarded", "true");
    localStorage.removeItem("vibe_onboard_email");
    sessionStorage.setItem("vibe_onboard_email", email.trim());
    localStorage.setItem("vibe_entry_mode", "member");
    setOnboarded(true);
  };

  const handleDirectEntry = (destination: WorkspaceTab) => {
    setUserProfile(prev => ({
      ...prev,
      name: prev.name === DEFAULT_USER.name ? "Guest Explorer" : prev.name,
    }));
    localStorage.setItem("vibe_onboarded", "true");
    localStorage.setItem("vibe_entry_mode", "guest");
    localStorage.removeItem("vibe_onboard_email");
    sessionStorage.removeItem("vibe_onboard_email");
    navigateToWorkspace(destination);
    setOnboarded(true);
  };

  const updatePrivacySetting = (setting: PrivacySettingKey, enabled: boolean) => {
    setPrivacySettings(prev => ({ ...prev, [setting]: enabled }));
  };

  const returnToGateway = () => {
    localStorage.removeItem("vibe_onboarded");
    setOnboarded(false);
  };
  const [roundtableSubTab, setRoundtableSubTab] = useState<"crews" | "outings">("crews");
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [mapZoom, setMapZoom] = useState<number>(1.0);
  const [searchRadius, setSearchRadius] = useState<number>(5.0);
  const [mapFilter, setMapFilter] = useState<"all" | "matches" | "crews">("all");
  const [hoveredNode, setHoveredNode] = useState<{ id: string; name: string; type: "match" | "crew"; x: number; y: number; detail?: string } | null>(null);
  const [activeChatId, setActiveChatId] = useState<string>("p-1"); // Elena chat default
  const [chatInput, setChatInput] = useState("");
  const [typingStates, setTypingStates] = useState<Record<string, boolean>>({});

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [hangoutViewMode, setHangoutViewMode] = useState<"grid" | "calendar">("grid");

  // Interaction Modals
  const [showMatchOverlay, setShowMatchOverlay] = useState<MatchProfile | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showWingmanSidebar, setShowWingmanSidebar] = useState(true);
  const [showPollModal, setShowPollModal] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  const [creatorRoleOverride, setCreatorRoleOverride] = useState<Record<string, boolean>>({});
  const [selectedMeetupForMap, setSelectedMeetupForMap] = useState<MeetupEvent | null>(null);
  const [selectedMeetupForInvite, setSelectedMeetupForInvite] = useState<MeetupEvent | null>(null);

  // New Outing Form data
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    date: "This Weekend",
    time: "7:00 PM",
    location: "",
    category: "adventure",
    type: "group" as "group" | "date" | "outing" | "party",
    image: "",
  });

  // Keep chat scrolled down
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(() => {
    scrollToBottom();
  }, [activeChatId, typingStates, matches, groups]);

  // Handle active status simulation
  const [simulatedOnlineUsers, setSimulatedOnlineUsers] = useState(138);
  useEffect(() => {
    const interval = setInterval(() => {
      setSimulatedOnlineUsers(prev => prev + (Math.random() > 0.5 ? 1 : -1));
    }, 12000);
    return () => clearInterval(interval);
  }, []);

  // Sync dating switch state
  const handleModeToggle = (datingActive: boolean) => {
    setUserProfile(prev => ({ ...prev, datingMode: datingActive }));
  };

  // --- Swiping and Swiping Mechanics ---
  const activeUnmatched = useMemo(() => {
    return matches.filter(m => !m.isMatched && m.isLiked !== false);
  }, [matches]);

  const activeMatchCard = useMemo(() => {
    if (selectedMatchId) {
      const found = matches.find(m => m.id === selectedMatchId && !m.isMatched && m.isLiked !== false);
      if (found) return found;
    }
    return activeUnmatched[0] || null;
  }, [selectedMatchId, activeUnmatched, matches]);

  const handleSwipeAction = (liked: boolean) => {
    if (!activeMatchCard) return;

    if (liked) {
      // Simulate an reciprocal match if positive like
      const tempCardId = activeMatchCard.id;
      setMatches(prev =>
        prev.map(m => (m.id === tempCardId ? { ...m, isMatched: true, isLiked: true } : m))
      );
      // Trigger elegant matching splash layout overlay
      setShowMatchOverlay(activeMatchCard);
    } else {
      // Pass card
      const tempCardId = activeMatchCard.id;
      setMatches(prev =>
        prev.map(m => (m.id === tempCardId ? { ...m, isLiked: false } : m))
      );
    }
    setSelectedMatchId(null); // Clear map-selected override on swipe so stack flows naturally
  };

  // Reseed matches if stack runs out
  const handleReseedMatches = () => {
    setMatches(INITIAL_MATCHES.map(m => ({ ...m, isMatched: false, isLiked: undefined })));
  };

  // --- Join/Leave Group Actions ---
  const handleGroupToggleJoin = (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;

    const currentlyJoined = group.isJoined;

    // Update status
    setGroups(prev =>
      prev.map(g => (g.id === groupId ? { ...g, isJoined: !currentlyJoined } : g))
    );

    // Update user record
    setUserProfile(prev => {
      const gList = currentlyJoined
        ? prev.joinedGroups.filter(id => id !== groupId)
        : [...prev.joinedGroups, groupId];
      return { ...prev, joinedGroups: gList };
    });

    // Auto-alert message in the group chat when user joins
    if (!currentlyJoined) {
      const welcomeMsg: ChatMessage = {
        id: `wel-${Date.now()}`,
        senderId: "system",
        senderName: "Vibe Butler",
        text: privacySettings.shareProfileInCrews
          ? `${userProfile.name} is now representing inside the crew! Give them a warm welcome. 👋`
          : "A private member joined the crew. Give them a warm welcome. 👋",
        timestamp: "Just now",
      };
      setGroups(prev =>
        prev.map(g => (g.id === groupId ? { ...g, messages: [...g.messages, welcomeMsg] } : g))
      );
    }
  };

  // --- RSVP Events Actions ---
  const handleEventRsvpToggle = (eventId: string) => {
    const event = meetups.find(m => m.id === eventId);
    if (!event) return;

    const joined = event.joined;

    setMeetups(prev =>
      prev.map(m => {
        if (m.id === eventId) {
          const countDiff = joined ? -1 : 1;
          const updatedAvatars = joined
            ? m.attendeeAvatars.filter(av => av !== userProfile.avatar)
            : [...m.attendeeAvatars, userProfile.avatar];
          return {
            ...m,
            joined: !joined,
            attendeesCount: Math.max(0, m.attendeesCount + countDiff),
            attendeeAvatars: updatedAvatars,
          };
        }
        return m;
      })
    );

    setUserProfile(prev => {
      const rList = joined
        ? prev.rsvpedMeetups.filter(id => id !== eventId)
        : [...prev.rsvpedMeetups, eventId];
      return { ...prev, rsvpedMeetups: rList };
    });
  };

  const handleInviteFriendToMeetup = (meetupId: string, friend: MatchProfile) => {
    // 1. Update meetup's attendee list
    setMeetups(prev =>
      prev.map(evt => {
        if (evt.id === meetupId) {
          const isAlreadyAttendee = evt.attendeeAvatars.includes(friend.image);
          if (isAlreadyAttendee) return evt;
          return {
            ...evt,
            attendeesCount: evt.attendeesCount + 1,
            attendeeAvatars: [...evt.attendeeAvatars, friend.image],
          };
        }
        return evt;
      })
    );

    // Also update any linked nextMeetup in groups if applicable
    setGroups(prev =>
      prev.map(g => {
        if (g.nextMeetup && g.nextMeetup.id === meetupId) {
          const alreadyRsvped = g.nextMeetup.memberRsvps.includes(friend.name);
          if (alreadyRsvped) return g;
          return {
            ...g,
            nextMeetup: {
              ...g.nextMeetup,
              memberRsvps: [...g.nextMeetup.memberRsvps, friend.name],
            },
          };
        }
        return g;
      })
    );

    // 2. Append simulated invite direct message from "user" to the friend's chat history
    const targetMeetup = meetups.find(m => m.id === meetupId);
    if (!targetMeetup) return;

    const inviteMsgText = `Hey! I just invited you to our upcoming meetup: **${targetMeetup.title}** on **${targetMeetup.date}** at **${targetMeetup.time}**! The location is **${targetMeetup.location}**. Let's go together! 🌌✨`;

    const inviteMsg: ChatMessage = {
      id: `msg-inv-${Date.now()}`,
      senderId: "user",
      senderName: userProfile.name,
      text: inviteMsgText,
      timestamp: "Just now",
    };

    setMatches(prev =>
      prev.map(m => {
        if (m.id === friend.id) {
          return {
            ...m,
            isMatched: true, // Auto-match to open communication if not already matched
            chatHistory: [...m.chatHistory, inviteMsg],
          };
        }
        return m;
      })
    );

    // 3. Trigger active friend response in 1.5 seconds!
    setTimeout(() => {
      const responseMsgText = `Oh wow, that looks like an amazing plan! 🌟 Count me in, I've just accepted the invitation. I can't wait to check out ${targetMeetup.location} together! Let me look at the map preview.`;
      const friendReply: ChatMessage = {
        id: `msg-rep-${Date.now()}`,
        senderId: friend.id,
        senderName: friend.name,
        text: responseMsgText,
        timestamp: "Just now",
      };

      setMatches(prev =>
        prev.map(m => {
          if (m.id === friend.id) {
            return {
              ...m,
              chatHistory: [...m.chatHistory, friendReply],
            };
          }
          return m;
        })
      );
    }, 2000);
  };

  // --- Host Custom Event ---
  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.location) return;

    const createdEvent: MeetupEvent = {
      id: `m-custom-${Date.now()}`,
      title: newEvent.title,
      description: newEvent.description || "A custom community-driven gathering scheduled via Vibe event coordinator.",
      date: newEvent.date,
      time: newEvent.time,
      location: newEvent.location,
      type: newEvent.type,
      category: newEvent.category,
      image: newEvent.image || "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=500&q=80",
      organizerId: "user",
      attendeesCount: 1,
      organizerName: privacySettings.shareProfileInCrews ? userProfile.name : "Private host",
      attendeeAvatars: privacySettings.shareProfileInCrews ? [userProfile.avatar] : [],
      joined: true,
    };

    setMeetups(prev => [createdEvent, ...prev]);

    // If it's linked to an active joined group, append a notification message inside that group as well
    const potentialCategoryGroup = groups.find(g => g.category === newEvent.category);
    if (potentialCategoryGroup && potentialCategoryGroup.isJoined) {
      const inviteMsg: ChatMessage = {
        id: `sys-inv-${Date.now()}`,
        senderId: "system",
        senderName: "Hangout Bot",
        text: `Hey squad! I just published a new meetup event: "${createdEvent.title}" for ${createdEvent.date} at ${createdEvent.time}. Let's RSVP and gather up! 🏔️`,
        timestamp: "Just now",
      };
      setGroups(prev =>
        prev.map(g => (g.id === potentialCategoryGroup.id ? { ...g, messages: [...g.messages, inviteMsg] } : g))
      );
    }

    // Reset Form & Close
    setNewEvent({
      title: "",
      description: "",
      date: "This Weekend",
      time: "7:00 PM",
      location: "",
      category: "adventure",
      type: "group",
      image: "",
    });
    setShowFormModal(false);
  };

  // --- Dynamic Messaging and Simulated Answers ---
  const handleSendMessage = () => {
    if (!chatInput.trim()) return;

    const messageText = chatInput;
    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: "user",
      senderName: userProfile.name,
      text: messageText,
      timestamp: "Just now",
    };

    setChatInput("");

    const isMatchChat = activeChatId.startsWith("p-");

    if (isMatchChat) {
      // Append user message to active Match profile
      setMatches(prev =>
        prev.map(m => {
          if (m.id === activeChatId) {
            return { ...m, chatHistory: [...m.chatHistory, newMessage] };
          }
          return m;
        })
      );

      // Trigger Simulated Persona Reply with typing indicator
      setTypingStates(prev => ({ ...prev, [activeChatId]: true }));

      setTimeout(() => {
        // Build customized answers based on persona
        const matchedUser = matches.find(m => m.id === activeChatId);
        let replyString = "That sounds fascinating! Tell me more. Let's arrange a meetup over coffees or check out some group plans in the Hangout Planner!";

        if (matchedUser) {
          if (matchedUser.name.includes("Elena")) {
            replyString = "I absolutely love that perspective! 🎨 We should definitely hit up a physical spot together. What do you think of the venue the Vibe AI Concierge recommended for us in the sidebar?";
          } else if (matchedUser.name.includes("Marcus")) {
            replyString = "Awesome trail! 🏔️ I'm totally planning to hike the Flatirons next weekend. Would you be down to join our Sunset Hiking Elite group and go as a group?";
          } else if (matchedUser.name.includes("Aria")) {
            replyString = "Perfect! Saturday evening is looking super cozy. I'll make sure to save a comfortable seat for you near the record decks. Can't wait! ☕🎧";
          } else if (matchedUser.name.includes("Devon")) {
            replyString = "Ramen boiling, spices crushed. You are officially on the dashi tasting duty! Grab your hungry stomach and let's conquer the kitchen studio.";
          }
        }

        const simulatedReply: ChatMessage = {
          id: `reply-${Date.now()}`,
          senderId: activeChatId,
          senderName: matchedUser ? matchedUser.name : "Vibe Mate",
          text: replyString,
          timestamp: "Just now",
        };

        setMatches(prev =>
          prev.map(m => {
            if (m.id === activeChatId) {
              return { ...m, chatHistory: [...m.chatHistory, simulatedReply] };
            }
            return m;
          })
        );
        setTypingStates(prev => ({ ...prev, [activeChatId]: false }));
      }, 1500);

    } else {
      // Append user message to active Group profile
      setGroups(prev =>
        prev.map(g => {
          if (g.id === activeChatId) {
            return { ...g, messages: [...g.messages, newMessage] };
          }
          return g;
        })
      );

      // Simulate active Group participants responding
      setTypingStates(prev => ({ ...prev, [activeChatId]: true }));

      setTimeout(() => {
        const activeGroup = groups.find(g => g.id === activeChatId);
        let groupReplyString = "Count me in! Let's schedule that ASAP. Everyone rsvp!";

        if (activeGroup) {
          if (activeGroup.id === "g-1") {
            groupReplyString = "Weather looks perfect for clear sky gazing tonight! Don't forget layers - peaks get breezy. 🌌";
          } else if (activeGroup.id === "g-3") {
            groupReplyString = "Sounds deliciosos! Prepping some custom seaweed crisps as a finishing garnish. See everybody at 1 PM!";
          }
        }

        const simulatedGroupReply: ChatMessage = {
          id: `reply-${Date.now()}`,
          senderId: "sim-member",
          senderName: activeGroup ? activeGroup.creator : "Crew Mate",
          text: groupReplyString,
          timestamp: "Just now",
        };

        setGroups(prev =>
          prev.map(g => {
            if (g.id === activeChatId) {
              return { ...g, messages: [...g.messages, simulatedGroupReply] };
            }
            return g;
          })
        );
        setTypingStates(prev => ({ ...prev, [activeChatId]: false }));
      }, 1500);
    }
  };

  // Callback to inject Wingman suggested icebreaker into the text input box
  const handleInjectOpener = (text: string) => {
    setChatInput(text);
  };

  // --- Group Poll Handlers ---
  const handleCreatePoll = (question: string, options: string[]) => {
    if (!question.trim()) return;
    const cleanOptions = options.filter(o => o.trim() !== "");
    if (cleanOptions.length < 2) return;

    const newPoll = {
      id: `poll-${Date.now()}`,
      question: question.trim(),
      options: cleanOptions.map((opt, idx) => ({
        id: `opt-${idx}-${Date.now()}`,
        text: opt.trim(),
        votes: [] as string[]
      })),
      creatorName: userProfile.name,
      isClosed: false
    };

    const pollMessage: ChatMessage = {
      id: `msg-poll-${Date.now()}`,
      senderId: "user",
      senderName: userProfile.name,
      text: `📊 Created a Poll: "${question.trim()}"`,
      timestamp: "Just now",
      poll: newPoll
    };

    setGroups(prev =>
      prev.map(g => {
        if (g.id === activeChatId) {
          return { ...g, messages: [...g.messages, pollMessage] };
        }
        return g;
      })
    );

    // Simulate other group members voting in real-time!
    setTimeout(() => {
      setGroups(prev =>
        prev.map(g => {
          if (g.id === activeChatId) {
            const updatedMessages = g.messages.map(msg => {
              if (msg.poll && msg.poll.id === newPoll.id) {
                // Find up to two random options to vote on
                const firstOptIdx = Math.floor(Math.random() * msg.poll.options.length);
                const secondOptIdx = Math.floor(Math.random() * msg.poll.options.length);
                
                // Get other members based on group or general roster
                const availableVoters = ["Devon Cruz", "Marcus Vane", "Elena Rostova", "Chloe Chen", "Aria Sterling", "Maya Lin"];
                const voter1 = availableVoters[Math.floor(Math.random() * availableVoters.length)];
                let voter2 = availableVoters[Math.floor(Math.random() * availableVoters.length)];
                while (voter2 === voter1) {
                  voter2 = availableVoters[Math.floor(Math.random() * availableVoters.length)];
                }

                const newOptions = msg.poll.options.map((opt, idx) => {
                  let votes = [...opt.votes];
                  if (idx === firstOptIdx && !votes.includes(voter1)) {
                    votes.push(voter1);
                  }
                  if (idx === secondOptIdx && !votes.includes(voter2)) {
                    votes.push(voter2);
                  }
                  return { ...opt, votes };
                });

                return {
                  ...msg,
                  poll: {
                    ...msg.poll,
                    options: newOptions
                  }
                };
              }
              return msg;
            });
            return { ...g, messages: updatedMessages };
          }
          return g;
        })
      );
    }, 1500);
  };

  const handleVotePoll = (messageId: string, optionId: string) => {
    setGroups(prev =>
      prev.map(g => {
        if (g.id === activeChatId) {
          const updatedMessages = g.messages.map(msg => {
            if (msg.id === messageId && msg.poll && !msg.poll.isClosed) {
              const updatedOptions = msg.poll.options.map(opt => {
                if (opt.id === optionId) {
                  const hasVoted = opt.votes.includes(userProfile.name);
                  const votes = hasVoted
                    ? opt.votes.filter(v => v !== userProfile.name)
                    : [...opt.votes, userProfile.name];
                  return { ...opt, votes };
                } else {
                  // Single choice voting (moves vote to the clicked option)
                  return {
                    ...opt,
                    votes: opt.votes.filter(v => v !== userProfile.name)
                  };
                }
              });
              return {
                ...msg,
                poll: {
                  ...msg.poll,
                  options: updatedOptions
                }
              };
            }
            return msg;
          });
          return { ...g, messages: updatedMessages };
        }
        return g;
      })
    );
  };

  const handleClosePoll = (messageId: string) => {
    setGroups(prev =>
      prev.map(g => {
        if (g.id === activeChatId) {
          const updatedMessages = g.messages.map(msg => {
            if (msg.id === messageId && msg.poll) {
              return {
                ...msg,
                poll: {
                  ...msg.poll,
                  isClosed: true
                }
              };
            }
            return msg;
          });
          return { ...g, messages: updatedMessages };
        }
        return g;
      })
    );
  };

  // --- Filtering computations ---
  const filteredGroups = useMemo(() => {
    return groups.filter(g => {
      const matchSearch = g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          g.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = selectedCategory === "all" || g.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [groups, searchQuery, selectedCategory]);

  const filteredMeetups = useMemo(() => {
    return meetups.filter(m => {
      const matchSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          m.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          m.location.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = selectedCategory === "all" || m.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [meetups, searchQuery, selectedCategory]);

  // Selected chat metadata lookup
  const activeChatMetadata = useMemo(() => {
    if (activeChatId.startsWith("p-")) {
      const matchProfile = matches.find(m => m.id === activeChatId);
      return matchProfile
        ? {
            id: matchProfile.id,
            name: matchProfile.name,
            type: "match" as const,
            bio: matchProfile.bio,
            interests: matchProfile.mutualInterests,
            mood: matchProfile.socialMood,
            avatar: matchProfile.image,
            location: matchProfile.location,
            score: matchProfile.compatibilityScore,
            history: matchProfile.chatHistory,
          }
        : null;
    } else {
      const groupProfile = groups.find(g => g.id === activeChatId);
      return groupProfile
        ? {
            id: groupProfile.id,
            name: groupProfile.name,
            type: "group" as const,
            bio: groupProfile.description,
            interests: [groupProfile.category],
            mood: "Collaborative",
            avatar: groupProfile.image,
            location: "Club Hub",
            score: 85,
            history: groupProfile.messages,
            creator: groupProfile.creator,
            category: groupProfile.category,
          }
        : null;
    }
  }, [activeChatId, matches, groups]);

  if (!onboarded) {
    return (
      <div className="min-h-screen bg-[#070707] text-neutral-100 flex flex-col items-center justify-center font-sans relative overflow-x-hidden overflow-y-auto px-4 py-8 pb-16 md:px-6 animate-fade-in">
        {/* Glow decoration */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-650/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-red-650/5 rounded-full blur-[100px] pointer-events-none"></div>

        {/* Landing Card */}
        <div className="max-w-lg w-full smoked-glass border border-neutral-800 rounded-3xl p-7 md:p-9 shadow-2xl relative z-10 space-y-7 text-center">
          <div className="space-y-3">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-orange-600 flex items-center justify-center font-black text-2xl text-white tracking-widest shadow-xl shadow-orange-950/20">
              V
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white font-display">
              VIBE <span className="text-orange-500">CONCIERGE</span>
            </h1>
            <p className="text-xs text-neutral-400 max-w-xs mx-auto font-sans leading-relaxed">
              Your elite, private gateway to local match coordinates and curated interest crews.
            </p>
          </div>

          {/* Three pillars overview */}
          <div className="grid grid-cols-3 gap-2.5 text-left border-y border-neutral-900 py-5">
            <div className="space-y-1 text-center">
              <span className="text-[10px] font-black tracking-widest text-orange-400 block uppercase font-mono">DUSK</span>
              <span className="text-[10px] text-neutral-400 leading-snug block font-sans">Location Hub & Radar</span>
            </div>
            <div className="space-y-1 text-center border-x border-neutral-900/60">
              <span className="text-[10px] font-black tracking-widest text-orange-400 block uppercase font-mono">ROUNDTABLE</span>
              <span className="text-[10px] text-neutral-400 leading-snug block font-sans">Interest Crews Meet</span>
            </div>
            <div className="space-y-1 text-center">
              <span className="text-[10px] font-black tracking-widest text-orange-400 block uppercase font-mono">VIBE</span>
              <span className="text-[10px] text-neutral-400 leading-snug block font-sans">Social Assistant Concierge</span>
            </div>
          </div>

          {/* Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (onboardName.trim() && onboardEmail.trim()) {
                handleOnboardSubmit(onboardName, onboardEmail);
              }
            }}
            className="space-y-4 text-left"
          >
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono tracking-widest text-neutral-400 uppercase pl-1">
                Your Handle / Name
              </label>
              <input
                type="text"
                placeholder="e.g. Alex"
                required
                value={onboardName}
                onChange={(e) => setOnboardName(e.target.value)}
                className="w-full bg-neutral-950/80 border border-neutral-850 focus:border-orange-500/60 rounded-xl px-4 py-3 text-xs text-white placeholder-neutral-500 outline-none transition-all font-sans"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono tracking-widest text-neutral-400 uppercase pl-1">
                Email Address
              </label>
              <input
                type="email"
                placeholder="e.g. alex@vibe.social"
                required
                value={onboardEmail}
                onChange={(e) => setOnboardEmail(e.target.value)}
                className="w-full bg-neutral-950/80 border border-neutral-850 focus:border-orange-500/60 rounded-xl px-4 py-3 text-xs text-white placeholder-neutral-500 outline-none transition-all font-sans"
              />
              <p className="pl-1 text-[9px] text-neutral-600">Kept only for this browser session.</p>
            </div>

            <div className="pt-2 space-y-3">
              <button
                type="submit"
                disabled={!onboardName.trim() || !onboardEmail.trim()}
                className="w-full py-3.5 bg-orange-600 hover:bg-orange-500 disabled:bg-neutral-900 disabled:text-neutral-500 disabled:border-neutral-850 text-white rounded-xl text-xs font-bold leading-none transition-all shadow-lg shadow-orange-900/10 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                <span>Initialize Gateway</span>
                <ChevronRight className="w-4 h-4" />
              </button>

            </div>
          </form>

          <div className="border-t border-neutral-800 pt-5 space-y-3 text-left">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-neutral-100">Skip setup</p>
                <p className="text-[10px] text-neutral-500">No name or email required. Choose where to land.</p>
              </div>
              <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-400" />
            </div>

            <button
              type="button"
              onClick={() => handleDirectEntry("dusk")}
              className="w-full py-3 bg-neutral-950 hover:bg-neutral-900 text-neutral-200 hover:text-white rounded-xl text-xs font-bold transition-colors border border-neutral-800 cursor-pointer flex items-center justify-between px-4"
            >
              <span>Enter Vibe Concierge now</span>
              <ArrowRight className="h-4 w-4 text-orange-400" />
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDirectEntry("dusk")}
                className="rounded-xl border border-neutral-800 bg-neutral-950/70 p-3 text-left transition-colors hover:border-orange-500/40 hover:bg-neutral-900"
              >
                <span className="block text-[10px] font-black tracking-widest text-orange-400">DUSK</span>
                <span className="mt-1 block text-[10px] text-neutral-500">Open match radar</span>
              </button>
              <button
                type="button"
                onClick={() => handleDirectEntry("roundtable")}
                className="rounded-xl border border-neutral-800 bg-neutral-950/70 p-3 text-left transition-colors hover:border-orange-500/40 hover:bg-neutral-900"
              >
                <span className="block text-[10px] font-black tracking-widest text-orange-400">ROUNDTABLE</span>
                <span className="mt-1 block text-[10px] text-neutral-500">Open crews & outings</span>
              </button>
            </div>

            <p className="flex items-center gap-1.5 text-[9px] leading-relaxed text-neutral-600">
              <LockKeyhole className="h-3 w-3 shrink-0" />
              Guest entry uses balanced local defaults. Change every control from My Profile.
            </p>
          </div>
        </div>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center">
          <p className="text-[9px] text-neutral-600 font-mono">
            VIBE SOCIAL SYSTEM v4.2 // LOCAL PRIVACY CONTROLS READY
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070707] text-neutral-100 flex flex-col font-sans transition-all duration-300 antialiased">
      
      {/* GLOWING HEADER */}
      <header className="sticky top-0 z-30 smoked-glass border-b border-neutral-800/60 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center font-bold tracking-widest text-[#f8fafc] font-display text-lg shadow-lg shadow-orange-550/25">
              V
            </div>
            <div
              className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-neutral-900 flex items-center justify-center ${
                privacySettings.showOnlineStatus ? "bg-emerald-500" : "bg-neutral-600"
              }`}
              title={privacySettings.showOnlineStatus ? "Online status visible" : "Online status hidden"}
            >
              <span className={`block w-1.5 h-1.5 bg-white rounded-full ${privacySettings.showOnlineStatus ? "animate-ping" : "opacity-60"}`}></span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-extrabold tracking-tight text-white text-xl">VIBE</span>
              <span className="text-xs font-semibold px-2 py-0.5 bg-neutral-900 rounded-lg text-neutral-300 font-mono">
                Dating & Group Meetups
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 font-mono flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              {simulatedOnlineUsers} elite singles & crews nearby
            </p>
          </div>
        </div>

        {/* BRAND CONVERGENCE HUD */}
        <div className="hidden md:flex items-center gap-4 text-xs font-mono font-black text-neutral-500">
          <span className={`transition-all ${currentTab === "dusk" ? "text-orange-400 scale-105" : "text-neutral-500"}`}>DUSK</span>
          <span>✦</span>
          <span className={`transition-all ${currentTab === "roundtable" ? "text-orange-400 scale-105" : "text-neutral-500"}`}>ROUNDTABLE</span>
          <span>✦</span>
          <span className="text-neutral-400 hover:text-orange-300 transition-colors flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
            VIBE CONCIERGE
          </span>
        </div>

        {/* USER UTILITY PREVIEW */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigateToWorkspace("profile")}
            className="flex items-center gap-2 text-left bg-neutral-950 p-2 rounded-xl border border-neutral-800/80 hover:bg-neutral-900 transition-all cursor-pointer"
          >
            <img
              src={userProfile.avatar}
              alt={userProfile.name}
              className="w-8 h-8 rounded-full object-cover border border-neutral-800"
            />
            <div className="hidden sm:block">
              <p className="text-xs font-bold text-neutral-100">{userProfile.name}</p>
              <p className="text-[10px] text-neutral-400 capitalize font-mono">
                {privacySettings.profileDiscoverable ? `${userProfile.socialMood} state` : "Private profile"}
              </p>
            </div>
          </button>
        </div>
      </header>

      {/* MOBILE-ONLY BRAND SWITCH PANEL */}
      <div className="md:hidden bg-[#121212] border-b border-neutral-850 p-2 flex justify-center gap-1.5">
        <button
          onClick={() => navigateToWorkspace("dusk")}
          className={`flex-1 py-2 text-center rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 ${
            currentTab === "dusk" ? "bg-orange-600 text-white font-extrabold" : "text-neutral-400"
          }`}
        >
          <MapPin className="w-4 h-4" />
          Dusk
        </button>
        <button
          onClick={() => navigateToWorkspace("roundtable")}
          className={`flex-1 py-2 text-center rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 ${
            currentTab === "roundtable" ? "bg-orange-600 text-white font-extrabold" : "text-neutral-400"
          }`}
        >
          <Users className="w-4 h-4" />
          Roundtable
        </button>
        <button
          onClick={() => navigateToWorkspace("chats")}
          className={`flex-1 py-2 text-center rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 ${
            currentTab === "chats" ? "bg-orange-600 text-white font-extrabold" : "text-neutral-400"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Chats
        </button>
      </div>

      {/* MAIN LAYOUT WRAPPER */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* VIEW COLUMN 1: NAVIGATION & PERSISTENCE INSIGHT CARD */}
        <section className="lg:col-span-1 space-y-4">
          
          {/* NAVIGATION BUTTONS */}
          <div className="smoked-glass rounded-2xl p-4 border border-neutral-800 space-y-1">
            <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-widest pl-3 mb-2 block">
              Workspaces
            </span>

            <button
              id="nav-btn-dusk"
              onClick={() => navigateToWorkspace("dusk")}
              className={`w-full text-left py-3 px-4 rounded-xl text-sm font-semibold flex items-center justify-between transition-all duration-200 cursor-pointer ${
                currentTab === "dusk"
                  ? "bg-neutral-800 text-white"
                  : "text-neutral-300 hover:bg-neutral-850/50 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <MapPin className={`w-4 h-4 ${currentTab === "dusk" ? "text-orange-400" : "text-neutral-400"}`} />
                <div className="flex flex-col">
                  <span className="font-bold">Dusk (Location)</span>
                  <span className="text-[10px] text-neutral-400 font-normal">Direct Matches & Map</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 opacity-55" />
            </button>

            <button
              id="nav-btn-roundtable"
              onClick={() => {
                navigateToWorkspace("roundtable");
              }}
              className={`w-full text-left py-3 px-4 rounded-xl text-sm font-semibold flex items-center justify-between transition-all duration-200 cursor-pointer ${
                currentTab === "roundtable"
                  ? "bg-neutral-800 text-white"
                  : "text-neutral-300 hover:bg-neutral-850/50 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users className={`w-4 h-4 ${currentTab === "roundtable" ? "text-orange-400" : "text-neutral-400"}`} />
                <div className="flex flex-col">
                  <span className="font-bold">Roundtable (Crews)</span>
                  <span className="text-[10px] text-neutral-400 font-normal">Interest groups meeting</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="bg-orange-950/20 text-orange-400 text-[10px] px-1.5 py-0.5 rounded border border-orange-900/30 font-mono font-bold">
                  {groups.length}
                </span>
                <ChevronRight className="w-4 h-4 opacity-55" />
              </div>
            </button>

            <button
              onClick={() => navigateToWorkspace("chats")}
              className={`w-full text-left py-3 px-4 rounded-xl text-sm font-semibold flex items-center justify-between transition-all duration-200 cursor-pointer ${
                currentTab === "chats"
                  ? "bg-neutral-800 text-white"
                  : "text-neutral-300 hover:bg-neutral-850/50 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <MessageSquare className={`w-4 h-4 ${currentTab === "chats" ? "text-orange-400" : "text-neutral-400"}`} />
                <span>Chats Hub</span>
              </div>
              <div className="flex gap-1 items-center">
                <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse"></span>
                <ChevronRight className="w-4 h-4 opacity-55" />
              </div>
            </button>

            <button
              onClick={() => navigateToWorkspace("profile")}
              className={`w-full text-left py-3 px-4 rounded-xl text-sm font-semibold flex items-center justify-between transition-all duration-200 cursor-pointer ${
                currentTab === "profile"
                  ? "bg-neutral-800 text-white"
                  : "text-neutral-300 hover:bg-neutral-850/50 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <User className={`w-4 h-4 ${currentTab === "profile" ? "text-orange-400" : "text-neutral-400"}`} />
                <span>My Profile</span>
              </div>
              <ChevronRight className="w-4 h-4 opacity-55" />
            </button>
          </div>

          {/* ACTIVE DISCOVER SUMMARY STAT BOX */}
          <div className="bg-[#121212]/40 rounded-2xl p-4 border border-neutral-800/80 text-xs text-neutral-400 space-y-3 font-sans">
            <h4 className="font-semibold text-neutral-300 flex items-center gap-1">
              <Sparkles className="w-4 h-4 text-orange-400" />
              Dynamic Networking Activity
            </h4>
            
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800/75">
                <p className="text-sm font-bold text-neutral-100 font-display">
                  {matches.filter(m => m.isMatched).length}
                </p>
                <p className="text-[10px] font-mono text-neutral-500">Connections</p>
              </div>
              <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800/75">
                <p className="text-sm font-bold text-neutral-100 font-display">
                  {userProfile.joinedGroups.length}
                </p>
                <p className="text-[10px] font-mono text-neutral-500">Joined Crews</p>
              </div>
            </div>

            <p className="leading-relaxed text-[11px] text-neutral-400 border-t border-neutral-800/40 pt-2 text-center">
              All interactions, registrations, and chats persistent to LocalStorage. Match up to initiate a live simulation.
            </p>
          </div>

        </section>

        {/* VIEW COLUMN 2-4: MAIN WORKSPACE INTERFACE */}
        <section id="vibe-workspace-body" className="lg:col-span-3 space-y-6">
          
          {/* TAB 1: DUSK LOCATION HUB */}
          {currentTab === "dusk" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black font-display text-white tracking-tight flex items-center gap-2">
                    <MapPin className="text-orange-500 w-6 h-6 animate-pulse p-0.5 bg-orange-500/10 rounded-lg" />
                    <span>Dusk Locational Radar</span>
                  </h1>
                  <p className="text-xs text-neutral-400">
                    Locating and matching high-fidelity singles based on exact real-time distance proximity.
                  </p>
                </div>
              </div>

              {/* DUSK LOCATION PANEL (Dual column layout: swiper on left, real-time map on right) */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
                
                {/* Left column: Swiper Card */}
                <div className="xl:col-span-5 flex flex-col items-center">
                  <div className="flex items-center justify-between w-full mb-2 px-1">
                    <span className="text-[10px] font-mono tracking-widest font-black uppercase text-orange-400">
                      ✦ Matchmaking Stack
                    </span>
                    <span className="text-[10px] font-mono text-neutral-500">
                      Active Cards
                    </span>
                  </div>
                  {activeMatchCard ? (
                    <div className="relative w-full smoked-glass border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl transition-all duration-300">
                      {/* Image Frame */}
                      <div className="relative h-96 w-full">
                        <img
                          src={activeMatchCard.image}
                          alt={activeMatchCard.name}
                          className="w-full h-full object-cover select-none pointer-events-none"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/20 to-transparent"></div>
                        
                        {/* Tags floating on image */}
                        <div className="absolute top-4 left-4 flex flex-wrap gap-1.5">
                          <span className="text-[10px] font-extrabold uppercase font-mono tracking-wider bg-neutral-950/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-neutral-800/80 text-emerald-400 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-orange-500" />
                            {activeMatchCard.distance}
                          </span>
                          <span className="text-[10px] font-extrabold uppercase font-mono tracking-wider bg-orange-950/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-orange-900/60 text-orange-300">
                            🔥 {activeMatchCard.compatibilityScore}% Compatibility
                          </span>
                        </div>
                      </div>

                      {/* Info Overlays */}
                      <div className="p-6 relative space-y-4">
                        <div className="flex items-baseline justify-between gap-2">
                          <h2 className="text-xl font-black font-display text-white tracking-tight">
                            {activeMatchCard.name}, <span className="text-orange-400">{activeMatchCard.age}</span>
                          </h2>
                          <span className="text-[10px] font-semibold bg-orange-950/30 text-orange-400 border border-orange-900/40 rounded-lg px-2 py-0.5">
                            {activeMatchCard.relationshipGoal}
                          </span>
                        </div>

                        <p className="text-xs text-neutral-400 font-mono flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                          {activeMatchCard.location}
                        </p>

                        <p className="text-sm text-neutral-200 leading-relaxed font-sans">
                          "{activeMatchCard.bio}"
                        </p>

                        {/* Mutual Hobbies */}
                        <div>
                          <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-widest mb-1.5">
                            My Shared Interests
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {activeMatchCard.mutualInterests.map(interest => (
                              <span
                                key={interest}
                                className="text-xs bg-neutral-950 text-neutral-300 px-3 py-1 rounded-full border border-neutral-800/80 flex items-center gap-1"
                              >
                                <span className="w-1.5 h-1.5 bg-orange-400 rounded-full"></span>
                                {interest}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Interactive Buttons Bar */}
                        <div className="flex items-center justify-center gap-4 pt-4 border-t border-neutral-800/80">
                          <button
                            id="btn-dating-swipe-pass"
                            onClick={() => handleSwipeAction(false)}
                            className="w-12 h-12 bg-neutral-950 hover:bg-neutral-850 text-neutral-400 hover:text-white rounded-full flex items-center justify-center border border-neutral-800 transition-all active:scale-95 shadow-lg group cursor-pointer"
                            title="Skip / Pass"
                          >
                            <X className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                          </button>
                          
                          <button
                            id="btn-dating-swipe-match"
                            onClick={() => handleSwipeAction(true)}
                            className="w-14 h-14 bg-gradient-to-r from-orange-500 to-orange-700 hover:from-orange-400 hover:to-orange-600 text-white rounded-full flex items-center justify-center transition-all duration-300 active:scale-90 shadow-xl hover:shadow-orange-500/25 cursor-pointer"
                            title="Excellent Match!"
                          >
                            <Heart className="w-6 h-6 fill-white/10" />
                          </button>
                        </div>

                      </div>
                    </div>
                  ) : (
                    <div className="w-full text-center py-12 px-6 bg-neutral-900 border border-neutral-800 rounded-3xl space-y-4">
                      <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto">
                        <Heart className="w-8 h-8 text-orange-500 opacity-60" />
                      </div>
                      <h3 className="text-lg font-bold text-white font-display">Stack Completed!</h3>
                      <p className="text-xs text-neutral-400 leading-normal font-sans">
                        You have successfully cycled through elite prospects nearby for this turn.
                      </p>
                      <button
                        onClick={handleReseedMatches}
                        className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 rounded-xl text-xs font-semibold tracking-wide shadow-md transition-colors font-mono cursor-pointer"
                      >
                        🔄 Refresh Connections
                      </button>
                    </div>
                  )}
                </div>

                {/* Right column: Interactive Map */}
                <div className="xl:col-span-7 flex flex-col space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-[10px] font-mono tracking-widest font-black uppercase text-orange-400 pl-1">
                      ✦ Dusk Radar (Location targets)
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-neutral-400 bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded font-mono">
                        Alex's Radius: {searchRadius} miles
                      </span>
                      <span className="text-[10px] text-neutral-400 bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded font-mono">
                        Zoom: {mapZoom.toFixed(1)}x
                      </span>
                    </div>
                  </div>

                  <div className="smoked-glass border border-neutral-800 rounded-3xl overflow-hidden p-4 flex-1 flex flex-col justify-between min-h-[450px] relative">
                    
                    {/* Map Header / Dashboard Controls */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 pb-3 border-b border-neutral-900 z-10">
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-bold font-display text-white">Live Vibe Radar Map</h4>
                        <p className="text-[10px] text-neutral-400 font-mono">Click singles or interest crew nodes to inspect</p>
                      </div>
                      
                      {/* Interactive map controls & filters */}
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Map Mode Tabs */}
                        <div className="flex bg-neutral-950 p-0.5 rounded-lg border border-neutral-800">
                          {(["all", "matches", "crews"] as const).map(f => (
                            <button
                              key={f}
                              onClick={() => setMapFilter(f)}
                              className={`px-2.5 py-1 rounded text-[10px] font-bold font-mono uppercase transition-colors cursor-pointer ${
                                mapFilter === f
                                  ? "bg-orange-600/20 text-orange-400 border border-orange-500/30"
                                  : "text-neutral-500 hover:text-neutral-300"
                              }`}
                            >
                              {f === "all" ? "All" : f === "matches" ? "Singles" : "Crews"}
                            </button>
                          ))}
                        </div>

                        {/* Search Radius Slider */}
                        <div className="flex items-center gap-2 bg-neutral-950 px-2.5 py-1 rounded-lg border border-neutral-800 text-[10px] font-mono text-neutral-400">
                          <Sliders className="w-3 h-3 text-orange-500 shrink-0" />
                          <span className="shrink-0">Range:</span>
                          <input
                            type="range"
                            min="1.0"
                            max="10.0"
                            step="0.5"
                            value={searchRadius}
                            onChange={(e) => setSearchRadius(parseFloat(e.target.value))}
                            className="w-16 accent-orange-500 h-1 bg-neutral-800 rounded-lg cursor-pointer"
                          />
                        </div>

                        {/* Zoom Action buttons */}
                        <div className="flex bg-neutral-950 rounded-lg border border-neutral-800 overflow-hidden">
                          <button
                            onClick={() => setMapZoom(prev => Math.min(2.5, prev + 0.2))}
                            className="p-1 hover:bg-neutral-800 text-neutral-300 border-r border-neutral-800 cursor-pointer w-6 text-center text-xs font-bold"
                            title="Zoom In"
                          >
                            +
                          </button>
                          <button
                            onClick={() => setMapZoom(prev => Math.max(1.0, prev - 0.2))}
                            className="p-1 hover:bg-neutral-800 text-neutral-300 border-r border-neutral-800 cursor-pointer w-6 text-center text-xs font-bold"
                            title="Zoom Out"
                          >
                            -
                          </button>
                          <button
                            onClick={() => {
                              setMapZoom(1.0);
                              setSearchRadius(5.0);
                              setSelectedMatchId(null);
                            }}
                            className="p-1 hover:bg-neutral-800 text-neutral-400 cursor-pointer w-7 text-[10px] font-mono"
                            title="Reset View"
                          >
                            Reset
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* SVG Mini Map Container */}
                    <div className="w-full flex-1 relative min-h-[300px] bg-[#070707] rounded-2xl overflow-hidden border border-neutral-900">
                      
                      <svg viewBox="0 0 800 500" className="w-full h-full select-none">
                        {/* Style injection for animations */}
                        <style>{`
                          @keyframes radar-sweep-embed {
                            from { transform: rotate(0deg); }
                            to { transform: rotate(360deg); }
                          }
                          .animate-radar-sweep-embed {
                            transform-origin: 220px 340px;
                            animation: radar-sweep-embed 10s linear infinite;
                          }
                          @keyframes pulse-ring-embed {
                            0% { r: 50px; opacity: 0.5; }
                            100% { r: 350px; opacity: 0; }
                          }
                          .animate-pulse-ring-embed {
                            transform-origin: 220px 340px;
                            animation: pulse-ring-embed 5s cubic-bezier(0.1, 0.4, 0.2, 1) infinite;
                          }
                          @keyframes dash-flow-embed {
                            to {
                              stroke-dashoffset: -20;
                            }
                          }
                          .animate-dash-flow-embed {
                            stroke-dasharray: 8, 4;
                            animation: dash-flow-embed 1.2s linear infinite;
                          }
                          .node-transition {
                            transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                          }
                        `}</style>

                        {/* Defs block */}
                        <defs>
                          <pattern id="grid-map-dusk-embed" width="30" height="30" patternUnits="userSpaceOnUse">
                            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#121212" strokeWidth="1" />
                          </pattern>
                          {/* Beautiful Neon Orange Glow filter */}
                          <filter id="radar-glow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="6" result="blur" />
                            <feMerge>
                              <feMergeNode in="blur" />
                              <feMergeNode in="SourceGraphic" />
                            </feMerge>
                          </filter>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid-map-dusk-embed)" />

                        {/* Outer Zoomable Layer */}
                        <g style={{ transform: `scale(${mapZoom})`, transformOrigin: '220px 340px' }} className="transition-transform duration-500">
                          
                          {/* Interactive Range Circle Limit visualization */}
                          <circle cx="220" cy="340" r={searchRadius * 60} fill="none" stroke="#f97316" strokeWidth="1" strokeDasharray="3,6" className="opacity-15" />
                          <text x="220" y={340 - (searchRadius * 60) - 5} fill="#f97316" fontSize="8" fontFamily="monospace" textAnchor="middle" className="opacity-30">
                            {searchRadius} MILE BOUNDARY
                          </text>

                          {/* Radar Scan Rings */}
                          <circle cx="220" cy="340" r="120" fill="none" stroke="#f97316" strokeWidth="0.5" strokeDasharray="4,4" className="opacity-20" />
                          <circle cx="220" cy="340" r="240" fill="none" stroke="#f97316" strokeWidth="0.5" strokeDasharray="4,4" className="opacity-10" />

                          {/* Live Sweeping Radar Scanner Overlay */}
                          <circle cx="220" cy="340" r="1" fill="none" className="animate-pulse-ring-embed" stroke="#f97316" strokeWidth="1" />
                          <line x1="220" y1="340" x2="220" y2="40" stroke="#f97316" strokeWidth="1.5" strokeOpacity="0.25" className="animate-radar-sweep-embed" />

                          {/* Connection Lines (Matches) */}
                          {(mapFilter === "all" || mapFilter === "matches") && matches.map(m => {
                            const coords = m.id === "p-1" ? { x: 310, y: 180 } :
                                           m.id === "p-2" ? { x: 480, y: 140 } :
                                           m.id === "p-3" ? { x: 180, y: 240 } :
                                           m.id === "p-4" ? { x: 560, y: 390 } :
                                           { x: 350, y: 420 };
                            const isActive = activeMatchCard && activeMatchCard.id === m.id;
                            const distanceVal = parseFloat(m.distance) || 2.0;
                            const isOutOfRange = distanceVal > searchRadius;

                            if (isOutOfRange) return null;

                            if (isActive) {
                              const controlX = (220 + coords.x) / 2 + 30;
                              const controlY = (340 + coords.y) / 2 - 30;
                              return (
                                <g key={`line-group-${m.id}`}>
                                  {/* Deep glow layer */}
                                  <path
                                    d={`M 220 340 Q ${controlX} ${controlY} ${coords.x} ${coords.y}`}
                                    fill="none"
                                    stroke="#ea580c"
                                    strokeWidth="5"
                                    strokeOpacity="0.6"
                                    filter="url(#radar-glow)"
                                    className="animate-pulse duration-1000"
                                  />
                                  {/* Secondary sharp line with running pulse */}
                                  <path
                                    d={`M 220 340 Q ${controlX} ${controlY} ${coords.x} ${coords.y}`}
                                    fill="none"
                                    stroke="#ffedd5"
                                    strokeWidth="2"
                                    className="animate-dash-flow-embed"
                                  />
                                  {/* Pulsing travel point mid-way */}
                                  <circle
                                    cx={(220 + coords.x) / 2 + 15}
                                    cy={(340 + coords.y) / 2 - 15}
                                    r="6"
                                    fill="#fff"
                                    className="animate-ping"
                                  />
                                  <circle
                                    cx={(220 + coords.x) / 2 + 15}
                                    cy={(340 + coords.y) / 2 - 15}
                                    r="3"
                                    fill="#f97316"
                                  />
                                </g>
                              );
                            }

                            return (
                              <line
                                key={`line-embed-${m.id}`}
                                x1="220"
                                y1="340"
                                x2={coords.x}
                                y2={coords.y}
                                stroke="#1e1b4b"
                                strokeWidth="0.75"
                                strokeDasharray="3,3"
                                className="opacity-40"
                              />
                            );
                          })}

                          {/* User Node */}
                          <g>
                            <circle cx="220" cy="340" r="16" fill="#ea580c" className="opacity-30 animate-ping" />
                            <circle cx="220" cy="340" r="9" fill="#ea580c" stroke="#fff" strokeWidth="2" />
                            <text x="220" y="368" fill="#fff" fontSize="10" fontWeight="bold" fontFamily="monospace" textAnchor="middle" className="tracking-wide">
                              Alex (You)
                            </text>
                          </g>

                          {/* Candidates/Singles Nodes */}
                          {(mapFilter === "all" || mapFilter === "matches") && matches.map(m => {
                            const coords = m.id === "p-1" ? { x: 310, y: 180 } :
                                           m.id === "p-2" ? { x: 480, y: 140 } :
                                           m.id === "p-3" ? { x: 180, y: 240 } :
                                           m.id === "p-4" ? { x: 560, y: 390 } :
                                           { x: 350, y: 420 };
                            const isActive = activeMatchCard && activeMatchCard.id === m.id;
                            const distanceVal = parseFloat(m.distance) || 2.0;
                            const isOutOfRange = distanceVal > searchRadius;

                            return (
                              <g
                                key={`pin-embed-${m.id}`}
                                className="cursor-pointer group"
                                onClick={() => {
                                  if (!isOutOfRange) {
                                    setSelectedMatchId(m.id);
                                  }
                                }}
                                onMouseEnter={() => {
                                  setHoveredNode({
                                    id: m.id,
                                    name: m.name,
                                    type: "match",
                                    x: coords.x,
                                    y: coords.y,
                                    detail: `${m.age} • ${m.location} (${m.distance})${isOutOfRange ? " • OUT OF RADIUS" : ""}`
                                  });
                                }}
                                onMouseLeave={() => setHoveredNode(null)}
                              >
                                {/* Glow ring around active candidate */}
                                {isActive && (
                                  <circle
                                    cx={coords.x}
                                    cy={coords.y}
                                    r="18"
                                    fill="#ea580c"
                                    className="opacity-30 animate-pulse"
                                  />
                                )}
                                <circle
                                  cx={coords.x}
                                  cy={coords.y}
                                  r={isActive ? "11" : "8"}
                                  fill={isOutOfRange ? "#262626" : (isActive ? "#ea580c" : "#0f172a")}
                                  stroke={isOutOfRange ? "#404040" : (isActive ? "#fff" : "#ea580c")}
                                  strokeWidth="1.5"
                                  className="node-transition hover:scale-125"
                                />
                                {/* Sparkly indicator dot for mutual interest match */}
                                {!isOutOfRange && (
                                  <circle
                                    cx={coords.x + 5}
                                    cy={coords.y - 5}
                                    r="2.5"
                                    fill="#10b981"
                                    className="animate-ping"
                                  />
                                )}
                                <text
                                  x={coords.x}
                                  y={coords.y - (isActive ? 18 : 14)}
                                  fill={isOutOfRange ? "#525252" : (isActive ? "#f97316" : "#a3a3a3")}
                                  fontSize="9"
                                  fontWeight={isActive ? "bold" : "normal"}
                                  fontFamily="monospace"
                                  textAnchor="middle"
                                >
                                  {m.name} {isOutOfRange ? "⚠️" : `(${m.distance.replace(" away", "")})`}
                                </text>
                              </g>
                            );
                          })}

                          {/* Curated Crew / Roundtable Nodes */}
                          {(mapFilter === "all" || mapFilter === "crews") && [
                            { id: "g-1", x: 130, y: 120, name: "Sunset Hiking Elite", emoji: "🏔️", cat: "Adventure" },
                            { id: "g-2", x: 390, y: 100, name: "Late Night Vinyl & Espresso", emoji: "🎧", cat: "Arts" },
                            { id: "g-3", x: 260, y: 280, name: "Gastronomy & Sunday Brunch", emoji: "🍲", cat: "Cuisine" },
                            { id: "g-4", x: 620, y: 200, name: "Modern Boardgamers & Cocktails", emoji: "🎲", cat: "Games" },
                            { id: "g-5", x: 500, y: 300, name: "Creative Think-Tank & Tonic", emoji: "💻", cat: "Tech" },
                          ].map(g => {
                            const isJoined = userProfile.joinedGroups.includes(g.id);
                            return (
                              <g
                                key={`crew-embed-${g.id}`}
                                className="cursor-pointer"
                                onClick={() => {
                                  setRoundtableSubTab("crews");
                                  navigateToWorkspace("roundtable");
                                  setActiveChatId(g.id); // jump directly to crew chat!
                                }}
                                onMouseEnter={() => {
                                  setHoveredNode({
                                    id: g.id,
                                    name: g.name,
                                    type: "crew",
                                    x: g.x,
                                    y: g.y,
                                    detail: `Crew type: ${g.cat} • ${isJoined ? "Representing Inside ✓" : "Click to Join Roundtable Chat"}`
                                  });
                                }}
                                onMouseLeave={() => setHoveredNode(null)}
                              >
                                {isJoined && (
                                  <rect
                                    x={g.x - 14}
                                    y={g.y - 14}
                                    width="28"
                                    height="28"
                                    rx="6"
                                    fill="none"
                                    stroke="#10b981"
                                    strokeWidth="1"
                                    className="opacity-40 animate-ping"
                                  />
                                )}
                                <rect
                                  x={g.x - 11}
                                  y={g.y - 11}
                                  width="22"
                                  height="22"
                                  rx="5"
                                  fill="#022c22"
                                  stroke={isJoined ? "#10b981" : "#059669"}
                                  strokeWidth="1.5"
                                  className="node-transition hover:rotate-12 hover:scale-125"
                                />
                                <text
                                  x={g.x}
                                  y={g.y + 4}
                                  fontSize="10"
                                  textAnchor="middle"
                                >
                                  {g.emoji}
                                </text>
                                <text
                                  x={g.x}
                                  y={g.y + 24}
                                  fill="#10b981"
                                  fontSize="8"
                                  fontFamily="monospace"
                                  fontWeight="bold"
                                  textAnchor="middle"
                                >
                                  {g.name.split(" ")[0]} Crew
                                </text>
                              </g>
                            );
                          })}

                        </g>
                      </svg>

                      {/* Absolute Hover Tooltip Card */}
                      {hoveredNode && (
                        <div
                          style={{
                            left: `${Math.min(75, Math.max(5, (hoveredNode.x / 800) * 100))}%`,
                            top: `${Math.min(75, Math.max(5, (hoveredNode.y / 500) * 100 - 15))}%`
                          }}
                          className="absolute z-30 smoked-glass border border-orange-500/40 p-2.5 rounded-xl text-[10px] text-neutral-200 pointer-events-none max-w-[200px] shadow-2xl transition-all duration-150 animate-fade-in"
                        >
                          <div className="flex items-center gap-1.5 font-bold text-white uppercase font-mono tracking-wide">
                            <span className={hoveredNode.type === "match" ? "text-orange-400" : "text-emerald-400"}>
                              {hoveredNode.type === "match" ? "✦ Single" : "👥 Crew"}
                            </span>
                            <span>•</span>
                            <span className="truncate">{hoveredNode.name}</span>
                          </div>
                          <p className="text-[9px] text-neutral-400 font-sans mt-1 leading-snug">
                            {hoveredNode.detail}
                          </p>
                          <p className="text-[8px] text-orange-500 font-mono mt-1 text-right">
                            {hoveredNode.type === "match" ? "Click to load stack ✓" : "Click to view chat ✓"}
                          </p>
                        </div>
                      )}

                      {/* Active Connection GPS route lock panel */}
                      {activeMatchCard && (
                        <div className="absolute bottom-4 right-4 z-10 smoked-glass p-3 rounded-2xl border border-orange-500/20 max-w-[220px] animate-fade-in text-xs">
                          <div className="flex items-center gap-1 text-orange-400 font-bold mb-1">
                            <Compass className="w-3.5 h-3.5 animate-spin-slow" />
                            <span>Telemetry Lock</span>
                          </div>
                          <p className="text-white font-bold">{activeMatchCard.name}</p>
                          <p className="text-[10px] text-neutral-400 font-mono mt-0.5 leading-relaxed">
                            Distance: {activeMatchCard.distance}<br/>
                            Est. Walk: ~{Math.round((parseFloat(activeMatchCard.distance) || 1.8) * 15)} mins<br/>
                            Compatibility: <span className="text-orange-400 font-bold">{activeMatchCard.compatibilityScore}%</span>
                          </p>
                        </div>
                      )}

                    </div>

                    {/* Distance footer */}
                    <div className="flex items-center justify-between gap-3 bg-neutral-950 p-3 rounded-2xl border border-neutral-900 mt-3 text-xs text-neutral-400">
                      <div className="flex items-center gap-2">
                        <Info className="w-4 h-4 text-orange-500 shrink-0" />
                        <p className="leading-snug">
                          {activeMatchCard
                            ? `Dusk located ${activeMatchCard.name} at ${activeMatchCard.location} (${activeMatchCard.distance}). Spark up a conversation to match coordinates.`
                            : "Dusk radar is sweeping nearby zones. Modify your preferences or click Refresh Connections to search again."}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: ROUNDTABLE CREW INTERFACE */}
          {currentTab === "roundtable" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800/40 pb-4">
                <div>
                  <h1 className="text-2xl font-black font-display text-white tracking-tight flex items-center gap-2">
                    <Users className="text-orange-500 w-6 h-6 p-0.5 bg-orange-500/10 rounded-lg" />
                    <span>Roundtable Crew Interface</span>
                  </h1>
                  <p className="text-xs text-neutral-400">
                    All of the interest crews meet at roundtable. Propose plans, vote, chat, and coordinate.
                  </p>
                </div>

                {/* SUB-TAB BAR (Crews vs Outings) */}
                <div className="flex bg-neutral-950 p-1 rounded-xl border border-neutral-850 shrink-0 self-start sm:self-auto">
                  <button
                    onClick={() => setRoundtableSubTab("crews")}
                    className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      roundtableSubTab === "crews"
                        ? "bg-neutral-800 text-orange-400 border border-neutral-700/80 shadow"
                        : "text-neutral-400 hover:text-neutral-200"
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    Interest Crews
                  </button>
                  <button
                    onClick={() => setRoundtableSubTab("outings")}
                    className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      roundtableSubTab === "outings"
                        ? "bg-neutral-800 text-orange-400 border border-neutral-700/80 shadow"
                        : "text-neutral-400 hover:text-neutral-200"
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    Outings & Hangouts
                  </button>
                </div>
              </div>

              {/* ROUNDTABLE CREW HUB SUB-TAB */}
              {roundtableSubTab === "crews" && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <span className="text-[10px] font-mono tracking-widest font-black uppercase text-orange-400 pl-1">
                      ✦ Curated Crews ({filteredGroups.length} available)
                    </span>

                    {/* CATEGORY SELECTOR PILLS */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                      {["all", "adventure", "cuisine", "arts", "games", "tech"].map(cat => (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-full capitalize transition-all duration-200 cursor-pointer ${
                            selectedCategory === cat
                              ? "bg-orange-600 text-white"
                              : "bg-neutral-900 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800"
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* SQUADS GRID */}
                  <div id="group-bento-grid" className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8">
                    {filteredGroups.length > 0 ? (
                      filteredGroups.map(group => {
                        const userIsJoined = group.isJoined;
                        return (
                          <div
                            key={group.id}
                            className="smoked-glass border border-neutral-800 rounded-2xl overflow-hidden shadow-xl flex flex-col justify-between transition-all duration-300 hover:border-neutral-700/80 hover:translate-y-[-2px]"
                          >
                            <div>
                              <div className="h-44 relative w-full">
                                <img
                                  src={group.image}
                                  alt={group.name}
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/20 to-transparent"></div>
                                <span className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider bg-neutral-950/80 backdrop-blur-md px-2.5 py-1 rounded-md border border-neutral-800 text-emerald-400">
                                  {group.category}
                                </span>
                              </div>

                              <div className="p-5 space-y-3">
                                <div className="flex justify-between items-start gap-1">
                                  <h3 className="text-lg font-black font-display text-white tracking-tight">
                                    {group.name}
                                  </h3>
                                </div>

                                <p className="text-xs text-neutral-350 leading-relaxed font-sans">
                                  {group.description}
                                </p>

                                <div className="flex items-center gap-4 text-[11px] text-neutral-400 border-t border-neutral-800/40 pt-3 font-mono">
                                  <span className="flex items-center gap-1">
                                    <Users className="w-3.5 h-3.5 text-orange-400" />
                                    {group.membersCount} crew members
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5 text-orange-400" />
                                    {group.meetsCount} meetups hosted
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="p-5 pt-0 flex gap-2">
                              <button
                                id={`btn-join-group-${group.id}`}
                                onClick={() => handleGroupToggleJoin(group.id)}
                                className={`flex-1 py-2 text-xs font-semibold rounded-xl text-center transition-all ${
                                  userIsJoined
                                    ? "bg-neutral-950 text-neutral-300 border border-neutral-800 hover:bg-neutral-900"
                                    : "bg-orange-600 hover:bg-orange-500 text-white shadow-md shadow-orange-950/15"
                                } cursor-pointer`}
                              >
                                {userIsJoined ? "Leave Crew" : "Join Crew"}
                              </button>
                              <button
                                id={`btn-viewgroupcheck-${group.id}`}
                                onClick={() => {
                                  if (!userIsJoined) {
                                    handleGroupToggleJoin(group.id);
                                  }
                                  setActiveChatId(group.id);
                                  navigateToWorkspace("chats");
                                }}
                                className="px-3 bg-neutral-950 hover:bg-neutral-850 text-neutral-300 rounded-xl border border-neutral-800/80 transition-colors flex items-center justify-center cursor-pointer"
                                title="Engage Crew Chat"
                              >
                                <MessageSquare className="w-4 h-4 text-orange-400" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="col-span-1 md:col-span-2 text-center py-12 smoked-glass border border-neutral-800 rounded-2xl">
                        <p className="text-sm text-neutral-400 font-sans">
                          No curated crews found in that category.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ROUNDTABLE OUTINGS / HANGOUTS SUB-TAB */}
              {roundtableSubTab === "outings" && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black font-display text-white tracking-tight flex items-center gap-2">
                    <Calendar className="text-orange-400 w-6 h-6 p-0.5 bg-orange-500/10 rounded-lg" />
                    <span>Hangout Planner</span>
                  </h1>
                  <p className="text-xs text-neutral-400">
                    RSVP to community group plans or propose your own hangout schedule to matched friends.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {/* View Mode Toggle: Grid vs Calendar */}
                  <div className="flex bg-neutral-950 p-1 rounded-xl border border-neutral-800 shrink-0">
                    <button
                      onClick={() => setHangoutViewMode("grid")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
                        hangoutViewMode === "grid"
                          ? "bg-neutral-800 text-orange-400 border border-neutral-700 shadow"
                          : "text-neutral-400 hover:text-neutral-200"
                      }`}
                    >
                      <Grid className="w-3.5 h-3.5" />
                      Grid
                    </button>
                    <button
                      onClick={() => setHangoutViewMode("calendar")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
                        hangoutViewMode === "calendar"
                          ? "bg-neutral-800 text-orange-400 border border-neutral-700 shadow"
                          : "text-neutral-400 hover:text-neutral-200"
                      }`}
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      Calendar
                    </button>
                  </div>

                  <button
                    onClick={() => setShowFormModal(true)}
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold leading-none shadow-lg shadow-orange-900/30 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Propose Outing
                  </button>
                </div>
              </div>

              {/* SEARCH BOX */}
              <div className="bg-neutral-900 border border-neutral-800/80 p-3 rounded-2xl flex items-center gap-3">
                <Compass className="w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search meetups by headline, location, or host..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none text-xs text-neutral-200 outline-none flex-1 max-w-sm"
                />
                <span className="text-[10px] text-neutral-500 font-mono hidden sm:inline">Press Outing badge to RSVP</span>
              </div>

              {hangoutViewMode === "grid" ? (
                /* MEETUP OUTINGS GRID */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredMeetups.length > 0 ? (
                    filteredMeetups.map(evt => {
                      return (
                        <div
                          key={evt.id}
                          className="smoked-glass border border-neutral-800 rounded-2xl overflow-hidden shadow-xl flex flex-col justify-between transition-all duration-300"
                        >
                          <div>
                            <div className="h-48 relative w-full">
                              <img
                                src={evt.image}
                                alt={evt.title}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/20 to-transparent"></div>
                              
                              <div className="absolute top-3 left-3 flex gap-1.5">
                                <span className="text-[9px] font-bold uppercase tracking-wider bg-orange-950/80 backdrop-blur-md px-2 py-0.5 rounded border border-orange-900 text-orange-300">
                                  {evt.type}
                                </span>
                                <span className="text-[9px] font-bold uppercase tracking-wider bg-neutral-950/80 backdrop-blur-md px-2 py-0.5 rounded border border-neutral-800 text-emerald-400">
                                  {evt.category}
                                </span>
                              </div>
                            </div>

                            <div className="p-5 space-y-3">
                              <div className="space-y-1">
                                <h3 className="text-base font-bold text-white leading-snug">
                                  {evt.title}
                                </h3>
                                <p className="text-xs text-neutral-400 font-mono flex items-center gap-1">
                                  <span className="text-neutral-300 font-semibold">{evt.date}</span> at {evt.time}
                                </p>
                                <p className="text-[11px] text-neutral-500 font-mono flex items-center gap-1 pt-0.5">
                                  <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                                  {evt.location}
                                </p>
                              </div>

                              <p className="text-xs text-neutral-300 leading-relaxed font-sans line-clamp-3">
                                {evt.description}
                              </p>

                              <MeetupCountdown
                                dateStr={evt.date}
                                timeStr={evt.time}
                                isConfirmed={evt.joined}
                              />

                              {/* Attendees previews stack */}
                              <div className="flex items-center justify-between border-t border-neutral-800/40 pt-3">
                                <span className="text-[10px] text-neutral-500 font-mono">Hosted by: {evt.organizerName}</span>
                                <div className="flex -space-x-2 overflow-hidden">
                                  {evt.attendeeAvatars.map((avUrl, idx) => (
                                    <img
                                      key={idx}
                                      src={avUrl}
                                      alt="Attendee"
                                      className="inline-block h-6 w-6 rounded-full ring-2 ring-neutral-900 object-cover"
                                    />
                                  ))}
                                  <span className="h-6 px-1.5 rounded-full bg-neutral-850 border border-neutral-800 text-[9px] font-mono text-neutral-300 leading-normal flex items-center shrink-0">
                                    +{evt.attendeesCount}
                                  </span>
                                </div>
                              </div>

                            </div>
                          </div>

                          <div className="p-5 pt-0 space-y-2.5">
                            <div className="flex gap-2">
                              <button
                                id={`btn-map-meetup-${evt.id}`}
                                onClick={() => setSelectedMeetupForMap(evt)}
                                className="flex-1 py-2 rounded-xl bg-neutral-950 hover:bg-neutral-900 text-[11px] font-bold text-neutral-300 border border-neutral-800 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <MapPin className="w-3.5 h-3.5 text-orange-400" />
                                View Map
                              </button>
                              <button
                                id={`btn-invite-meetup-${evt.id}`}
                                onClick={() => setSelectedMeetupForInvite(evt)}
                                className="flex-1 py-2 rounded-xl bg-neutral-950 hover:bg-neutral-900 text-[11px] font-bold text-neutral-300 border border-neutral-800 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <Users className="w-3.5 h-3.5 text-orange-400" />
                                Invite Friends
                              </button>
                            </div>

                            <button
                              id={`btn-join-meetup-${evt.id}`}
                              onClick={() => handleEventRsvpToggle(evt.id)}
                              className={`w-full py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all ${
                                evt.joined
                                  ? "bg-emerald-900/30 text-emerald-400 border border-emerald-800/50 hover:bg-emerald-950/40"
                                  : "bg-neutral-950 text-neutral-300 border border-neutral-800 hover:bg-neutral-900"
                              } flex items-center justify-center gap-1.5 cursor-pointer`}
                            >
                              {evt.joined ? (
                                <>
                                  <Check className="w-4 h-4" />
                                  Going (Agenda RSVPed)
                                </>
                              ) : (
                                "Join Outing"
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="col-span-1 md:col-span-2 text-center py-12 smoked-glass border border-neutral-800 rounded-2xl">
                      <p className="text-sm text-neutral-400 font-sans">
                        No curated upcoming plans fit this search filters. Feel free to schedule Yours!
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                /* INTERACTIVE CALENDAR & MASTER TIMELINE VIEW */
                <MeetupCalendarView
                  meetups={filteredMeetups}
                  onRsvpToggle={handleEventRsvpToggle}
                  searchQuery={searchQuery}
                />
              )}
            </div>
          )}
        </div>
      )}

          {/* TAB 3: CHATS HUB */}
          {currentTab === "chats" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in items-stretch min-h-[580px]">
              
              {/* CHATS SIDEBAR (LEFT) */}
              <div className="md:col-span-1 smoked-glass border border-neutral-800 rounded-2xl p-4 flex flex-col space-y-4">
                <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-widest pl-1">
                  Conversations
                </span>

                <div className="space-y-1.5 overflow-y-auto flex-1 max-h-[500px]">
                  
                  {/* DIRECT MATCHES SECTION */}
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest pl-1 block mb-1">
                      Direct Matches
                    </span>
                    {matches.filter(m => m.isMatched).map(m => (
                      <button
                        key={m.id}
                        id={`chat-item-${m.id}`}
                        onClick={() => setActiveChatId(m.id)}
                        className={`w-full p-2.5 rounded-xl text-left flex items-center gap-3 transition-colors cursor-pointer ${
                          activeChatId === m.id
                            ? "bg-neutral-800 border-neutral-700/80"
                            : "hover:bg-neutral-850/60 bg-neutral-950/20 border border-neutral-850/20"
                        }`}
                      >
                        <img
                          src={m.image}
                          alt={m.name}
                          className="w-10 h-10 rounded-full object-cover shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-neutral-100 truncate">{m.name}</p>
                          <p className="text-[10px] text-neutral-400 truncate">
                            {m.chatHistory.length > 0
                              ? m.chatHistory[m.chatHistory.length - 1].text
                              : "New match! Let's say hi."}
                          </p>
                        </div>
                        {typingStates[m.id] && (
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse"></span>
                        )}
                      </button>
                    ))}
                    {matches.filter(m => m.isMatched).length === 0 && (
                      <p className="text-[10pt] text-neutral-500 italic pl-2 py-1 font-sans">
                        No matches yet. Go to Discover to swipe!
                      </p>
                    )}
                  </div>

                  {/* JOINED GROUPS CONVOCAS */}
                  <div className="space-y-1 pt-3 border-t border-neutral-800/40">
                    <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest pl-1 block mb-1">
                      My Group Crews
                    </span>
                    {groups.filter(g => g.isJoined).map(g => (
                      <button
                        key={g.id}
                        id={`chat-item-${g.id}`}
                        onClick={() => setActiveChatId(g.id)}
                        className={`w-full p-2.5 rounded-xl text-left flex items-center gap-3 transition-colors cursor-pointer ${
                          activeChatId === g.id
                            ? "bg-neutral-800 border-neutral-700/80"
                            : "hover:bg-neutral-850/60 bg-neutral-950/20 border border-neutral-850/20"
                        }`}
                      >
                        <img
                          src={g.image}
                          alt={g.name}
                          className="w-10 h-10 rounded-full object-cover shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-neutral-100 truncate">{g.name}</p>
                          <p className="text-[10px] text-neutral-400 truncate">
                            {g.messages.length > 0
                              ? g.messages[g.messages.length - 1].text
                              : "Assemble & meet up!"}
                          </p>
                        </div>
                        {typingStates[g.id] && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        )}
                      </button>
                    ))}
                  </div>

                </div>
              </div>

              {/* ACTIVE CHAT SCREEN + WINGMAN ASSISTANT (RIGHT) */}
              <div className="md:col-span-2 flex flex-col lg:flex-row gap-4 items-stretch">
                
                {/* ACTIVE CHAT WINDOW */}
                <div className="flex-1 smoked-glass border border-neutral-800 rounded-2xl flex flex-col justify-between overflow-hidden">
                  
                  {/* Top bar details */}
                  {activeChatMetadata ? (
                    <div className="p-4 bg-neutral-950/40 border-b border-neutral-800/80 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src={activeChatMetadata.avatar}
                          alt={activeChatMetadata.name}
                          className="w-9 h-9 rounded-full object-cover"
                        />
                        <div>
                          <h3 className="text-xs font-bold text-neutral-100">{activeChatMetadata.name}</h3>
                          <p className="text-[10px] text-neutral-400 font-mono">
                            {activeChatMetadata.type === "match" ? activeChatMetadata.location : "Club Activity Room"}
                          </p>
                        </div>
                      </div>

                      {/* Side wingman button tracker & Poll controls */}
                      <div className="flex items-center gap-2">
                        {activeChatMetadata.type === "group" && (
                          <>
                            <button
                              onClick={() => setCreatorRoleOverride(prev => ({
                                ...prev,
                                [activeChatId]: !prev[activeChatId]
                              }))}
                              className={`text-[10px] px-2.5 py-1 rounded-lg font-mono font-bold flex items-center gap-1 border transition-all cursor-pointer ${
                                creatorRoleOverride[activeChatId]
                                  ? "bg-orange-500/15 text-orange-300 border-orange-500/30"
                                  : "bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-neutral-300"
                              }`}
                              title="Toggle simulated creator permissions"
                            >
                              👑 {creatorRoleOverride[activeChatId] ? "Creator View" : "Member View"}
                            </button>

                            {creatorRoleOverride[activeChatId] && (
                              <button
                                onClick={() => {
                                  setPollQuestion("");
                                  setPollOptions(["", ""]);
                                  setShowPollModal(true);
                                }}
                                className="bg-orange-600 hover:bg-orange-500 text-white text-[11px] px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                              >
                                <BarChart3 className="w-3.5 h-3.5" />
                                <span>Create Poll</span>
                              </button>
                            )}
                          </>
                        )}

                        <button
                          onClick={() => setShowWingmanSidebar(prev => !prev)}
                          disabled={!privacySettings.aiPersonalization}
                          title={privacySettings.aiPersonalization ? "Toggle AI advice" : "Enable AI personalization in My Profile"}
                          className={`text-xs px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 transition-all ${
                            !privacySettings.aiPersonalization
                              ? "bg-neutral-950 text-neutral-600 border border-neutral-850 cursor-not-allowed"
                              : showWingmanSidebar
                              ? "bg-orange-950/20 text-orange-400 border border-orange-900/40"
                              : "bg-neutral-950 hover:bg-neutral-900 text-neutral-400 cursor-pointer"
                          }`}
                        >
                          <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                          <span className="hidden sm:inline">AI Advice</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-neutral-950/40 border-b border-neutral-800/80 text-center text-xs text-neutral-400">
                      No conversation selected.
                    </div>
                  )}

                  {/* Message scroll panel */}
                  <div className="flex-1 p-4 overflow-y-auto space-y-4 max-h-[380px] min-h-[280px]">
                    {activeChatMetadata ? (
                      activeChatMetadata.history.map(msg => {
                        const isMe = msg.senderId === "user";
                        const isSys = msg.senderId === "system";
                        return (
                          <div
                            key={msg.id}
                            className={`flex ${isMe ? "justify-end" : isSys ? "justify-center" : "justify-start"}`}
                          >
                            {isSys ? (
                              <div className="bg-neutral-950/40 text-neutral-400 text-[10px] py-1 px-3.5 rounded-full border border-neutral-800/80 font-mono text-center">
                                {msg.text}
                              </div>
                            ) : (
                              <div className="space-y-1 max-w-[85%] sm:max-w-[80%]">
                                <span className={`block text-[9px] font-mono text-neutral-500 ${isMe ? "text-right" : ""}`}>
                                  {msg.senderName} • {msg.timestamp}
                                </span>
                                <div
                                  className={`rounded-2xl p-3 text-xs leading-normal font-sans ${
                                    msg.poll
                                      ? "bg-neutral-950 border border-neutral-800 text-neutral-100 rounded-xl shadow-xl shadow-black/40"
                                      : isMe
                                        ? "bg-orange-600 text-white rounded-tr-none"
                                        : "bg-neutral-900 border border-neutral-800/80 text-neutral-200 rounded-tl-none"
                                  }`}
                                >
                                  {msg.poll ? (
                                    <div className="space-y-3.5 min-w-[240px] sm:min-w-[320px]">
                                      <div className="flex items-start justify-between gap-2 border-b border-neutral-800/80 pb-2">
                                        <div className="space-y-0.5">
                                          <span className="text-[9px] uppercase font-mono tracking-widest text-orange-450 text-orange-400 font-bold">
                                            Group Poll
                                          </span>
                                          <h4 className="text-xs sm:text-sm font-extrabold text-neutral-100 leading-snug">
                                            {msg.poll.question}
                                          </h4>
                                        </div>
                                        {msg.poll.isClosed ? (
                                          <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-red-950/40 text-red-400 border border-red-900/40 shrink-0">
                                            Closed
                                          </span>
                                        ) : (
                                          <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-900/40 shrink-0 animate-pulse font-semibold">
                                            Active
                                          </span>
                                        )}
                                      </div>

                                      <div className="space-y-2.5">
                                        {msg.poll.options.map(opt => {
                                          const totalVotes = msg.poll!.options.reduce((sum, o) => sum + o.votes.length, 0);
                                          const percentage = totalVotes > 0 ? Math.round((opt.votes.length / totalVotes) * 100) : 0;
                                          const isVotedByMe = opt.votes.includes(userProfile.name);

                                          return (
                                            <button
                                              key={opt.id}
                                              disabled={msg.poll!.isClosed}
                                              onClick={() => handleVotePoll(msg.id, opt.id)}
                                              className={`w-full text-left p-2.5 rounded-xl border relative overflow-hidden transition-all duration-200 group/opt cursor-pointer ${
                                                msg.poll!.isClosed
                                                  ? "bg-neutral-950/40 border-neutral-900/80"
                                                  : isVotedByMe
                                                    ? "bg-orange-950/30 border-orange-500/55 hover:bg-orange-950/40"
                                                    : "bg-neutral-900/80 border-neutral-800 hover:bg-neutral-850 hover:border-neutral-700"
                                              }`}
                                            >
                                              {/* Progress bar background fill */}
                                              <div
                                                className={`absolute inset-y-0 left-0 transition-all duration-500 ease-out pointer-events-none opacity-20 ${
                                                  isVotedByMe
                                                    ? "bg-orange-500"
                                                    : "bg-emerald-500"
                                                }`}
                                                style={{ width: `${percentage}%` }}
                                              ></div>

                                              <div className="relative z-10 flex items-center justify-between gap-4">
                                                <div className="flex items-center gap-2 min-w-0">
                                                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                                                    isVotedByMe
                                                      ? "bg-orange-600 border-orange-500 text-white"
                                                      : "border-neutral-700 text-transparent"
                                                  }`}>
                                                    <Check className="w-2.5 h-2.5 stroke-[3px]" />
                                                  </div>
                                                  <span className={`text-xs font-semibold truncate ${
                                                    isVotedByMe ? "text-orange-300 font-bold" : "text-neutral-200"
                                                  }`}>
                                                    {opt.text}
                                                  </span>
                                                </div>
                                                <div className="flex items-baseline gap-1 shrink-0">
                                                  <span className="text-xs font-bold font-mono text-neutral-100">{percentage}%</span>
                                                  <span className="text-[9px] font-mono text-neutral-500">({opt.votes.length})</span>
                                                </div>
                                              </div>

                                              {/* Voters list indicator */}
                                              {opt.votes.length > 0 && (
                                                <p className="text-[10px] text-neutral-400 font-mono pl-6 pt-1 relative z-10 truncate">
                                                  Voters: {opt.votes.join(", ")}
                                                </p>
                                              )}
                                            </button>
                                          );
                                        })}
                                      </div>

                                      <div className="flex items-center justify-between border-t border-neutral-800/60 pt-2.5 text-[9px] text-neutral-500 font-mono">
                                        <span>
                                          Total: {msg.poll.options.reduce((sum, o) => sum + o.votes.length, 0)} votes
                                        </span>
                                        <div className="flex items-center gap-2">
                                          {creatorRoleOverride[activeChatId] && !msg.poll.isClosed && (
                                            <button
                                              onClick={() => handleClosePoll(msg.id)}
                                              className="px-2 py-0.5 rounded bg-red-950/55 hover:bg-red-900 border border-red-900/40 text-red-300 transition-colors cursor-pointer font-bold"
                                            >
                                              🔒 Close Poll
                                            </button>
                                          )}
                                          <span>By {msg.poll.creatorName}</span>
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    msg.text
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-center text-neutral-500 py-12">Choose a convo from the list</p>
                    )}

                    {/* Animated Typing Indicator */}
                    {activeChatMetadata && typingStates[activeChatMetadata.id] && (
                      <div className="flex justify-start">
                        <div className="space-y-1">
                          <span className="block text-[9px] font-mono text-neutral-500">
                            {activeChatMetadata.name} is drafting...
                          </span>
                          <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-850/50 flex gap-1">
                            <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce"></span>
                            <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                            <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef}></div>
                  </div>

                  {/* Input Box Actions */}
                  {activeChatMetadata ? (
                    <div className="p-3 bg-neutral-950 border-t border-neutral-800 flex gap-2">
                      <input
                        type="text"
                        placeholder={`Draft message to ${activeChatMetadata.name}...`}
                        value={chatInput}
                        onChange={e => setChatInput(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleSendMessage()}
                        className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-neutral-200 focus:outline-none focus:border-orange-500"
                      />
                      <button
                        id="btn-chats-sendmsg"
                        onClick={handleSendMessage}
                        className="bg-orange-600 hover:bg-orange-500 text-white p-2.5 rounded-xl items-center justify-center flex cursor-pointer"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  ) : null}

                </div>

                {/* AI WINGMAN SIDEBAR WRAP */}
                {privacySettings.aiPersonalization && showWingmanSidebar && activeChatMetadata && (
                  <div className="w-full lg:w-72 shrink-0">
                    <AIWingmanPanel
                      targetId={activeChatMetadata.id}
                      targetName={activeChatMetadata.name}
                      targetType={activeChatMetadata.type}
                      targetBio={activeChatMetadata.bio}
                      targetMood={activeChatMetadata.mood}
                      userProfile={userProfile}
                      onInjectOpener={handleInjectOpener}
                    />
                  </div>
                )}

              </div>

            </div>
          )}

          {/* TAB 4: USER CONTROL PROFILE */}
          {currentTab === "profile" && (
            <div className="smoked-glass border border-neutral-800 rounded-2xl p-6 md:p-8 space-y-8 animate-fade-in">
              <div className="flex flex-col sm:flex-row items-center gap-5 border-b border-neutral-800/80 pb-6">
                <img
                  src={userProfile.avatar}
                  alt={userProfile.name}
                  className="w-20 h-20 rounded-2xl object-cover ring-4 ring-neutral-800 shadow"
                />
                <div className="text-center sm:text-left space-y-1">
                  <h2 className="text-xl font-bold text-white font-display">{userProfile.name}, {userProfile.age}</h2>
                  <p className="text-xs text-neutral-400 font-mono">
                    Location: {userProfile.location} • {privacySettings.shareLocation ? "visible" : "hidden from members"}
                  </p>
                  
                  {/* Status pills selector */}
                  <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start pt-1">
                    {["curious", "chill", "adventurous", "deep-convo"].map(mood => (
                      <button
                        key={mood}
                        onClick={() =>
                          setUserProfile(prev => ({ ...prev, socialMood: mood as any }))
                        }
                        className={`text-[9px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-md border transition-all cursor-pointer ${
                          userProfile.socialMood === mood
                            ? "bg-emerald-900/30 text-emerald-400 border-emerald-500/40"
                            : "bg-neutral-950 text-neutral-500 border-neutral-800 hover:text-neutral-300"
                        }`}
                      >
                        {mood} State
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* SETTINGS FIELDS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* BIO */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                    My Custom Persona Biography
                  </label>
                  <textarea
                    rows={3}
                    value={userProfile.bio}
                    onChange={e => setUserProfile(prev => ({ ...prev, bio: e.target.value }))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-neutral-200 outline-none focus:border-orange-500"
                  />
                </div>

                {/* DATING PREFERENCE */}
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block">
                      Target Seeking Scope
                    </label>
                    <select
                      value={userProfile.seekingGender}
                      onChange={e => setUserProfile(prev => ({ ...prev, seekingGender: e.target.value }))}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-neutral-200 outline-none focus:border-orange-500"
                    >
                      <option value="Everyone">Everyone Nearby</option>
                      <option value="Females">Females</option>
                      <option value="Males">Males</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between bg-neutral-950 p-3 rounded-xl border border-neutral-800">
                    <div>
                      <h4 className="text-xs font-semibold text-neutral-200 uppercase tracking-tighter">Hook Dating Matcher</h4>
                      <p className="text-[10px] text-neutral-500 font-sans">Toggle dating stack vs team group stack</p>
                    </div>
                    {/* Switch layout */}
                    <button
                      onClick={() => handleModeToggle(!userProfile.datingMode)}
                      className={`w-11 h-6 rounded-full p-1 transition-all ${
                        userProfile.datingMode ? "bg-orange-600" : "bg-neutral-800"
                      } cursor-pointer`}
                    >
                      <div
                        className={`w-4 h-4 bg-white rounded-full transition-all ${
                          userProfile.datingMode ? "translate-x-5" : "translate-x-0"
                        }`}
                      ></div>
                    </button>
                  </div>
                </div>

              </div>

              {/* PRIVACY, SECURITY & INTERACTION CONTROLS */}
              <div className="space-y-4 border-t border-neutral-800/80 pt-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-orange-400" />
                      <h3 className="font-display text-lg font-bold text-white">Privacy & Interaction</h3>
                    </div>
                    <p className="max-w-2xl text-[11px] leading-relaxed text-neutral-500">
                      Choose what other members can see, how they can reach you, and whether AI may use your profile for suggestions.
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 self-start rounded-lg border border-emerald-900/50 bg-emerald-950/20 px-2.5 py-1 text-[9px] font-mono text-emerald-400 sm:self-auto">
                    <LockKeyhole className="h-3 w-3" /> Saved on this device
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                  <section className="space-y-2 rounded-2xl border border-neutral-800/80 bg-neutral-950/30 p-3">
                    <div className="flex items-center gap-2 px-1 pb-1">
                      <LockKeyhole className="h-4 w-4 text-orange-400" />
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-neutral-300">Security</h4>
                    </div>
                    <PrivacyToggle
                      label="Discoverable profile"
                      description="Allow your profile to appear in member discovery."
                      enabled={privacySettings.profileDiscoverable}
                      onChange={enabled => updatePrivacySetting("profileDiscoverable", enabled)}
                    />
                    <PrivacyToggle
                      label="Share profile location"
                      description="Show your profile location to other members."
                      enabled={privacySettings.shareLocation}
                      onChange={enabled => updatePrivacySetting("shareLocation", enabled)}
                    />
                    <PrivacyToggle
                      label="AI personalization"
                      description="Let AI advice use your profile and conversation context."
                      enabled={privacySettings.aiPersonalization}
                      onChange={enabled => updatePrivacySetting("aiPersonalization", enabled)}
                    />
                  </section>

                  <section className="space-y-2 rounded-2xl border border-neutral-800/80 bg-neutral-950/30 p-3">
                    <div className="flex items-center gap-2 px-1 pb-1">
                      <Radio className="h-4 w-4 text-orange-400" />
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-neutral-300">Sharing</h4>
                    </div>
                    <PrivacyToggle
                      label="Online activity"
                      description="Show when you are active inside Vibe."
                      enabled={privacySettings.showOnlineStatus}
                      onChange={enabled => updatePrivacySetting("showOnlineStatus", enabled)}
                    />
                    <PrivacyToggle
                      label="Crew profile sharing"
                      description="Use your name and avatar in crew joins and hosted outings."
                      enabled={privacySettings.shareProfileInCrews}
                      onChange={enabled => updatePrivacySetting("shareProfileInCrews", enabled)}
                    />
                  </section>

                  <section className="space-y-2 rounded-2xl border border-neutral-800/80 bg-neutral-950/30 p-3">
                    <div className="flex items-center gap-2 px-1 pb-1">
                      <Settings2 className="h-4 w-4 text-orange-400" />
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-neutral-300">Interaction</h4>
                    </div>
                    <PrivacyToggle
                      label="Direct messages"
                      description="Allow matched members to start a direct conversation."
                      enabled={privacySettings.allowDirectMessages}
                      onChange={enabled => updatePrivacySetting("allowDirectMessages", enabled)}
                    />
                    <PrivacyToggle
                      label="Meetup invitations"
                      description="Allow members and crews to send you outing invitations."
                      enabled={privacySettings.allowMeetupInvites}
                      onChange={enabled => updatePrivacySetting("allowMeetupInvites", enabled)}
                    />
                  </section>
                </div>

                <div className="flex flex-col gap-2 border-t border-neutral-800/60 pt-4 sm:flex-row sm:justify-between">
                  <button
                    type="button"
                    onClick={() => setPrivacySettings(DEFAULT_PRIVACY_SETTINGS)}
                    className="rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-2 text-[10px] font-bold text-neutral-400 transition-colors hover:bg-neutral-900 hover:text-white"
                  >
                    Restore balanced defaults
                  </button>
                  <button
                    type="button"
                    onClick={returnToGateway}
                    className="rounded-xl border border-orange-900/50 bg-orange-950/10 px-4 py-2 text-[10px] font-bold text-orange-300 transition-colors hover:bg-orange-950/30"
                  >
                    Return to entry gateway
                  </button>
                </div>
              </div>

              {/* INTEREST CHECKBOXES CHIPS */}
              <div className="space-y-2 pt-4 border-t border-neutral-800/80">
                <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  Target Matchmaking Tags (Click to toggle)
                </label>
                <div className="flex flex-wrap gap-2">
                  {["Hiking", "Vinyl Records", "Brunch", "Board Games", "Espresso", "Culinary exploration", "Tech Design", "Modern Art", "Post-punk", "Star-gazing", "Strategy Eurogames"].map(
                    tag => {
                      const userHasIt = userProfile.interests.includes(tag);
                      return (
                        <button
                          key={tag}
                          onClick={() => {
                            const current = userProfile.interests;
                            const newVal = userHasIt
                              ? current.filter(t => t !== tag)
                              : [...current, tag];
                            setUserProfile(prev => ({ ...prev, interests: newVal }));
                          }}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                            userHasIt
                              ? "bg-orange-600 text-white border-orange-500 shadow-md shadow-orange-900/10"
                              : "bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-neutral-200"
                          }`}
                        >
                          {tag}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

            </div>
          )}

        </section>

      </main>

      {/* MATCH Splash OVERLAY MODAL */}
      {showMatchOverlay && (
        <div id="modal-dating-matchmatch" className="fixed inset-0 z-50 bg-neutral-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full smoked-glass border border-neutral-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl relative overflow-hidden">
            
            {/* Sparkles backdrop */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 blur-3xl rounded-full pointer-events-none animate-pulse"></div>
            
            <div className="relative">
              <span className="text-[10px] font-black tracking-widest bg-orange-500/25 text-orange-300 border border-orange-500/30 px-3 py-1 rounded-full uppercase">
                It's a Vibe!
              </span>
              <h2 className="text-3xl font-extrabold font-display text-white tracking-widest mt-4">
                MUTUAL RESONANCE
              </h2>
            </div>

            {/* Double Avatars Stack */}
            <div className="flex items-center justify-center -space-x-4 py-4">
              <img
                src={userProfile.avatar}
                alt={userProfile.name}
                className="w-20 h-20 rounded-full object-cover ring-4 ring-orange-600 border-2 border-neutral-950"
              />
              <img
                src={showMatchOverlay.image}
                alt={showMatchOverlay.name}
                className="w-20 h-20 rounded-full object-cover ring-4 ring-emerald-500 border-2 border-neutral-950"
              />
            </div>

            <div className="space-y-2">
              <p className="text-sm text-neutral-300 leading-normal font-sans">
                You and <strong>{showMatchOverlay.name}</strong> shared a mutual spark! Ask your local Wingman AI which speakeasies or cozy cafés match your mutual record-spinning chemistry.
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-4">
              <button
                id="btn-matchoverlay-gotochat"
                onClick={() => {
                  setActiveChatId(showMatchOverlay.id);
                  navigateToWorkspace("chats");
                  setShowMatchOverlay(null);
                }}
                className="w-full py-3 bg-gradient-to-r from-orange-600 to-orange-500 text-white font-display font-bold rounded-2xl shadow-lg hover:shadow-orange-500/30 cursor-pointer"
              >
                Send Icebreaker Starters
              </button>
              <button
                id="btn-matchoverlay-closesplash"
                onClick={() => setShowMatchOverlay(null)}
                className="w-full py-2 bg-transparent hover:bg-neutral-850 text-neutral-400 hover:text-neutral-200 transition-colors rounded-2xl text-xs font-semibold cursor-pointer"
              >
                Keep Exploring Matches
              </button>
            </div>

          </div>
        </div>
      )}

      {/* PROPOSE PLAN FORM MODAL */}
      {showFormModal && (
        <div id="modal-hangoutform-holder" className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full smoked-glass border border-neutral-800 rounded-2xl p-6 shadow-2xl relative space-y-4">
            
            <div className="flex justify-between items-center border-b border-neutral-800/80 pb-3">
              <h3 className="text-base font-bold font-display text-white">Propose Curated Outing</h3>
              <button
                id="btn-close-hangoutform"
                onClick={() => setShowFormModal(false)}
                className="text-neutral-400 hover:text-neutral-100 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4 text-xs font-sans">
              
              <div className="space-y-1">
                <label className="text-[10px] uppercase text-neutral-400 font-semibold tracking-wider">Event Headline Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Late Night Jazz Vault & Gin Crawl"
                  value={newEvent.title}
                  onChange={e => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-neutral-200 outline-none focus:border-orange-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase text-neutral-400 font-semibold tracking-wider">Outing Venue Location Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., The Blue Room & Speakeasy Bar"
                  value={newEvent.location}
                  onChange={e => setNewEvent(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-neutral-200 outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-neutral-400 font-semibold tracking-wider">Target Outing Date</label>
                  <input
                    type="text"
                    placeholder="e.g., This Saturday"
                    value={newEvent.date}
                    onChange={e => setNewEvent(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-neutral-200 outline-none focus:border-orange-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-neutral-400 font-semibold tracking-wider">Meeting Time</label>
                  <input
                    type="text"
                    placeholder="e.g., 8:30 PM"
                    value={newEvent.time}
                    onChange={e => setNewEvent(prev => ({ ...prev, time: e.target.value }))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-neutral-200 outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-neutral-400 font-semibold tracking-wider">Focus Vibe Category</label>
                  <select
                    value={newEvent.category}
                    onChange={e => setNewEvent(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-neutral-200 outline-none focus:border-orange-500"
                  >
                    <option value="adventure">🏔️ Adventure Outdoors</option>
                    <option value="cuisine">🍜 Gourmet Culinary</option>
                    <option value="arts">🎨 Fine Arts & Vinyls</option>
                    <option value="games">🎲 Board Games & Strategy</option>
                    <option value="tech">💻 Hacker Projects</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-neutral-400 font-semibold tracking-wider">Vibe Target Style</label>
                  <select
                    value={newEvent.type}
                    onChange={e => setNewEvent(prev => ({ ...prev, type: e.target.value as any }))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-neutral-200 outline-none focus:border-orange-500"
                  >
                    <option value="group">Crews Gathering</option>
                    <option value="date">Romantic Outing Duos</option>
                    <option value="outing">General Adventure</option>
                    <option value="party">Late Night Party</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase text-neutral-400 font-semibold tracking-wider">Short description</label>
                <textarea
                  rows={2}
                  placeholder="Details on coordinate points, dressing styles, or custom stargazing requirements..."
                  value={newEvent.description}
                  onChange={e => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-neutral-200 outline-none resize-none focus:border-orange-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase text-neutral-400 font-semibold tracking-wider">Curated Cover Image (Unsplash URL Optional)</label>
                <input
                  type="text"
                  placeholder="Leave empty for beautiful default"
                  value={newEvent.image}
                  onChange={e => setNewEvent(prev => ({ ...prev, image: e.target.value }))}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-neutral-200 outline-none focus:border-orange-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-white font-semibold rounded-xl text-center leading-none mt-2 shadow shadow-orange-950/40 cursor-pointer"
              >
                Publish Proposal to Board
              </button>

            </form>
          </div>
        </div>
      )}

      {/* GROUP POLL CREATOR MODAL */}
      {showPollModal && activeChatMetadata && (
        <div id="modal-poll-creator" className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-lg w-full smoked-glass border border-neutral-800 rounded-2xl p-6 shadow-2xl relative space-y-4 max-h-[90vh] overflow-y-auto">
            
            <div className="flex justify-between items-center border-b border-neutral-800/80 pb-3">
              <div>
                <h3 className="text-base font-bold font-display text-white">Create Group Poll</h3>
                <p className="text-[10px] text-neutral-400 font-mono">
                  Coordinate meetups or break the ice with {activeChatMetadata.name}
                </p>
              </div>
              <button
                id="btn-close-pollmodal"
                onClick={() => setShowPollModal(false)}
                className="text-neutral-400 hover:text-neutral-100 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick-fill suggestions category-wise */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase text-neutral-400 font-mono tracking-wider font-bold block">
                💡 Suggested Templates & Ice Breakers:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPollQuestion("When should we schedule our next meetup?");
                    setPollOptions(["This Friday at 7:00 PM 🌇", "This Saturday at 1:00 PM ☀️", "This Sunday at 11:30 AM 🥐", "Next Tuesday at 6:30 PM ☕"]);
                  }}
                  className="bg-neutral-950 hover:bg-neutral-900 text-left p-2.5 rounded-xl border border-neutral-800 hover:border-neutral-700 text-neutral-200 transition-all cursor-pointer"
                >
                  <p className="text-[11px] font-bold text-neutral-100">📅 Meetup Dates</p>
                  <p className="text-[9px] text-neutral-400 font-mono truncate">Schedule date options</p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPollQuestion("Vote on our next activity theme!");
                    setPollOptions([
                      activeChatMetadata.category === "adventure" ? "Sunset Flatirons Ascent 🥾" :
                      activeChatMetadata.category === "cuisine" ? "Gourmet Hot Pot Crawl 🍲" :
                      activeChatMetadata.category === "arts" ? "Private Vinyl Listening Session 🎧" :
                      activeChatMetadata.category === "games" ? "Root / Dune Game Night 🎲" :
                      "AI Project Presentation & Drinks 💻",

                      activeChatMetadata.category === "adventure" ? "Star Gazing Campfire Night 🌌" :
                      activeChatMetadata.category === "cuisine" ? "Sourdough Swap Meet 🥖" :
                      activeChatMetadata.category === "arts" ? "Late-night Speakeasy Sketching 🎨" :
                      activeChatMetadata.category === "games" ? "Cooperative Escape Rooms 🗝️" :
                      "Mechanical Keyboard Building Jam ⌨️",

                      "Chill Cafe Social Hour ☕"
                    ]);
                  }}
                  className="bg-neutral-950 hover:bg-neutral-900 text-left p-2.5 rounded-xl border border-neutral-800 hover:border-neutral-700 text-neutral-200 transition-all cursor-pointer"
                >
                  <p className="text-[11px] font-bold text-neutral-100">✨ Meetup Themes</p>
                  <p className="text-[9px] text-neutral-400 font-mono truncate">Category-specific goals</p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const prompts: Record<string, { q: string, o: string[] }> = {
                      adventure: {
                        q: "Ideal post-hike reward? 🏔️",
                        o: ["Ice-cold craft IPA / Beverage 🍺", "Hot hearty ramen bowl 🍜", "Rich vanilla matcha latte 🍵", "Deep 10-hour recovery nap 💤"]
                      },
                      cuisine: {
                        q: "What is your absolute culinary superpower? 🥟",
                        o: ["Hand-rolling dumplings from scratch", "Sourdough fermentation mastery", "Plating and aesthetic decoration", "Flawless taste-testing and washing up"]
                      },
                      arts: {
                        q: "Preferred analog sound vibe? 🎧",
                        o: ["Smooth vintage cool jazz (analog vinyl)", "Dark wave / synthwave synth beats", "Acoustic indie folk guitar", "Warm crackling ambient sounds"]
                      },
                      games: {
                        q: "Go-to game night archetype? 🎲",
                        o: ["Heavy rules Euro spreadsheet planner", "Underhanded social deduction liar", "Cooperative 'we win together' coordinator", "Casual party game enjoyer"]
                      },
                      tech: {
                        q: "Best coding fuel of choice? 💻",
                        o: ["Specialty third-wave pour-over espresso", "Iced matcha latte with oat milk", "Classic diet soda / energy drink", "Strict mineral water hydration"]
                      }
                    };
                    const cat = activeChatMetadata.category || "arts";
                    const choice = prompts[cat] || prompts["arts"];
                    setPollQuestion(choice.q);
                    setPollOptions(choice.o);
                  }}
                  className="bg-neutral-950 hover:bg-neutral-900 text-left p-2.5 rounded-xl border border-neutral-800 hover:border-neutral-700 text-neutral-200 transition-all cursor-pointer col-span-2"
                >
                  <p className="text-[11px] font-bold text-neutral-100">🔥 Suggested Ice Breaker Poll</p>
                  <p className="text-[9px] text-neutral-400 font-mono">
                    Category-targeted ice breaker prompt for breaking the ice
                  </p>
                </button>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCreatePoll(pollQuestion, pollOptions);
                setShowPollModal(false);
              }}
              className="space-y-4 text-xs font-sans pt-2 border-t border-neutral-800/80"
            >
              
              {/* Question */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase text-neutral-400 font-semibold tracking-wider block">
                  Poll Question / Topic
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Which time matches everyone's schedule?"
                  value={pollQuestion}
                  onChange={e => setPollQuestion(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-neutral-200 outline-none focus:border-orange-500"
                />
              </div>

              {/* Options */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase text-neutral-400 font-semibold tracking-wider block">
                  Poll Options
                </label>
                
                <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                  {pollOptions.map((opt, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <span className="text-[10px] text-neutral-500 font-mono shrink-0 w-4 text-right">
                        #{idx + 1}
                      </span>
                      <input
                        type="text"
                        required={idx < 2}
                        placeholder={idx < 2 ? "Required option" : "Optional option"}
                        value={opt}
                        onChange={e => {
                          const updated = [...pollOptions];
                          updated[idx] = e.target.value;
                          setPollOptions(updated);
                        }}
                        className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl p-2 text-neutral-200 outline-none focus:border-orange-500 text-xs"
                      />
                      {pollOptions.length > 2 && (
                        <button
                          type="button"
                          onClick={() => {
                            setPollOptions(pollOptions.filter((_, i) => i !== idx));
                          }}
                          className="p-2 hover:bg-red-950/40 text-red-450 rounded-lg transition-colors cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {pollOptions.length < 5 && (
                  <button
                    type="button"
                    onClick={() => setPollOptions([...pollOptions, ""])}
                    className="w-full py-2 bg-neutral-950 hover:bg-neutral-900 text-neutral-300 font-semibold rounded-xl text-center border border-dashed border-neutral-800 transition-colors text-[11px] cursor-pointer mt-1"
                  >
                    + Add Custom Option
                  </button>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-3 border-t border-neutral-800/80">
                <button
                  type="button"
                  onClick={() => setShowPollModal(false)}
                  className="flex-1 py-2.5 bg-neutral-950 hover:bg-neutral-900 text-neutral-400 font-semibold rounded-xl text-center leading-none text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!pollQuestion.trim() || pollOptions.filter(o => o.trim() !== "").length < 2}
                  className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-500 disabled:bg-neutral-900/80 disabled:text-neutral-500 text-white font-semibold rounded-xl text-center leading-none text-xs shadow shadow-orange-950/20 transition-colors cursor-pointer"
                >
                  Publish Group Poll
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {selectedMeetupForMap && (
        <MapPreviewModal
          isOpen={true}
          onClose={() => setSelectedMeetupForMap(null)}
          meetup={selectedMeetupForMap}
          matches={matches}
        />
      )}

      {selectedMeetupForInvite && (
        <InviteFriendsModal
          isOpen={true}
          onClose={() => setSelectedMeetupForInvite(null)}
          meetup={selectedMeetupForInvite}
          matches={matches}
          onInviteFriend={handleInviteFriendToMeetup}
        />
      )}

    </div>
  );
}
