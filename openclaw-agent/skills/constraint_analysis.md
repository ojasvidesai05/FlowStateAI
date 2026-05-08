# Skill: Constraint Analysis

## Trigger
Intent: constraint_update OR pre-schedule check

## Input Schema
- fixed_commitments: array of {day, start_time, end_time, label}
- available_hours_weekday: number
- available_hours_weekend: number
- interruption_frequency: low | medium | high

## Process
1. Calculate total available hours from today to exam date
2. Apply interruption buffer: low=5%, medium=15%, high=25%
3. Compute realistic_daily_capacity for weekday and weekend
4. Flag overload_risk if total_estimated_hours > realistic_available_hours
5. Suggest deadline extension if overload > 20%

## Interruption Context (Indian student)
- low: Dedicated study environment, no college during prep
- medium: College ongoing, some family obligations (most common)
- high: Coaching + college + family, frequent schedule breaks

## Output Schema
{
  "total_available_hours": number,
  "realistic_daily_capacity_weekday": number,
  "realistic_daily_capacity_weekend": number,
  "overload_risk": boolean,
  "overload_percentage": number,
  "buffer_percentage": number,
  "recommendation": string
}

## Memory
Save to: memory/{user_id}/constraint_profile.json