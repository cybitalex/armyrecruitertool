# AI Assistant Setup Guide

The Army Recruiting Tool includes a **free AI assistant** powered by Groq to help with prospecting strategies.

## Features

The AI assistant can help you with:

- 🎯 Finding nearby recruiting locations
- 📅 Identifying upcoming events
- 👥 Understanding target demographics
- 🗺️ Planning prospecting strategies
- ⏰ Best times to visit locations
- 💡 Creative recruiting approaches

## Getting Your Free Groq API Key

Groq provides a **FREE tier** with fast LLM inference. Here's how to set it up:

### Step 1: Sign Up for Groq

1. Visit https://console.groq.com
2. Click "Sign Up" (it's completely free!)
3. Complete the registration process
4. Verify your email address

### Step 2: Get Your API Key

1. Log in to the Groq Console
2. Navigate to **"API Keys"** in the left sidebar
3. Click **"Create API Key"**
4. Give it a name (e.g., "Army Recruiting Tool")
5. Copy the generated API key

### Step 3: Add API Key to Your App

1. In your project root, create a `.env` file:

   ```bash
   cp .env.example .env
   ```

2. Open `.env` and add your Groq API key:

   ```
   GROQ_API_KEY=your_actual_api_key_here
   ```

3. Restart your development server:
   ```bash
   npm run dev
   ```

## Using the AI Assistant

Once configured, you'll see a **bot icon** (🤖) floating in the bottom-right corner of the Prospecting Map page.

### Example Questions to Ask:

**Location Discovery:**

- "What types of locations should I target in my area?"
- "Where can I find high school students interested in military service?"
- "What gyms or fitness centers would be good for recruiting?"

**Event Planning:**

- "What events should I attend for recruiting?"
- "When is the best time to set up at career fairs?"
- "How do I identify community events for prospecting?"

**Strategy & Demographics:**

- "What demographics should I focus on?"
- "How do I approach community college students?"
- "What's the best way to engage with local businesses?"

**Timing & Approach:**

- "When is the best time to visit schools?"
- "What days are best for mall recruiting?"
- "How should I prepare for a career fair?"

## AI Models Available

The default model is `llama-3.1-70b-versatile`, which provides:

- Fast responses (under 2 seconds typically)
- Excellent general knowledge
- Good reasoning capabilities
- Professional and helpful tone

Other Groq models you can use (edit `server/llm.ts`):

- `llama-3.1-8b-instant` - Faster, lighter responses
- `mixtral-8x7b-32768` - Longer context window
- `gemma2-9b-it` - Google's Gemma model

## Without API Key

If you don't configure an API key, the assistant will still appear but will show helpful setup instructions instead of answering questions.

## Free Tier Limits

Groq's free tier is very generous:

- Thousands of requests per day
- Fast inference (faster than GPT-4)
- No credit card required
- Multiple models available

## Privacy & Security

- Your API key is stored locally in `.env` (never committed to git)
- Conversations are not stored permanently
- User location is only sent to AI for context if you choose
- All data stays between you and Groq's API

## Troubleshooting

### "AI Assistant requires a Groq API key"

- Make sure you've created a `.env` file
- Check that `GROQ_API_KEY` is set correctly
- Restart your development server after adding the key

### "Failed to get AI response"

- Check your internet connection
- Verify your API key is valid
- Check Groq console for any issues

### Bot icon not appearing

- Make sure you're on the `/prospecting` page
- Check browser console for errors
- Try refreshing the page

## Alternative Free LLMs

If you prefer a different LLM service, you can modify `server/llm.ts` to use:

- **OpenAI** (not free, but easy to integrate)
- **Hugging Face** (free inference API)
- **Ollama** (run locally, completely free, no API key needed)
- **Together AI** (free tier available)
- **Replicate** (free tier for testing)

The Groq integration can be easily swapped for any OpenAI-compatible API.

## Benefits of AI Assistant

1. **Saves Time** - Get instant answers to recruiting questions
2. **Local Context** - Uses your GPS location for relevant suggestions
3. **Always Available** - 24/7 recruiting advisor
4. **No Training Required** - Just ask natural questions
5. **Free Forever** - Groq's free tier is permanent

---

**Get started now:** https://console.groq.com 🚀
