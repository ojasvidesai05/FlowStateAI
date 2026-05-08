# Heartbeat Configuration

## Morning Briefing
cron: "0 7 * * *"   # 7am daily

### Actions
1. Load USER.md — read exam target, streak, today's tasks from active_plan.json
2. Identify today's subject focus (weak subjects get morning priority)
3. Send morning message via Telegram:
   "Good morning! 📚 [Days] days to [Exam].
   Today: [Task 1] + [Task 2] ([X] mins total)
   Focus subject: [Weak Subject]
   Streak: [N] days 🔥"
4. Log heartbeat execution

## Evening Check-in
cron: "0 21 * * *"  # 9pm daily

### Actions
1. Send: "How did today go? Reply: done / partial / missed"
2. Parse response
3. If "done" → increment streak in USER.md, log completion
4. If "partial" or "missed" → trigger adaptive_reschedule agent
5. Update progress_log.json in memory

## Weekly Summary (Sundays)
cron: "0 20 * * 0"  # 8pm every Sunday

### Actions
1. Summarize week: tasks completed vs planned, streak, milestone progress
2. Remind about upcoming milestone deadlines
3. Send weekly report to user