# Skill: Schedule Generation

## Trigger
After goal_decompose + constraint_analysis complete

## Input
- memory/{user_id}/goal_decomposition.json
- memory/{user_id}/constraint_profile.json
- start_date: today

## Process
1. Distribute milestone hours across available days proportionally
2. Assign weak subjects to weekday morning slots (higher focus)
3. Insert buffer slots every 5th working day (catch-up slots)
4. Schedule mock tests every Sunday automatically
5. Insert milestone checkpoints at natural break points
6. Never schedule on days fully blocked by fixed commitments
7. Add revision session every 10 days

## Output Schema
{
  "plan_id": string,
  "generated_at": string,
  "total_tasks": number,
  "tasks_scheduled": number,
  "weekly_schedule": [
    {
      "week": number,
      "days": [
        {
          "date": "YYYY-MM-DD",
          "day_of_week": string,
          "tasks": [
            {
              "id": string,
              "title": string,
              "duration_minutes": number,
              "milestone_id": string,
              "subject": string,
              "completed": false
            }
          ],
          "is_buffer_day": boolean,
          "is_mock_day": boolean,
          "total_minutes": number
        }
      ]
    }
  ],
  "milestone_deadlines": [
    {"milestone_id": string, "milestone_title": string, "target_date": string}
  ],
  "overload_warning": boolean
}

## Memory
Save to: memory/{user_id}/active_plan.json