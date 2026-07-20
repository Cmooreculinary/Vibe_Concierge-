import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = Number.parseInt(process.env.PORT || "10000", 10);

app.use(express.json());

// Initialize Gemini SDK with User-Agent safe options for AI Studio telemetry.
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
    console.log("Gemini client successfully initialized.");
  } catch (err) {
    console.error("Error initializing Gemini client:", err);
  }
} else {
  console.log("No GEMINI_API_KEY env detected. Running with simulated intelligent Matchmaker.");
}

// Health Check
app.get("/api/health", (_req, res) => {
  res.json({ status: "alive", geminiActive: !!ai });
});

// AI Venue Grounding Insights API using googleMaps tool
app.post("/api/venue-insights", async (req, res) => {
  const { location, title } = req.body;
  if (!location) {
    return res.status(400).json({ error: "Missing location" });
  }

  const getOfflineFallback = () => {
    return {
      description: `A highly-rated destination perfectly fitting the mood of your upcoming "${title || 'Curated Outing'}" meetup. It is situated in a vibrant district, well-known for friendly atmospheres and scenic views.`,
      address: `Metro Center District, city center`,
      transit: "Easily accessible by public transport; 5-minute walk from Central Station.",
      parking: "Free street parking is available on weekends, plus an underground garage nearby.",
      tips: "Arrive 15 minutes early to secure seats. Don't forget to check out the local rooftop deck view if available!",
      groundingAttribution: "Local Directory (Simulated)"
    };
  };

  if (!ai) {
    return res.json(getOfflineFallback());
  }

  try {
    const prompt = `
      The user is organizing a social meetup event titled "${title || ''}" at the location/venue "${location}".
      Provide high-quality, up-to-date, real-world location information about this venue using your googleMaps tool.
      Ensure you extract:
      1. A vivid real-world description of the place.
      2. Its real formatted street address (or closest reference trailhead address if outdoors).
      3. Practical public transit options or walking directions from central transit.
      4. Driving accessibility and parking deck/lot availability.
      5. Local suggestions or special pro tips (best hours, scenic overlook, scenic paths, or dress tips).

      Your output MUST be a clean JSON object conforming strictly to the requested schema.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleMaps: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: { type: Type.STRING },
            address: { type: Type.STRING },
            transit: { type: Type.STRING },
            parking: { type: Type.STRING },
            tips: { type: Type.STRING },
          },
          required: ["description", "address", "transit", "parking", "tips"],
        }
      }
    });

    const parsedData = JSON.parse(response.text || "{}");
    return res.json({
      ...parsedData,
      groundingAttribution: "Google Maps"
    });
  } catch (error) {
    console.error("Venue Insights Maps Grounding failed, using fallback:", error);
    return res.json(getOfflineFallback());
  }
});

// Wingman AI matchmaker API
app.post("/api/wingman", async (req, res) => {
  const { userProfile, targetType, targetName, targetBio, targetInterests, targetMood } = req.body;

  if (!userProfile) {
    return res.status(400).json({ error: "Missing userProfile" });
  }

  // Fallback content in case Gemini is not available
  const getOfflineFallback = () => {
    const isGroup = targetType === "group";
    const mutuals = (userProfile.interests || []).filter((i: string) =>
      (targetInterests || []).includes(i)
    );

    const matchScore = isGroup ? 85 : 91;
    const spot = isGroup
      ? "The Cozy Board Game and Speakeasy Lounge"
      : "The Neon Vinyl Record Cafe & espresso bar";
    const desc = isGroup
      ? "A high-energy, friendly spot that encourages lively debate and cooperative gaming over custom mocktails."
      : "Dimly lit corners, classic records spinning in the background, and perfect lattes — optimal for deep, distraction-free conversation.";

    const word = isGroup ? "Crew" : "Connection";

    return {
      opener: `Hey ${targetName}! I noticed we're both into ${
        mutuals[0] || (userProfile.interests && userProfile.interests[0]) || "new experiences"
      }. What’s your absolute favorite spot in town for that?`,
      icebreaker: `Ask your ${word}: "If you could only listen to one vinyl album for the next year while sipping coffee, what is it and why?"`,
      spotRecommendation: spot,
      spotDescription: desc,
      vibesRating: `${matchScore}% Vibe Alignment`,
    };
  };

  if (!ai) {
    // Return high-quality mock data immediately if key is missing
    return res.json({
      ...getOfflineFallback(),
      note: "No Active API Key found. Configure GEMINI_API_KEY in Secrets for live AI generation.",
    });
  }

  try {
    const prompt = `
      User profile:
      - Name: ${userProfile.name}
      - Age: ${userProfile.age}
      - Interests: ${JSON.stringify(userProfile.interests)}
      - Bio: "${userProfile.bio}"
      - Mindset: "${userProfile.socialMood}"
      - Currently looking for: "${userProfile.datingMode ? 'Dating Matches' : 'Interest Group outings'}"

      Target details (${targetType}):
      - Name: ${targetName}
      - Bio: "${targetBio || ''}"
      - Interests: ${JSON.stringify(targetInterests || [])}
      - Mindset/Mood: "${targetMood || ''}"

      Create highly customized, engaging wingman recommendations. Make sure it sounds playful, sophisticated, highly charismatic, and genuine (avoid dry robotic dating simulator patterns).
    `;

    const systemInstruction = `
      You are a world-class social wingman and elite crowd concierge named "Vibe AI Concierge".
      Given a person's profile, a date match's details or group themed interests, your task is to generate:
      1. A glittering message "opener" tailored to their mutual interest or active moods. Be direct and clever, avoiding standard clichés.
      2. A funny or deep group "icebreaker" challenge or prompt.
      3. A curated outing venue category title ("spotRecommendation") e.g. "Twilight Archery & Elixirs", "Retro Arcade & Speakeasy".
      4. An alluring teaser description ("spotDescription") describing the venue vibe.
      5. A whimsical compatibility alignment percentage ("vibesRating") with a 2-word caption (e.g., '93% Electric Resonance', '87% Cozy Harmony').

      You must strictly reply with valid JSON conforming to the structured schema. Do not include markdown wraps or extra chat.
    `;

    const result = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            opener: {
              type: Type.STRING,
              description: "A charismatic, customized conversation starting line.",
            },
            icebreaker: {
              type: Type.STRING,
              description: "A fun icebreaker question or micro-challenge.",
            },
            spotRecommendation: {
              type: Type.STRING,
              description: "Curated activity/venue spot name archetypes.",
            },
            spotDescription: {
              type: Type.STRING,
              description: "High-end explanation of why this matches their chemistry.",
            },
            vibesRating: {
              type: Type.STRING,
              description: "A funny percentage and caption, e.g. '95% Electric Alignment'.",
            },
          },
          required: ["opener", "icebreaker", "spotRecommendation", "spotDescription", "vibesRating"],
        },
      },
    });

    const parsedData = JSON.parse(result.text || "{}");
    return res.json(parsedData);
  } catch (error: any) {
    console.error("Gemini AI API Call failed:", error);
    return res.json(getOfflineFallback());
  }
});

// Configure Vite middleware in development; serve public files in production
async function bootstrap() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite middleware mounted.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving static production assets from /dist.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Vibe application running on port http://0.0.0.0:${PORT}`);
  });
}

bootstrap();
