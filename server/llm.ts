// Groq API (FAST and FREE!)
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * Ask AI using Groq API (Super fast and FREE!)
 * Uses Llama 3 - one of the most powerful open models
 */
export async function askAI(
  messages: AIMessage[],
  model = "llama-3.3-70b-versatile",
  options?: { max_tokens?: number }
): Promise<string> {
  if (!GROQ_API_KEY) {
    return `🤖 AI Assistant requires a Groq API key.

To enable the AI assistant (takes 1 minute):
1. Go to https://console.groq.com (free signup)
2. Go to API Keys section
3. Create a new API key
4. Add to .env: GROQ_API_KEY=your_api_key_here
5. Restart the server

✨ Groq is FREE with generous limits - no credit card required!

The AI assistant can help with:
• Finding nearby recruiting locations
• Suggesting event opportunities
• Analyzing demographics
• Planning prospecting strategies
• Answering Army recruiting questions`;
  }

  try {
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 1024,
        top_p: 1,
        stream: false,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Groq API error: ${error}`);
    }

    const data = await response.json();

    if (data.choices && data.choices[0]?.message?.content) {
      return data.choices[0].message.content;
    }

    console.log("Unexpected response format:", JSON.stringify(data));
    return "No response generated.";
  } catch (error) {
    console.error("Groq API error:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to get AI response"
    );
  }
}

export function createProspectingSystemPrompt(userLocation?: {
  latitude: number;
  longitude: number;
}, zipCode?: string): string {
  let locationInfo = "";
  
  if (zipCode) {
    locationInfo = `The user is searching in ZIP code: ${zipCode}`;
    if (userLocation) {
      locationInfo += ` (coordinates: ${userLocation.latitude}, ${userLocation.longitude})`;
    }
    locationInfo += `\n\n**IMPORTANT**: When providing advice, tailor your recommendations specifically to the ${zipCode} area. Consider the demographics, local characteristics, and opportunities unique to this ZIP code.`;
  } else if (userLocation) {
    locationInfo = `The user is currently located at: ${userLocation.latitude}, ${userLocation.longitude}`;
  } else {
    locationInfo = "The user's location is not available.";
  }

  return `You are an expert AI assistant specialized in helping U.S. Army recruiters with prospecting, lead generation, and strategic recruiting planning.

${locationInfo}

**Your Core Expertise:**
- Army recruiting best practices and regulations
- Identifying high-value prospecting locations (schools, gyms, events, community centers)
- Understanding target demographics (ages 17-24, fitness levels, career interests)
- Event-based recruiting strategies (career fairs, sports events, community gatherings)
- Timing optimization (best days/hours to visit different venues)
- Building relationships with school counselors, community leaders, and gym owners
- Legal and ethical considerations for recruiting activities

**Your Communication Style:**
- Direct, actionable, and practical
- Use military terminology when appropriate (SRE, MOS, DEP, etc.)
- Provide specific examples and scenarios
- Prioritize advice by impact (high/medium/low value)
- Always consider ethical recruiting practices
- Be encouraging but realistic about challenges

**Key Guidelines:**
1. Always recommend getting proper permissions before prospecting at any venue
2. Emphasize building long-term relationships, not just quick leads
3. Suggest tracking and follow-up strategies for leads
4. Acknowledge that recruiting is about finding people whose goals align with Army opportunities
5. Never suggest deceptive practices or overselling
6. Remember that high schools and colleges are Priority 1 targets
7. Fitness centers and community events are excellent secondary locations
8. Weekend community events often have high foot traffic and engaged audiences

**When asked about locations, consider:**
- Demographics (age, socioeconomic status, education level)
- Foot traffic patterns (busy times, seasonal variations)
- Competition (other services, local job market)
- Accessibility (parking, public transit, visibility)
- Permission requirements (school districts, private businesses)
- Cultural fit (military family areas vs. first-gen prospects)
- ZIP code characteristics (urban vs. suburban vs. rural, income levels, education rates)
- Local area features (military bases nearby, college towns, industrial areas)

**For event recommendations:**
- Career fairs → High value, prepared audience
- Sports events → Fitness-oriented, team players
- College fairs → Educational opportunities angle
- Community festivals → Broad demographic reach
- Concerts/entertainment → Youth engagement, visibility

Give concise, actionable answers. If asked for strategies, provide 3-5 specific steps. When discussing locations, include timing recommendations. Always be professional and supportive of the recruiter's mission.`;
}

/**
 * Generate an AI summary and recruiter suggestions from a high school senior survey (feedback text).
 * Slightly detailed: bullets and short sentences (no long paragraphs), still useful for follow-up and common themes.
 */
export async function generateHighSchoolSurveyAISummary(feedbackText: string): Promise<string> {
  const messages: AIMessage[] = [
    {
      role: "system",
      content: `You are an expert U.S. Army recruiting advisor. You are given the raw text results of a "High School Seniors Survey" completed by a high school senior. Produce a concise but useful summary for the recruiter. Use bullets and short sentences only—no long paragraphs. This summary is used even when the respondent does not provide contact info (for common themes and later outreach).

Output exactly two sections in plain text (no markdown).

1) OVERALL SUMMARY (4–8 short bullet points):
   Cover: college in fall or not; funding/job/plans; passion and priorities; view of Army and GI Bill awareness; main concerns; whether contact info was provided. One line per bullet; keep each bullet to one sentence.

2) SUGGESTIONS FOR RECRUITER (3–5 short bullets):
   Specific, actionable items: e.g. mention Post 9/11 GI Bill, Army Reserve vs Active, tuition assistance, career paths, or how to address their concerns. One line per bullet.`,
    },
    {
      role: "user",
      content: `High school senior survey results:\n\n${feedbackText}`,
    },
  ];
  return askAI(messages, "llama-3.3-70b-versatile", { max_tokens: 1024 });
}
