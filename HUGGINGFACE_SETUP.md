# Hugging Face AI Setup (FREE & Easy!)

Your AI assistant now uses **Hugging Face** instead of Groq. It's completely free, no credit card required, and takes just 1 minute to set up!

## Why Hugging Face?

✅ **100% Free** - No credit card, no paid tiers  
✅ **Easy Signup** - Just email, no phone verification  
✅ **Instant Access** - Start using immediately  
✅ **Generous Limits** - Thousands of requests per day  
✅ **Multiple Models** - Access to many AI models  
✅ **Reliable** - Used by millions of developers

## Setup Steps (1 Minute)

### 1. Create Account

Go to: **https://huggingface.co/join**

- Enter email
- Create password
- Verify email
- Done! ✓

### 2. Get API Token

1. Click your profile picture (top right)
2. Go to **Settings**
3. Click **Access Tokens** (left sidebar)
4. Click **New token**
5. Name it: "Army Recruiting Tool"
6. Role: **Read** (default is fine)
7. Click **Generate**
8. **Copy the token** (starts with `hf_...`)

### 3. Add to Your App

1. Open terminal in your project folder

2. Create/edit `.env` file:

   ```bash
   cp .env.example .env
   ```

3. Add your token:

   ```bash
   HUGGINGFACE_API_KEY=hf_YourTokenHere
   ```

4. Restart the server:
   ```bash
   npm run dev
   ```

### 4. Test It!

1. Go to http://localhost:5001
2. Click "Prospecting"
3. Click the 🤖 bot icon (bottom-right)
4. Ask: "What locations should I target?"

## Available AI Models

The app uses **Mistral-7B-Instruct** by default (fast and smart!).

Want to try other models? Edit `server/llm.ts` and change the model parameter:

### Recommended Free Models:

**Mistral 7B Instruct** (Default - Best balance)

```typescript
model = "mistralai/Mistral-7B-Instruct-v0.2";
```

**Falcon 7B Instruct** (Fast responses)

```typescript
model = "tiiuae/falcon-7b-instruct";
```

**Zephyr 7B Beta** (Very conversational)

```typescript
model = "HuggingFaceH4/zephyr-7b-beta";
```

**Llama 2 7B Chat** (Meta's model)

```typescript
model = "meta-llama/Llama-2-7b-chat-hf";
```

## Example Questions to Ask

Once configured, try:

**Location Discovery:**

- "What types of locations are best for Army recruiting?"
- "Should I focus on schools or gyms in my area?"
- "What's the best approach for community colleges?"

**Event Planning:**

- "What events should I attend for recruiting?"
- "How do I get booth space at career fairs?"
- "What's the best time of year for recruiting events?"

**Strategy:**

- "How do I approach high school students?"
- "What demographics have the highest enlistment rates?"
- "How can I improve my prospecting score?"

**Timing:**

- "When is the best time to visit schools?"
- "What days are best for mall recruiting?"
- "How often should I visit the same location?"

## Troubleshooting

### "AI Assistant requires a Hugging Face API key"

**Solution:** You haven't added the API key yet.

- Make sure you created `.env` file
- Check that `HUGGINGFACE_API_KEY` is set
- Token should start with `hf_`
- Restart server after adding key

### "Hugging Face API error"

**Solution:** Check your token is valid.

- Go to https://huggingface.co/settings/tokens
- Make sure token is active
- Create a new token if needed
- Copy the FULL token (includes `hf_` prefix)

### "Model is loading" message

**Solution:** First request can take 10-20 seconds.

- Hugging Face models "wake up" on first use
- Wait a bit and try again
- Subsequent requests will be fast

### Slow responses?

**Solution:** Try a different model.

- Smaller models = faster (7B vs 13B)
- Mistral-7B is usually fastest
- See "Available AI Models" above

## Free Tier Limits

Hugging Face free tier includes:

- **Rate Limit:** ~1000 requests/day
- **Speed:** 2-10 seconds per response
- **Tokens:** Up to 512 tokens per response
- **Models:** Access to thousands of models
- **Cost:** $0 forever

This is MORE than enough for daily recruiting use!

## Privacy & Security

- Your API token is stored locally in `.env`
- Never committed to git (in `.gitignore`)
- Conversations are not stored by Hugging Face
- User location only sent if you choose
- No data sharing with third parties

## Advantages over Groq

| Feature     | Hugging Face         | Groq                    |
| ----------- | -------------------- | ----------------------- |
| Signup      | 1 minute, email only | Complex, multiple steps |
| Credit Card | Not required         | Sometimes required      |
| Free Tier   | Generous             | Limited                 |
| Models      | Thousands            | Few                     |
| Setup       | Easy                 | Can have issues         |
| Reliability | Very stable          | Sometimes down          |

## Alternative: No API Key Needed?

If you don't want to set up ANY API key:

### Option 1: Use without AI

The app works perfectly without AI - you just won't have the assistant bot.

### Option 2: Run Ollama Locally

Install Ollama on your computer:

```bash
# Mac
brew install ollama
ollama serve
ollama pull mistral
```

Then the app can use it with zero API keys! (Let me know if you want this option)

## Need Help?

1. Check your token starts with `hf_`
2. Make sure `.env` file exists
3. Restart server after changes
4. Check browser console for errors
5. Test token at https://huggingface.co/settings/tokens

---

**Ready to start?** https://huggingface.co/join 🚀

Setup takes 1 minute and you'll have a free AI recruiting assistant!
