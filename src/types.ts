export interface UserProfile {
  name: string;
  age: number;
  gender: string;
  bio: string;
  location: string;
  avatar: string;
  interests: string[];
  datingMatchAgeRange: string;
  seekingGender: string;
  socialMood: 'curious' | 'adventurous' | 'chill' | 'deep-convo';
  datingMode: boolean; // toggle dating vs local group meetups
  joinedGroups: string[];
  rsvpedMeetups: string[];
}

export interface MatchProfile {
  id: string;
  name: string;
  age: number;
  gender: string;
  bio: string;
  distance: string;
  location: string;
  compatibilityScore: number;
  mutualInterests: string[];
  image: string;
  relationshipGoal: string;
  socialMood: string;
  chatHistory: ChatMessage[];
  isMatched: boolean;
  isLiked?: boolean;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  category: 'adventure' | 'cuisine' | 'arts' | 'games' | 'tech';
  membersCount: number;
  image: string;
  meetsCount: number;
  creator: string;
  nextMeetup?: {
    id: string;
    title: string;
    date: string;
    time: string;
    location: string;
    memberRsvps: string[];
  };
  messages: ChatMessage[];
  isJoined: boolean;
}

export interface MeetupEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  type: 'outing' | 'date' | 'group' | 'party';
  category: string;
  image: string;
  organizerName: string;
  organizerId: string;
  attendeesCount: number;
  attendeeAvatars: string[];
  joined: boolean;
}

export interface PollOption {
  id: string;
  text: string;
  votes: string[]; // names or IDs of voters
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  creatorName: string;
  isClosed?: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  isAiHelp?: boolean;
  poll?: Poll;
}

export interface WingmanResponse {
  opener: string;
  icebreaker: string;
  spotRecommendation: string;
  spotDescription: string;
  vibesRating: string;
}
