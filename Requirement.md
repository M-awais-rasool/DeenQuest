We are building an Intelligent Inactivity Notification System in Go for an Islamic gamified learning app.
the folder alread created so the Intelligent Notification code implement in this pace

folder path
/Users/chawais/Documents/Programming/FullStack/DeenQuest/backend/internal/ai-service/ai-notifications

IMPORTANT:
- Focus ONLY on inactivity notification system
- Do NOT add other notification types
- Do NOT create future systems
- Keep architecture clean and scalable
- Explain code briefly so I can understand what is happening
- Keep implementation production-ready
- Use clean modular architecture

System Flow:

A cron job should run automatically every 10 minutes.

The system should:
1. Check database for users inactive for more than 24 hours
2. Process users in batches (100 users at a time)
3. Analyze user data:
   - streak
   - last active time
   - completed lessons
4. Generate personalized motivational notification message using Ollama locally
5. Use existing notification service to send push notification
6. Store logs for:
   - successful notifications
   - failed notifications
7. Add retry mechanism if notification sending fails

Requirements:

- Use Go
- Use robfig/cron for scheduling
- Use Ollama locally with llama3 model
- Use localhost:11434 API for AI generation
- Use existing expo notification service abstraction

AI Message Rules:

- Message should be short
- Max 1-2 sentences
- Friendly Islamic tone
- Motivational
- No extreme wording
- Personalized based on user streak and inactivity duration

Example tone:
“You were doing amazing 🌙 continue your Quran journey today.”

If Ollama fails:
- fallback to predefined static motivational messages

Important Logic:

- Do not send duplicate notifications repeatedly
- Add cooldown logic
- Skip users who already received inactivity notification recently
- Add proper logging and error handling

Expected Output:

- Complete implementation
- Cron workflow
- User inactivity checking
- Ollama integration
- Notification sending integration
- Retry logic
- Logging system
- Clean explanation of how whole system works together