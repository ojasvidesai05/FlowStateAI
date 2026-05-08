"""
OpenClaw-style memory: durable JSON files per user on disk.
Mirrors OpenClaw's markdown/YAML-based persistent memory concept.
Each user gets their own folder: openclaw-agent/memory/{user_id}/
"""

import json, os
from pathlib import Path

MEMORY_DIR = Path("../openclaw-agent/memory")

def save_memory(user_id: str, key: str, data: dict):
    user_dir = MEMORY_DIR / user_id
    user_dir.mkdir(parents=True, exist_ok=True)
    filepath = user_dir / f"{key}.json"
    with open(filepath, "w") as f:
        json.dump(data, f, indent=2)

def load_memory(user_id: str, key: str) -> dict:
    filepath = MEMORY_DIR / user_id / f"{key}.json"
    if not filepath.exists():
        raise FileNotFoundError(f"Memory not found: {user_id}/{key}")
    with open(filepath) as f:
        return json.load(f)

def memory_exists(user_id: str, key: str) -> bool:
    return (MEMORY_DIR / user_id / f"{key}.json").exists()

def append_progress_log(user_id: str, entry: dict):
    filepath = MEMORY_DIR / user_id / "progress_log.json"
    log = []
    if filepath.exists():
        with open(filepath) as f:
            log = json.load(f)
    log.append(entry)
    with open(filepath, "w") as f:
        json.dump(log, f, indent=2)