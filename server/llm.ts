// Hugging Face Inference API (FREE and easy to use!)
const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;
const HF_API_URL = "https://router.huggingface.co/hf-inference/models/";

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * Ask AI using Hugging Face Inference API (FREE!)
 * Much easier to sign up than Groq - just go to huggingface.co
 */
export async function askAI(
  messages: AIMessage[],
  model = "google/flan-t5-base"
): Promise<string> {
  if (!HF_API_KEY) {
    return `🤖 AI Assistant requires a Hugging Face API key.

To enable the AI assistant (takes 1 minute):
1. Go to https://huggingface.co/join (free signup)
2. Go to Settings → Access Tokens
3. Create a new token (read access is enough)
4. Add to .env: HUGGINGFACE_API_KEY=your_token_here
5. Restart the server

✨ Hugging Face is FREE forever - no credit card required!

The AI assistant can help with:
• Finding nearby recruiting locations
• Suggesting event opportunities
• Analyzing demographics
• Planning prospecting strategies`;
  }

  try {
    // Format messages for Hugging Face
    const systemMessage =
      messages.find((m) => m.role === "system")?.content || "";
    const userMessages = messages.filter((m) => m.role !== "system");

    const prompt = systemMessage
      ? `${systemMessage}\n\n${userMessages
          .map((m) => `${m.role}: ${m.content}`)
          .join("\n")}`
      : userMessages.map((m) => m.content).join("\n");

    const response = await fetch(`${HF_API_URL}${model}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 512,
          temperature: 0.7,
          return_full_text: false,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Hugging Face API error: ${error}`);
    }

    const data = await response.json();

    // Hugging Face returns different formats depending on the model
    // Try multiple response formats
    if (Array.isArray(data)) {
      if (data[0]?.generated_text) {
        return data[0].generated_text;
      }
      if (data[0]?.summary_text) {
        return data[0].summary_text;
      }
      if (typeof data[0] === "string") {
        return data[0];
      }
    }

    // Some models return direct text
    if (typeof data === "string") {
      return data;
    }

    // T5/FLAN models return this format
    if (data.generated_text) {
      return data.generated_text;
    }

    console.log("Unexpected response format:", JSON.stringify(data));
    return "No response generated.";
  } catch (error) {
    console.error("Hugging Face API error:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to get AI response"
    );
  }
}

export function createProspectingSystemPrompt(userLocation?: {
  latitude: number;
  longitude: number;
}): string {
  const locationInfo = userLocation
    ? `The user is located at coordinates: ${userLocation.latitude}, ${userLocation.longitude}.`
    : "The user's location is not available.";

  return `You are an AI assistant helping Army recruiters find and evaluate prospecting locations.

${locationInfo}

Your role is to:
1. Suggest specific types of locations that would be good for Army recruiting (schools, gyms, community centers, events, etc.)
2. Provide demographic insights about target audiences
3. Recommend best times and approaches for different venues
4. Help identify upcoming events in the area
5. Suggest strategies for maximizing SRE (Soldier Recruiting Element) effectiveness

Be specific, practical, and focused on actionable recruiting advice. Keep responses concise and professional.`;
}
