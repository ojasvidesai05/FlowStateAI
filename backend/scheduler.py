from datetime import date, timedelta
import json, uuid

def generate_schedule(decomposition: dict, constraint_profile: dict,
                       fixed_commitments: list, deadline_str: str) -> dict:
    """
    Generate a structured weekly plan from milestones + constraints.
    - Weak subjects get morning priority
    - Buffer day every 5 working days
    - Mock test every Sunday
    - Never exceed daily capacity
    """
    today = date.today()
    deadline = date.fromisoformat(deadline_str)
    milestones = decomposition["milestones"]

    daily_cap_weekday = constraint_profile["realistic_daily_capacity_weekday"] * 60  # minutes
    daily_cap_weekend = constraint_profile["realistic_daily_capacity_weekend"] * 60

    # Build blocked dates from fixed commitments
    fully_blocked = set()
    for c in fixed_commitments:
        if c.get("all_day") and c.get("date"):
            fully_blocked.add(c["date"])

    # Flatten all tasks from milestones into a queue
    all_tasks = []
    for milestone in milestones:
        total_mins = milestone["estimated_hours"] * 60
        topics = milestone.get("topics", [milestone["title"]])

        if topics:
        # One session per topic (split hours evenly across topics)
            mins_per_topic = max(30, int(total_mins / len(topics)))
        for i, topic in enumerate(topics):
            all_tasks.append({
                "id": f"t_{milestone['id']}_{i+1}",
                "title": topic,
                "duration_minutes": min(mins_per_topic, 90),  # cap at 90 mins per session
                "milestone_id": milestone["id"],
                "subject": milestone.get("subject_focus", "General"),
                "completed": False
            })
    else:
        # Fallback to sessions if no topics
        session_count = max(1, int(total_mins / 45))
        session_duration = int(total_mins / session_count)
        for i in range(session_count):
            all_tasks.append({
                "id": f"t_{milestone['id']}_{i+1}",
                "title": f"{milestone['title']} — Session {i+1}",
                "duration_minutes": session_duration,
                "milestone_id": milestone["id"],
                "subject": milestone.get("subject_focus", "General"),
                "completed": False
            })

        # 45-minute sessions
        session_count = max(1, int(total_mins / 45))
        session_duration = int(total_mins / session_count)
        for i in range(session_count):
            all_tasks.append({
                "id": f"t_{milestone['id']}_{i+1}",
                "title": f"{milestone['title']} — Session {i+1}",
                "duration_minutes": session_duration,
                "milestone_id": milestone["id"],
                "subject": milestone.get("subject_focus", "General"),
                "completed": False
            })

    # Assign tasks to days
    current_date = today
    weekly_schedule = []
    week_num = 1
    current_week_days = []
    task_index = 0
    working_day_counter = 0

    while current_date <= deadline:
        date_str = str(current_date)
        is_weekend = current_date.weekday() >= 5
        is_sunday = current_date.weekday() == 6
        is_blocked = date_str in fully_blocked

        if is_blocked:
            current_date += timedelta(days=1)
            continue

        capacity = daily_cap_weekend if is_weekend else daily_cap_weekday
        # Buffer day every 5th working day
        is_buffer = (not is_weekend) and (working_day_counter > 0) and (working_day_counter % 5 == 4)
        # Mock test every Sunday
        is_mock = is_sunday

        day_tasks = []
        day_minutes = 0

        if not is_buffer and not is_mock and task_index < len(all_tasks):
            while task_index < len(all_tasks):
                task = all_tasks[task_index]
                if day_minutes + task["duration_minutes"] <= capacity:
                    day_tasks.append(task)
                    day_minutes += task["duration_minutes"]
                    task_index += 1
                else:
                    break

        if is_mock:
            day_tasks.append({
                "id": f"mock_{date_str}",
                "title": "Full Mock Test + Review",
                "duration_minutes": 180,
                "milestone_id": "mock",
                "subject": "All Subjects",
                "completed": False
            })
            day_minutes = 180

        current_week_days.append({
            "date": date_str,
            "day_of_week": current_date.strftime("%A"),
            "tasks": day_tasks,
            "is_buffer_day": is_buffer,
            "is_mock_day": is_mock,
            "total_minutes": day_minutes
        })

        if not is_weekend:
            working_day_counter += 1

        # Week boundary — Sunday ends week
        if is_sunday or current_date == deadline:
            weekly_schedule.append({"week": week_num, "days": current_week_days})
            current_week_days = []
            week_num += 1

        current_date += timedelta(days=1)

    # Handle leftover days if week didn't end on Sunday
    if current_week_days:
        weekly_schedule.append({"week": week_num, "days": current_week_days})

    # Compute milestone target dates
    milestone_deadlines = []
    for milestone in milestones:
        for week in reversed(weekly_schedule):
            found = False
            for day in reversed(week["days"]):
                for task in day["tasks"]:
                    if task["milestone_id"] == milestone["id"]:
                        milestone_deadlines.append({
                            "milestone_id": milestone["id"],
                            "milestone_title": milestone["title"],
                            "target_date": day["date"]
                        })
                        found = True
                        break
                if found:
                    break
            if found:
                break

    return {
        "plan_id": str(uuid.uuid4())[:8],
        "generated_at": str(today),
        "total_tasks": len(all_tasks),
        "tasks_scheduled": task_index,
        "weekly_schedule": weekly_schedule,
        "milestone_deadlines": milestone_deadlines,
        "overload_warning": constraint_profile.get("overload_risk", False)
    }


def reschedule(plan: dict, missed_task_ids: list, constraint_profile: dict):
    """
    Redistribute missed tasks into buffer slots first,
    then weekend overflow if needed.
    """
    missed_tasks = []

    # Extract missed tasks from plan
    for week in plan["weekly_schedule"]:
        for day in week["days"]:
            to_remove = []
            for task in day["tasks"]:
                if task["id"] in missed_task_ids:
                    missed_tasks.append(task)
                    to_remove.append(task)
            for t in to_remove:
                day["tasks"].remove(t)
            day["total_minutes"] = sum(t["duration_minutes"] for t in day["tasks"])

    capacity = constraint_profile["realistic_daily_capacity_weekday"] * 60
    placed = 0

    # Place into buffer days first
    for week in plan["weekly_schedule"]:
        for day in week["days"]:
            if day["is_buffer_day"] and placed < len(missed_tasks):
                used = day["total_minutes"]
                for task in missed_tasks[placed:]:
                    if used + task["duration_minutes"] <= capacity:
                        day["tasks"].append(task)
                        used += task["duration_minutes"]
                        placed += 1
                    else:
                        break
                day["total_minutes"] = used

    # Place remaining into weekend days
    if placed < len(missed_tasks):
        cap_weekend = constraint_profile["realistic_daily_capacity_weekend"] * 60
        for week in plan["weekly_schedule"]:
            for day in week["days"]:
                if day["day_of_week"] in ["Saturday"] and placed < len(missed_tasks):
                    used = day["total_minutes"]
                    for task in missed_tasks[placed:]:
                        if used + task["duration_minutes"] <= cap_weekend:
                            day["tasks"].append(task)
                            used += task["duration_minutes"]
                            placed += 1
                        else:
                            break
                    day["total_minutes"] = used

    remaining = len(missed_tasks) - placed
    if remaining == 0:
        summary = f"All {len(missed_tasks)} missed tasks rescheduled into buffer/weekend slots. Plan is back on track."
    else:
        summary = (f"{placed} of {len(missed_tasks)} tasks rescheduled. "
                   f"{remaining} tasks could not fit — consider extending your exam prep window.")

    return plan, summary