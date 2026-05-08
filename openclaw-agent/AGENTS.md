# Agents

## orchestrator
Primary agent. Receives user messages. Routes to correct skill based on intent.
Intents: goal_setup | constraint_update | plan_view | missed_task | simulate_scenario | progress_checkin

## goal_decomposer
Triggered by: goal_setup intent
Input: exam type + weak subjects + strong subjects + skill level + deadline
Output: JSON array of milestones with estimated durations, subject-weighted

## constraint_analyzer
Triggered by: constraint_update intent or before first plan generation
Input: fixed commitments (college schedule), available hours, interruption frequency
Output: constraint_profile JSON

## scheduler
Triggered after goal_decomposer + constraint_analyzer complete
Input: milestones JSON + constraint_profile JSON
Output: full_plan JSON (daily tasks, weekly targets, buffer slots, mock test Sundays)

## adaptive_reschedule
Triggered by: missed_task intent or new commitment added
Input: current_plan JSON + missed items + new constraints
Output: updated_plan JSON + plain English summary of changes

## progress_coach
Triggered by: heartbeat morning check or manual progress_checkin
Input: today's tasks + streak data
Output: motivational briefing + focus tip for today's weak subject