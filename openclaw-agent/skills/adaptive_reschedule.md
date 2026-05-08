# Skill: Adaptive Rescheduling

## Trigger
Intent: missed_task OR new_commitment

## Input
- memory/{user_id}/active_plan.json
- missed_task_ids: array of task IDs
- new_constraints: optional updated constraint_profile

## Process
1. Identify missed tasks and their milestone impact
2. Find next available buffer slots
3. Redistribute missed tasks into buffer slots first
4. If buffer slots insufficient → extend daily capacity slightly on weekends
5. If overload unavoidable → warn user, suggest milestone deadline extension
6. If user is ahead of schedule → compress future tasks, move milestone earlier
7. Never reschedule into mock test Sundays

## Rescheduling Priority
1. Buffer days (first choice)
2. Weekend extra time
3. Following weekday (push by 1 day)
4. Milestone deadline adjustment (last resort)

## Output
- Updated active_plan.json saved to memory
- Plain English summary: what changed, why, and impact on exam timeline

## Memory
Overwrite: memory/{user_id}/active_plan.json
Append to: memory/{user_id}/progress_log.json