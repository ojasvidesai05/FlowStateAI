FlowState AI
Constraint-Aware Exam Preparation System
Samsung PRISM × OpenClaw Hackathon 2026 | Theme: Daily Utility & Productivity Platforms

An intelligent Android app that converts exam goals (GATE, JEE, NEET, Placements, UPSC)
into realistic, constraint-aware, adaptive daily study plans — powered by OpenClaw agent
orchestration and Groq LLM.

The Problem
Students don't fail exams because they lack motivation. They fail because their plans
don't survive contact with real life — college schedules, unexpected breaks, exam weeks.
Existing planners assume a perfect world. AI Life Architect assumes chaos and plans for it.

 Key Features
Exam-specific planning — GATE, JEE, NEET, Placements, UPSC milestone templates
Weak subject prioritisation — weak subjects get 40% more time automatically  
Constraint-aware scheduling — fits your actual college schedule and free hours
Adaptive rescheduling — missed tasks automatically moved to buffer slots
What-if simulation — see how schedule changes affect your exam readiness
OpenClaw memory — durable per-user memory survives restarts
Daily heartbeat — 7am briefing + 9pm check-in via Telegram

Architecture

Android App (React Native)
       ↓ HTTP
Python FastAPI Backend ──→ Groq LLM (llama-3.3-70b)
       ↓
OpenClaw Agent Layer
  ├── SOUL.md         (exam domain knowledge + rules)
  ├── AGENTS.md       (multi-agent routing)
  ├── HEARTBEAT.md    (daily proactive reminders)
  └── memory/
      └── {user_id}/
          ├── goal_decomposition.json
          ├── constraint_profile.json
          ├── active_plan.json
          └── progress_log.json



 1. Clone
```bash
git clone https://github.com/YOUR_USERNAME/ai-life-architect
cd ai-life-architect
```

### 2. Backend
```powershell
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt

# Create .env file:
echo GROQ_API_KEY=your_key_here > .env

# Run (keep this terminal open):
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Mobile App
```powershell
cd mobile
npm install

# Edit src/api/client.ts → set BASE_URL to your machine's local IP
# (run `ipconfig` in PowerShell to find it — looks like 192.168.x.x)

npx expo start
```
Scan the QR code with Expo Go on your Android phone.
Both phone and laptop must be on the same Wi-Fi.

### 4. Build APK
```powershell
cd mobile
npx eas build -p android --profile preview
```

Usage Flow
1.  Goal tab  → select exam → enter weak/strong subjects → set deadline → tap Build My Plan
2.  Dashboard  → check off today's tasks → submit progress (missed tasks auto-rescheduled)
3.  Plan tab  → see full weekly schedule with buffer days and mock test Sundays
4.  Simulate tab  → test "what if I take a week off?" scenarios before committing

OpenClaw Memory Implementation
| File | Purpose |
|------|---------|
| `SOUL.md` | Agent personality, exam domain knowledge, planning rules |
| `AGENTS.md` | Multi-agent routing (goal_decomposer, scheduler, adaptive_reschedule, progress_coach) |
| `USER.md` | Per-user profile template |
| `HEARTBEAT.md` | Cron-based daily briefing (7am) and check-in (9pm) |
| `skills/goal_decompose.md` | Exam-specific milestone generation skill |
| `skills/constraint_analysis.md` | Available hours + interruption buffer analysis |
| `skills/scheduler.md` | Task distribution + buffer day + mock Sunday generation |
| `skills/adaptive_reschedule.md` | Missed task redistribution logic |

