# Skill: Goal Decomposition (Exam-Aware)

## Trigger
Intent: goal_setup

## Input Schema
- exam_type: gate | jee | neet | placement | upsc | custom
- weak_subjects: string (comma separated)
- strong_subjects: string (comma separated)
- skill_level: beginner | intermediate | advanced
- deadline: ISO date string (actual exam date)

## Process
1. Identify exam type
2. Use exam-specific milestone template as base structure
3. Adjust time allocation: weak subjects get 40% MORE hours than strong subjects
4. Add mandatory mock test milestone (every Sunday in schedule)
5. Final milestone is always "Revision + Full Mock Tests"
6. Return structured JSON only — no markdown

## Exam Milestone Templates

### GATE (8 months)
m1: Engineering Mathematics & General Aptitude (6 weeks, 15% of total hours)
m2: Core Subject — High-weightage topics (8 weeks, 30% of total hours)
m3: Core Subject — Remaining topics (8 weeks, 25% of total hours)
m4: Previous Year Papers — topic-wise (4 weeks, 15% of total hours)
m5: Full Mock Tests + Analysis (4 weeks, 10% of total hours)
m6: Final Revision (2 weeks, 5% of total hours)

### JEE Mains/Advanced (10 months)
m1: NCERT + Basics — all 3 subjects (8 weeks, 20% of total hours)
m2: Advanced Concepts — Physics + Maths (8 weeks, 25% of total hours)
m3: Advanced Concepts — Chemistry (6 weeks, 20% of total hours)
m4: JEE-level problem sets (8 weeks, 20% of total hours)
m5: Mock Tests + Weak Area Targeting (8 weeks, 10% of total hours)
m6: Final Revision + Strategy (4 weeks, 5% of total hours)

### NEET (10 months)
m1: NCERT Biology — Complete (10 weeks, 30% of total hours)
m2: NCERT Chemistry (6 weeks, 20% of total hours)
m3: NCERT Physics (6 weeks, 15% of total hours)
m4: NEET PYQ Practice (6 weeks, 20% of total hours)
m5: Full Mocks + Biology Deep Revision (8 weeks, 10% of total hours)
m6: Final Revision (4 weeks, 5% of total hours)

### Campus Placements (4 months)
m1: DSA Fundamentals — Arrays, Strings, LinkedList, Trees (4 weeks, 25%)
m2: DSA Advanced — Graphs, DP, Heaps (4 weeks, 25%)
m3: CS Fundamentals — OS, DBMS, CN (3 weeks, 20%)
m4: LeetCode Practice — 150 problems (3 weeks, 20%)
m5: Mock Interviews + HR Prep (2 weeks, 10%)

### UPSC Prelims (12 months)
m1: NCERT Foundation — History, Geography, Polity (10 weeks, 25%)
m2: Standard Books — Laxmikanth, Spectrum, etc. (10 weeks, 25%)
m3: Economy + Environment + Science & Tech (8 weeks, 20%)
m4: Current Affairs + Newspaper (ongoing, 15%)
m5: PYQ Practice + Mock Tests (8 weeks, 15%)

## Output Schema
{
  "domain": string,
  "exam_type": string,
  "total_estimated_hours": number,
  "milestones": [
    {
      "id": "m1",
      "title": string,
      "description": string,
      "estimated_hours": number,
      "subject_focus": string,
      "order": number
    }
  ]
}

## Memory
Save output to: memory/{user_id}/goal_decomposition.json