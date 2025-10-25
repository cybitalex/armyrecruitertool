# Groq AI Assistant Setup

The Army Recruiting Tool now includes an **AI Assistant powered by Groq + Llama 3.3 70B** - one of the fastest and most powerful AI models available!

## 🚀 Quick Setup (2 minutes)

### 1. Add Your Groq API Key

You already have your Groq API key! Let's add it to the `.env` file:

```bash
cd /Users/alexmoran/Documents/programming/ArmyRecruitTool
nano .env
```

Add this line (replace with your actual key):

```
GROQ_API_KEY=your_actual_groq_api_key_here
```

Save and exit (Ctrl+X, then Y, then Enter)

### 2. Restart the Server

```bash
npm run build
pm2 reload army-recruiter-tool
```

That's it! The AI Assistant is now active! 🎉

---

## 🎯 How to Use the AI Assistant

### On the Prospecting Map Page

Look for the **floating AI button** in the **bottom-right corner** of the screen:

```
┌────────────────────────────────────┐
│                                    │
│   [Map & Locations]                │
│                                    │
│                              ┌───┐ │
│                              │ 🤖│ │ ← Click here!
│                              └───┘ │
└────────────────────────────────────┘
```

Click it to open the AI chat interface!

### AI Assistant Features

The AI can help you with:

✅ **Finding recruiting locations**

- "What are the best schools to visit in my area?"
- "Where can I find high schools with good recruiting potential?"

✅ **Event recommendations**

- "What events should I target for recruiting?"
- "When do local career fairs typically happen?"

✅ **Demographics insights**

- "What age groups should I focus on?"
- "How do I approach community centers?"

✅ **Prospecting strategies**

- "What's the best time to visit local gyms?"
- "How do I maximize my SRE effectiveness?"

✅ **General Army recruiting questions**

- "What makes a good recruiting location?"
- "How do I track my prospecting efforts?"

---

## 💬 Example Conversation

**You:** "What are the best locations to recruit in Connecticut?"

**AI:** "For Army recruiting in Connecticut, I recommend focusing on these high-value locations:

**High Schools & Colleges (Priority 1):**

- University of Connecticut (Storrs) - large student body
- Central Connecticut State University (New Britain)
- Local high schools in Hartford, New Haven, and Bridgeport areas
- Best time: During lunch hours (11am-1pm) or after school (2:30-4pm)

**Fitness Centers (Priority 2):**

- Planet Fitness and LA Fitness locations - attract fitness-minded individuals
- CrossFit gyms - great for candidates interested in physical challenges
- Best time: Early morning (6-8am) or evening (5-7pm)

**Community Venues (Priority 3):**

- Career fairs at shopping malls
- Community centers in urban areas
- Sports events and local tournaments

**Pro Tips:**

- Get permission before setting up at any location
- Bring engaging materials (pull-up bars, challenge coins)
- Build relationships with school counselors
- Follow up with leads within 24-48 hours"

---

## 🎨 AI Assistant Interface

The assistant appears as a **floating chat window**:

```
┌─────────────────────────────────────────┐
│ ✨ AI Recruiting Assistant          [X] │
├─────────────────────────────────────────┤
│                                         │
│ 🤖 Hi! I'm your AI recruiting          │
│    assistant. Ask me about:            │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ What are the best locations to  │   │
│  │ recruit in my area?              │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ When is the best time to visit  │   │
│  │ local schools?                   │   │
│  └─────────────────────────────────┘   │
│                                         │
├─────────────────────────────────────────┤
│ [Ask about recruiting locations...] [→]│
│ ⚡ Powered by Groq + Llama 3.3         │
└─────────────────────────────────────────┘
```

---

## 🔥 Why Groq?

- **⚡ Lightning Fast**: Responses in under 1 second!
- **🧠 Powerful**: Uses Llama 3.3 70B - state-of-the-art AI
- **🆓 Free**: Generous free tier, no credit card required
- **🎯 Specialized**: Trained to understand Army recruiting needs
- **🔒 Secure**: Your conversations stay between you and the AI

---

## 🛠️ Troubleshooting

### "API key required" message

Make sure you:

1. Added `GROQ_API_KEY=...` to your `.env` file
2. Restarted the server: `pm2 reload army-recruiter-tool`
3. Your API key is valid (test at https://console.groq.com)

### AI not responding

Check the logs:

```bash
pm2 logs army-recruiter-tool --lines 50
```

Look for any Groq API errors.

### Button not appearing

1. Make sure you're on the **Prospecting Map** page
2. Clear your browser cache (Ctrl+Shift+R / Cmd+Shift+R)
3. Check the browser console for errors (F12)

---

## 📊 API Limits (Free Tier)

Groq's free tier is very generous:

- **Requests per day**: 14,400 (more than enough!)
- **Tokens per minute**: 30,000
- **Models**: Llama 3.3 70B, Llama 3.1 8B, Mixtral 8x7B

You can track your usage at: https://console.groq.com/usage

---

## 🎖️ Tips for Best Results

1. **Be specific**: "Best high schools in Hartford" vs "good schools"
2. **Ask follow-up questions**: The AI remembers conversation context
3. **Include location**: "in Connecticut" or "near Bristol"
4. **Ask for strategies**: "How should I approach..." gets detailed tactics
5. **Request examples**: "Give me example scenarios for..."

---

## 🔄 Need Help?

The AI Assistant is designed to help you with:

- **Prospecting**: Finding and evaluating locations
- **Events**: Discovering recruiting opportunities
- **Strategy**: Planning your approach and tactics
- **Questions**: Answering Army recruiting policies and best practices

If the AI doesn't know something, it will tell you honestly instead of guessing!

---

## 🚀 Next Steps

1. ✅ Add your Groq API key to `.env`
2. ✅ Restart the server
3. ✅ Go to the Prospecting Map page
4. ✅ Click the AI button in the bottom-right
5. ✅ Start asking questions!

**The AI is context-aware** - it knows:

- Your current location (if GPS is enabled)
- The locations and events on your map
- Army recruiting best practices
- Demographics and target audiences

Try asking: _"What locations on my map should I prioritize?"_

---

Made with 🎖️ by SGT Alex Moran • CyBit Devs
