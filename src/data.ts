import { UserProfile, MatchProfile, Group, MeetupEvent, PrivacySettings } from "./types";

export const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  profileDiscoverable: true,
  shareLocation: false,
  showOnlineStatus: false,
  allowDirectMessages: true,
  allowMeetupInvites: true,
  shareProfileInCrews: true,
  aiPersonalization: false,
};

export const DEFAULT_USER: UserProfile = {
  name: "Alex Moore",
  age: 27,
  gender: "Non-binary",
  bio: "Creative mind, caffeine advocate, and vinyl record hoarder. Love exploring local architecture, cooking spicy meals, and weekend hiking trials.",
  location: "Metro Area",
  avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&h=150&q=80",
  interests: ["Hiking", "Vinyl Records", "Brunch", "Board Games", "Espresso", "Culinary exploration", "Tech Design"],
  datingMatchAgeRange: "24-32",
  seekingGender: "Everyone",
  socialMood: "curious",
  datingMode: false, // Default is Crew mode (social meetups)
  joinedGroups: ["g-1", "g-3"],
  rsvpedMeetups: ["m-1"],
};

export const INITIAL_MATCHES: MatchProfile[] = [
  {
    id: "p-1",
    name: "Elena Rostova",
    age: 26,
    gender: "Female",
    bio: "Senior UI Designer by day, abstract watercolor painter by night. Looking for someone down to check out new art galleries or debate brutalist architecture over warm Matcha.",
    distance: "1.8 miles away",
    location: "Downtown Loft District",
    compatibilityScore: 94,
    mutualInterests: ["Tech Design", "Espresso", "Brunch", "Modern Art"],
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=80",
    relationshipGoal: "Intentional Dating",
    socialMood: "deep-convo",
    isMatched: false,
    chatHistory: [
      { id: "msg-0", senderId: "p-1", senderName: "Elena Rostova", text: "Hey Alex! Love your profile header. That vinyl collection pic is stunning! What was the latest record you added?", timestamp: "11 mins ago" }
    ]
  },
  {
    id: "p-2",
    name: "Marcus Vane",
    age: 29,
    gender: "Male",
    bio: "App developer, avid runner, and sourdough baker. Always chasing the perfect sunrise vista. Looking for an active companion for trail runs and late night drive discussions.",
    distance: "3.2 miles away",
    location: "Highland Slopes",
    compatibilityScore: 89,
    mutualInterests: ["Hiking", "Tech Design", "Espresso"],
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=500&q=80",
    relationshipGoal: "Dating & Adventures",
    socialMood: "adventurous",
    isMatched: false,
    chatHistory: []
  },
  {
    id: "p-3",
    name: "Aria Sterling",
    age: 25,
    gender: "Female",
    bio: "Jazz vocalist and collector of weird thrift store jackets. My perfect weekend is an outdoor market crawl followed by a cozy local band playing at a dark basement pub.",
    distance: "0.5 miles away",
    location: "Artisanal Quarter",
    compatibilityScore: 91,
    mutualInterests: ["Vinyl Records", "Brunch", "Espresso"],
    image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=500&q=80",
    relationshipGoal: "Casual Romance",
    socialMood: "curious",
    isMatched: false,
    chatHistory: [
      { id: "msg-aria-1", senderId: "p-3", senderName: "Aria Sterling", text: "Alex! Let's hit up the vintage market this Saturday! They have a rare pressings crate going out. Deal?", timestamp: "Yesterday" }
    ]
  },
  {
    id: "p-4",
    name: "Devon Cruz",
    age: 28,
    gender: "Male",
    bio: "Culinary sous chef & secret sci-fi writer. I express affection by cooking complex multi-course meals and making highly opinionated gaming lists. Down to find co-conspirators.",
    distance: "4.5 miles away",
    location: "West End Plaza",
    compatibilityScore: 86,
    mutualInterests: ["Culinary exploration", "Board Games", "Brunch"],
    image: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=500&q=80",
    relationshipGoal: "Deep Connection",
    socialMood: "chill",
    isMatched: false,
    chatHistory: []
  },
  {
    id: "p-5",
    name: "Maya Lin",
    age: 27,
    gender: "Female",
    bio: "Architectural conservationist who is slightly too obsessed with ancient brickwork patterns. Loves bouldering, herbal tea pairings, and long walks with physical cameras.",
    distance: "2.1 miles away",
    location: "Historical Row",
    compatibilityScore: 92,
    mutualInterests: ["Hiking", "Tech Design", "Brunch", "Culinary exploration"],
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=500&q=80",
    relationshipGoal: "Long-term Dating",
    socialMood: "deep-convo",
    isMatched: false,
    chatHistory: []
  }
];

export const INITIAL_GROUPS: Group[] = [
  {
    id: "g-1",
    name: "Sunset Hiking Elite",
    description: "For trail runners, peak baggers, and amateur astronomers who appreciate golden hour summits followed by microbrews and deep conversations.",
    category: "adventure",
    membersCount: 84,
    image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=500&q=80",
    meetsCount: 42,
    creator: "Marcus Vane",
    isJoined: true,
    nextMeetup: {
      id: "m-1",
      title: "Chasing Solstice Twilight Summit",
      date: "This Saturday",
      time: "6:30 PM",
      location: "Chautauqua Trailhead Base",
      memberRsvps: ["Alex Moore", "Marcus Vane", "Maya Lin"]
    },
    messages: [
      { id: "gmsg-1", senderId: "lead-1", senderName: "Tyler (Admin)", text: "Gear alert: Trail is dynamic due to afternoon showers. Wear hiking boots with good grip!", timestamp: "2:15 PM" },
      { id: "gmsg-2", senderId: "p-2", senderName: "Marcus Vane", text: "Bringing my field telescope so we can look at Saturn if the clouds break at the peak!", timestamp: "2:20 PM" }
    ]
  },
  {
    id: "g-2",
    name: "Late Night Vinyl & Espresso",
    description: "A community for audio purists, analog enthusiasts, and dark-roast espresso lovers. We gather at public cafés and staffed listening rooms to spin curated LPs of city pop, jazz, and post-punk.",
    category: "arts",
    membersCount: 121,
    image: "https://images.unsplash.com/photo-1481185103603-1dc844ef51db?auto=format&fit=crop&w=500&q=80",
    meetsCount: 19,
    creator: "Aria Sterling",
    isJoined: false,
    nextMeetup: {
      id: "m-2",
      title: "Vinyl Spin & Cardamom Late-Night",
      date: "Next Thursday",
      time: "9:00 PM",
      location: "The Underground Press Cafe",
      memberRsvps: ["Aria Sterling", "Elena Rostova"]
    },
    messages: []
  },
  {
    id: "g-3",
    name: "Gastronomy & Sunday Brunch",
    description: " CURATED culinary explorers obsessed with the alchemy of flavors. From secret noodle clubs and molecular gastronomy play-nights to high-end dim sum crawl Sundays.",
    category: "cuisine",
    membersCount: 160,
    image: "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=500&q=80",
    meetsCount: 38,
    creator: "Devon Cruz",
    isJoined: true,
    nextMeetup: {
      id: "m-3",
      title: "Secret Ramen Broth Mastery Exchange",
      date: "Tomorrow",
      time: "1:00 PM",
      location: "Public Market Teaching Kitchen",
      memberRsvps: ["Alex Moore", "Devon Cruz", "Elena Rostova"]
    },
    messages: [
      { id: "gmsg-3", senderId: "p-4", senderName: "Devon Cruz", text: "Don't forget to let me know any dietary preferences. Making a clean ginger-shiitake dashi base as the core!", timestamp: "11:00 AM" }
    ]
  },
  {
    id: "g-4",
    name: "Modern Boardgamers & Cocktails",
    description: "Serious strategy meets master mixology. We ditch monopoly for heavy euros (Root, Dune: Imperium, Scythe) while shaking craft martinis and custom bitters recipes.",
    category: "games",
    membersCount: 95,
    image: "https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=500&q=80",
    meetsCount: 12,
    creator: "Chloe Chen",
    isJoined: false,
    nextMeetup: {
      id: "m-4",
      title: "Cyberpunk Netrunner Night & Negronis",
      date: "Next Friday",
      time: "7:00 PM",
      location: "Neon Tavern Speakeasy Lounge",
      memberRsvps: ["Chloe Chen", "Devon Cruz"]
    },
    messages: []
  },
  {
    id: "g-5",
    name: "Creative Think-Tank & Tonic",
    description: "For designers, philosophers, and fullstack devs wanting to prototype weird ideas. We host coffee-fueled code-jams, design sprints, and prompt battles under cozy house music.",
    category: "tech",
    membersCount: 78,
    image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=500&q=80",
    meetsCount: 25,
    creator: "Elena Rostova",
    isJoined: false,
    nextMeetup: {
      id: "m-5",
      title: "Interactive AI Canvas Hack & Sips",
      date: "In 4 Days",
      time: "5:30 PM",
      location: "Glasshouse Creative Workspace",
      memberRsvps: ["Elena Rostova", "Marcus Vane"]
    },
    messages: []
  }
];

export const INITIAL_MEETUPS: MeetupEvent[] = [
  {
    id: "m-1",
    title: "Chasing Solstice Twilight Summit",
    description: "Gather with the Sunset Hiking Society for a moderate 4.5-mile golden-hour summit crawl, followed by deep stargazing. Marcus is packing a computerized wide field amateur telescope!",
    date: "This Saturday",
    time: "6:30 PM",
    location: "Chautauqua Trailhead Base",
    venueType: "public",
    type: "outing",
    category: "adventure",
    image: "https://images.unsplash.com/photo-1501555088652-021faa106b9b?auto=format&fit=crop&w=500&q=80",
    organizerName: "Marcus Vane",
    organizerId: "p-2",
    attendeesCount: 3,
    attendeeAvatars: [
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80", // Marcus
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&h=150&q=80", // Maya
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&h=150&q=80"  // Alex
    ],
    joined: true
  },
  {
    id: "m-3",
    title: "Secret Ramen Broth Mastery Exchange",
    description: "Learn molecular kitchen techniques with Devon at a staffed public teaching kitchen. We will construct deep chicken-tonkotsu tare and dehydrate custom mushroom spice sprinkles.",
    date: "Tomorrow",
    time: "1:00 PM",
    location: "Public Market Teaching Kitchen",
    venueType: "public",
    type: "group",
    category: "cuisine",
    image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=500&q=80",
    organizerName: "Devon Cruz",
    organizerId: "p-4",
    attendeesCount: 3,
    attendeeAvatars: [
      "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=150&h=150&q=80", // Devon
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80", // Elena
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&h=150&q=80"  // Alex
    ],
    joined: true
  },
  {
    id: "m-2",
    title: "Vinyl Spin & Cardamom Late-Night",
    description: "Spinning cozy city-pop, deep chill house, and post-punk. Admission includes one double-shot espresso brewed with freshly ground Cardamom beans.",
    date: "Next Thursday",
    time: "9:00 PM",
    location: "The Underground Press Cafe",
    venueType: "public",
    type: "party",
    category: "arts",
    image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=500&q=80",
    organizerName: "Aria Sterling",
    organizerId: "p-3",
    attendeesCount: 2,
    attendeeAvatars: [
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&h=150&q=80", // Aria
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80"  // Elena
    ],
    joined: false
  },
  {
    id: "m-4",
    title: "Cyberpunk Netrunner & Negronis",
    description: "Fast-paced cyber hacking games inside a neon speakeasy. Chloe and Devon are bringing duplicate base boxes so non-gamers can easily grasp the rules within 10 minutes.",
    date: "Next Friday",
    time: "7:00 PM",
    location: "Neon Tavern Speakeasy Lounge",
    venueType: "public",
    type: "group",
    category: "games",
    image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=500&q=80",
    organizerName: "Chloe Chen",
    organizerId: "lead-2",
    attendeesCount: 2,
    attendeeAvatars: [
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80",
      "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=150&h=150&q=80"
    ],
    joined: false
  }
];
