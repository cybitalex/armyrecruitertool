import { askAI } from "./llm";
import mosData from "../shared/mos-data.json" assert { type: "json" };

export interface MOSSuggestion {
  code: string;
  name: string;
  rank: string;
  relevanceScore?: number;
  reason?: string;
}

/**
 * Suggest Army MOS based on applicant's interest description using AI
 */
export async function suggestMOS(interestDescription: string): Promise<MOSSuggestion[]> {
  if (!interestDescription || interestDescription.trim().length < 3) {
    return [];
  }

  try {
    // Build a concise MOS reference for the AI
    const mosReference = mosData.mosList
      .map(mos => `${mos.code}:${mos.name}`)
      .slice(0, 200) // Limit to first 200 for context size
      .join(", ");

    const prompt = `Based on the following interest description from a potential Army recruit, suggest the top 5 most relevant Army Military Occupational Specialties (MOS).

Interest Description: "${interestDescription}"

Available MOS (code:name): ${mosReference}

Analyze the interest and match it to relevant MOS. Consider:
- Keywords (e.g., "infantry", "medical", "tech", "intelligence", "engineer")
- Skills mentioned (e.g., "computers", "leadership", "mechanics", "languages")
- Career interests (e.g., "combat", "support", "technical", "administrative")

Respond with ONLY a JSON array of top 5 suggestions. Each must have: code, name, rank, reason
Example format:
[{"code":"11B","name":"Infantryman","rank":"Enlisted","reason":"Direct combat role matching infantry interest"},...]

IMPORTANT: 
- Return valid JSON array only
- Include 3-5 suggestions
- Each reason should be 1 short sentence
- Use only MOS from the provided list`;

    const response = await askAI([
      { role: "system", content: "You are an Army recruiter assistant helping match recruits to appropriate MOS based on their interests. Always respond with valid JSON." },
      { role: "user", content: prompt }
    ]);

    // Parse AI response
    let suggestions: MOSSuggestion[] = [];
    
    try {
      // Extract JSON from response (AI might wrap it in markdown or text)
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0]);
      } else {
        suggestions = JSON.parse(response);
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", response);
      // Fallback to keyword matching
      return keywordBasedSuggestions(interestDescription);
    }

    // Validate and enrich suggestions
    const validSuggestions = suggestions
      .filter(s => s.code && s.name)
      .slice(0, 5)
      .map(suggestion => {
        // Find full details from our MOS data
        const fullMOS = mosData.mosList.find(m => m.code === suggestion.code);
        return {
          ...suggestion,
          name: fullMOS?.name || suggestion.name,
          rank: fullMOS?.rank || suggestion.rank
        };
      });

    return validSuggestions;

  } catch (error) {
    console.error("Error suggesting MOS:", error);
    // Fallback to keyword-based suggestions
    return keywordBasedSuggestions(interestDescription);
  }
}

/**
 * Fallback: Simple keyword-based MOS matching
 */
function keywordBasedSuggestions(interest: string): MOSSuggestion[] {
  const lowerInterest = interest.toLowerCase();
  const suggestions: MOSSuggestion[] = [];

  // Keyword mapping to MOS
  const keywordMap: { [key: string]: string[] } = {
    "infantry": ["11B", "11C"],
    "combat": ["11B", "19D", "13B"],
    "medical": ["68W", "68X"],
    "tech": ["25B", "17C", "35T"],
    "computer": ["25B", "17C", "35T"],
    "cyber": ["17C", "25D"],
    "intelligence": ["35F", "35M", "35N"],
    "engineer": ["12B", "12N", "12W"],
    "mechanic": ["91B", "91D", "91S"],
    "aviation": ["15T", "15U", "15Y"],
    "language": ["09L", "35P"],
    "translator": ["09L", "35P"],
    "logistics": ["88M", "92A", "92Y"],
    "supply": ["92A", "92Y"],
    "admin": ["42A", "25B"],
  };

  // Find matching MOS codes
  const matchedCodes = new Set<string>();
  Object.keys(keywordMap).forEach(keyword => {
    if (lowerInterest.includes(keyword)) {
      keywordMap[keyword].forEach(code => matchedCodes.add(code));
    }
  });

  // Convert codes to full MOS suggestions
  matchedCodes.forEach(code => {
    const mos = mosData.mosList.find(m => m.code === code);
    if (mos) {
      suggestions.push({
        ...mos,
        reason: "Matched based on interest keywords"
      });
    }
  });

  return suggestions.slice(0, 5);
}
