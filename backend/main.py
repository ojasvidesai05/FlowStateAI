from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import json, os, httpx
from datetime import date
from dotenv import load_dotenv
from scheduler import generate_schedule, reschedule
from memory_manager import save_memory, load_memory, memory_exists, append_progress_log

# ─── Syllabus Data ────────────────────────────────────────────────────────────

EXAM_SYLLABUS = {
    "gate_cse": {
        "Engineering Mathematics": [
            "Linear Algebra — Matrix operations, eigenvalues",
            "Calculus — Limits, differentiation, integration",
            "Probability & Statistics — Distributions, Bayes theorem",
            "Discrete Mathematics — Graph theory, combinatorics, logic"
        ],
        "Data Structures": [
            "Arrays & Strings", "Linked Lists", "Stacks & Queues",
            "Trees & BST", "Heaps & Priority Queues", "Graphs — BFS/DFS"
        ],
        "Algorithms": [
            "Complexity Analysis — Big O, recurrences",
            "Sorting — QuickSort, MergeSort, HeapSort",
            "Dynamic Programming — Knapsack, LCS, LIS",
            "Greedy Algorithms", "Graph Algorithms — Dijkstra, Kruskal, Prim"
        ],
        "Operating Systems": [
            "Processes & Threads", "CPU Scheduling — FCFS, SJF, Round Robin",
            "Memory Management — Paging, Segmentation",
            "Deadlocks — Detection, Prevention", "File Systems"
        ],
        "Databases": [
            "ER Model & Relational Model", "SQL — Joins, Aggregation, Subqueries",
            "Normalization — 1NF to BCNF", "Transactions & ACID", "Indexing & B-Trees"
        ],
        "Computer Networks": [
            "OSI & TCP/IP Model", "IP Addressing & Subnetting",
            "Routing — OSPF, BGP", "TCP vs UDP", "DNS, HTTP, HTTPS"
        ],
        "Theory of Computation": [
            "Finite Automata & Regular Languages", "Context-Free Grammars",
            "Pushdown Automata", "Turing Machines", "Decidability"
        ],
    },
    "gate_ece": {
        "Engineering Mathematics": [
            "Linear Algebra", "Calculus & Differential Equations",
            "Probability & Statistics", "Complex Analysis"
        ],
        "Signals & Systems": [
            "Continuous-Time Signals — Fourier Series",
            "Fourier Transform — Properties & Applications",
            "Laplace Transform", "Z-Transform", "Sampling Theorem"
        ],
        "Electronic Devices": [
            "Semiconductors — p-n junction", "Diode Characteristics & Applications",
            "BJT — Biasing & Amplification", "MOSFET — NMOS/PMOS",
            "Op-Amp — Ideal & Practical"
        ],
        "Control Systems": [
            "Transfer Functions & Block Diagrams", "Signal Flow Graphs",
            "Time Response Analysis", "Stability — Routh-Hurwitz",
            "Root Locus", "Bode Plot & Nyquist"
        ],
        "Communications": [
            "AM & FM Modulation", "Digital Modulation — ASK, FSK, PSK, QAM",
            "Noise in Communication Systems", "Shannon's Theorem"
        ],
        "Electromagnetics": [
            "Maxwell's Equations", "Wave Propagation & Polarization",
            "Transmission Lines", "Waveguides", "Antennas"
        ],
    },
    "gate_ee": {
        "Engineering Mathematics": [
            "Linear Algebra", "Calculus", "Differential Equations", "Probability"
        ],
        "Electric Circuits": [
            "KVL & KCL", "Network Theorems — Thevenin, Norton, Superposition",
            "Transient Analysis — RL, RC, RLC", "Two-Port Networks"
        ],
        "Control Systems": [
            "Transfer Functions", "Time Domain Analysis",
            "Stability Analysis", "Root Locus", "Bode & Nyquist Plots",
            "State Space Analysis"
        ],
        "Power Systems": [
            "Power Generation", "Transmission Lines", "Per-Unit System",
            "Load Flow Analysis", "Fault Analysis", "Power System Stability"
        ],
        "Electrical Machines": [
            "DC Machines — Motor & Generator", "Transformers",
            "Induction Motors", "Synchronous Machines"
        ],
    },
    "jee": {
        "Physics": [
            "Kinematics — 1D & 2D Motion, Projectile",
            "Laws of Motion — Newton's laws, Friction, Circular Motion",
            "Work, Energy & Power — Conservation Laws",
            "Rotational Motion — Torque, Angular Momentum, Moment of Inertia",
            "Gravitation — Orbital Motion, Escape Velocity",
            "Fluid Mechanics — Bernoulli, Viscosity",
            "Thermodynamics — Laws, Carnot Engine, Heat Transfer",
            "Kinetic Theory of Gases",
            "Simple Harmonic Motion & Waves",
            "Electrostatics — Coulomb's Law, Gauss Law, Potential",
            "Current Electricity — Kirchhoff's Laws, Wheatstone Bridge",
            "Magnetism — Biot-Savart, Ampere's Law, Cyclotron",
            "Electromagnetic Induction — Faraday's Law, AC Circuits",
            "Optics — Reflection, Refraction, Wave Optics, Interference",
            "Modern Physics — Photoelectric Effect, Bohr Model, Nuclear Physics",
            "Semiconductor Devices — Diodes, Transistors, Logic Gates"
        ],
        "Chemistry": [
            "Mole Concept & Stoichiometry",
            "Atomic Structure — Quantum Numbers, Orbitals",
            "Chemical Bonding — VSEPR, Hybridization, MOT",
            "States of Matter — Gas Laws, Ideal Gas",
            "Thermodynamics — Enthalpy, Entropy, Gibbs Energy",
            "Chemical Equilibrium — Le Chatelier, Kp, Kc",
            "Ionic Equilibrium — pH, Buffers, Solubility Product",
            "Electrochemistry — EMF, Nernst Equation, Faraday's Laws",
            "Chemical Kinetics — Rate Laws, Activation Energy",
            "p-Block Elements — Groups 13-18",
            "d & f Block Elements — Transition Metals, Coordination Compounds",
            "Organic Chemistry — IUPAC, Isomerism, Reaction Mechanisms",
            "Hydrocarbons — Alkanes, Alkenes, Alkynes, Arenes",
            "Haloalkanes & Haloarenes",
            "Alcohol, Phenol & Ethers",
            "Aldehydes, Ketones & Carboxylic Acids",
            "Amines & Diazonium Salts",
            "Biomolecules — Carbohydrates, Proteins, Nucleic Acids",
            "Polymers & Chemistry in Everyday Life"
        ],
        "Mathematics": [
            "Sets, Relations & Functions",
            "Trigonometry — Identities, Equations, Inverse Trig",
            "Complex Numbers — Argand Plane, De Moivre's Theorem",
            "Quadratic Equations & Inequalities",
            "Sequences & Series — AP, GP, HP",
            "Permutations & Combinations",
            "Binomial Theorem",
            "Matrices & Determinants",
            "Limits, Continuity & Differentiability",
            "Differentiation — Chain Rule, Implicit, Parametric",
            "Applications of Derivatives — Maxima/Minima, Tangents",
            "Integration — Definite & Indefinite",
            "Area Under Curves & Differential Equations",
            "Straight Lines & Circles",
            "Conic Sections — Parabola, Ellipse, Hyperbola",
            "3D Geometry — Direction Cosines, Planes",
            "Vectors — Dot & Cross Product",
            "Probability — Bayes Theorem, Distributions",
            "Statistics — Mean, Variance"
        ],
    },
    "neet": {
        "Biology": [
            "Cell — Structure & Function, Cell Organelles",
            "Cell Division — Mitosis & Meiosis",
            "Biomolecules — Carbohydrates, Proteins, Lipids, Nucleic Acids",
            "Plant Morphology — Root, Stem, Leaf, Flower, Fruit",
            "Plant Anatomy — Tissues, Secondary Growth",
            "Transport in Plants — Osmosis, Transpiration, Phloem",
            "Mineral Nutrition — Essential Elements, N2 Fixation",
            "Photosynthesis — Light & Dark Reactions, C3/C4",
            "Respiration — Glycolysis, Krebs Cycle, ETC",
            "Plant Growth & Development — Hormones",
            "Reproduction in Flowering Plants — Pollination, Fertilization",
            "Human Digestion & Absorption",
            "Human Respiration — Breathing Mechanism, Lung Volumes",
            "Body Fluids & Circulation — Blood Groups, ECG, Cardiac Cycle",
            "Excretion — Nephron, Urine Formation, Osmoregulation",
            "Locomotion & Movement — Joints, Muscle Contraction",
            "Neural Control — Neuron, Synapse, CNS, PNS, Reflexes",
            "Endocrine System — Hormones & Disorders",
            "Human Reproduction — Gametogenesis, Embryology",
            "Reproductive Health — Contraception, STDs",
            "Genetics — Mendel's Laws, Chromosomal Theory",
            "Molecular Basis — DNA Replication, Transcription, Translation",
            "Evolution — Theories, Evidence, Hardy-Weinberg",
            "Human Health & Disease — Immunity, Pathogens, Cancer",
            "Microbes in Human Welfare",
            "Biotechnology — Principles, rDNA Technology, Applications",
            "Organisms & Populations — Ecological Adaptations",
            "Ecosystem — Energy Flow, Nutrient Cycles",
            "Biodiversity — Conservation, Hotspots"
        ],
        "Chemistry": [
            "Mole Concept & Stoichiometry",
            "Atomic Structure & Chemical Bonding",
            "States of Matter & Thermodynamics",
            "Equilibrium — Chemical & Ionic",
            "Redox & Electrochemistry",
            "s-Block & p-Block Elements",
            "Organic Chemistry — Basics & Mechanisms",
            "Hydrocarbons", "Haloalkanes",
            "Alcohol, Phenol & Ethers",
            "Carbonyl Compounds & Carboxylic Acids",
            "Amines & Biomolecules",
            "Polymers & Chemistry in Everyday Life"
        ],
        "Physics": [
            "Units, Measurement & Motion in Straight Line",
            "Laws of Motion & Work-Energy Theorem",
            "Rotational Motion & Gravitation",
            "Mechanical Properties — Solids & Fluids",
            "Thermodynamics & Kinetic Theory",
            "Oscillations & Waves",
            "Electrostatics & Current Electricity",
            "Magnetic Effects & Electromagnetic Induction",
            "Optics — Ray & Wave Optics",
            "Dual Nature of Matter & Atoms & Nuclei",
            "Semiconductor Devices"
        ],
    },
    "placement": {
        "Data Structures & Algorithms": [
            "Arrays — Two Pointer, Sliding Window, Prefix Sum",
            "Strings — Pattern Matching, Anagrams",
            "Linked Lists — Reversal, Cycle Detection, Merge",
            "Stacks & Queues — Monotonic Stack, LRU Cache",
            "Binary Trees — Traversals, LCA, Diameter",
            "BST — Search, Insert, Validation",
            "Heaps — Top-K problems, Heap Sort",
            "Graphs — BFS, DFS, Topological Sort",
            "Graphs — Shortest Path: Dijkstra, Bellman-Ford",
            "Dynamic Programming — 0/1 Knapsack, LCS, LIS",
            "Dynamic Programming — Matrix Chain, Palindromes",
            "Greedy — Activity Selection, Huffman Coding",
            "Backtracking — N-Queens, Sudoku, Subsets"
        ],
        "CS Fundamentals": [
            "OS — Process vs Thread, Context Switching",
            "OS — CPU Scheduling: FCFS, SJF, Round Robin",
            "OS — Memory: Paging, Segmentation, Virtual Memory",
            "OS — Deadlocks: Detection, Prevention, Avoidance",
            "DBMS — ER Model & Relational Algebra",
            "DBMS — SQL: Joins, Aggregation, Window Functions",
            "DBMS — Normalization: 1NF to BCNF",
            "DBMS — Indexing, B-Trees, Transactions & ACID",
            "CN — OSI Model & TCP/IP Stack",
            "CN — TCP vs UDP, HTTP/HTTPS, DNS",
            "CN — IP Addressing, Subnetting, Routing Protocols"
        ],
        "LeetCode Practice": [
            "Easy Arrays — 15 problems (Two Sum, Best Time to Buy, etc.)",
            "Easy Strings — 10 problems",
            "Medium Linked Lists — 10 problems (Reverse, Detect Cycle)",
            "Medium Trees — 15 problems (Level Order, Validate BST)",
            "Medium DP — 20 problems (Coin Change, Longest Subsequence)",
            "Medium Graphs — 15 problems (Number of Islands, Course Schedule)",
            "Hard Mixed — 10 problems"
        ],
        "Interview Prep": [
            "HR Questions — Tell me about yourself, Strengths/Weaknesses",
            "Behavioural — STAR Method, Leadership, Teamwork",
            "System Design Basics — Load Balancing, Caching, Databases",
            "Project Deep-Dive — Explain your best project end-to-end",
            "Mock Technical Interview — 1 hour simulation",
            "Mock HR Interview — Full simulation with feedback"
        ],
    },
    "upsc": {
        "History": [
            "Ancient India — Indus Valley, Vedic Age, Mauryas, Guptas",
            "Medieval India — Delhi Sultanate, Mughal Empire, Bhakti Movement",
            "Modern India — British Expansion, 1857, Freedom Movement",
            "Gandhi Era — Non-Cooperation, Civil Disobedience, Quit India",
            "Post-Independence — Partition, Integration, Constitution"
        ],
        "Geography": [
            "Physical Geography — Geomorphology, Climatology, Oceanography",
            "Indian Physical Geography — Mountains, Rivers, Soil, Vegetation",
            "Indian Economic Geography — Agriculture, Industries, Transport",
            "World Geography — Continents, Climate Zones, Ocean Currents"
        ],
        "Polity": [
            "Constitution — Preamble, Fundamental Rights, DPSP",
            "Parliament — Lok Sabha, Rajya Sabha, Legislative Process",
            "Executive — President, PM, Council of Ministers, Cabinet",
            "Judiciary — Supreme Court, High Courts, Judicial Review",
            "Constitutional Bodies — CAG, UPSC, Election Commission",
            "Local Governance — Panchayati Raj, Urban Bodies"
        ],
        "Economy": [
            "Basic Macro Concepts — GDP, GNP, National Income",
            "Indian Economy — Planning, Five Year Plans, NITI Aayog",
            "Agriculture — Green Revolution, MSP, Food Security",
            "Banking & Finance — RBI, Monetary Policy, Inflation",
            "Budget — Union Budget, Fiscal Policy, Taxation",
            "International Trade — WTO, Balance of Payments, Trade Policy"
        ],
        "Environment": [
            "Ecology & Ecosystems — Food Chains, Energy Flow",
            "Biodiversity — Hotspots, Endangered Species, Conservation",
            "Climate Change — Greenhouse Effect, UNFCCC, Paris Agreement",
            "Environmental Laws & Acts",
            "Pollution — Air, Water, Soil, Noise"
        ],
        "Current Affairs": [
            "Monthly National Current Affairs Review",
            "Monthly International Affairs Review",
            "Economy & Financial News",
            "Science & Technology Developments",
            "Government Schemes & Policies"
        ],
    },
    "custom": {}
}

load_dotenv()

app = FastAPI(title="AI Life Architect API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = "llama-3.3-70b-versatile"


# ─── Helpers ─────────────────────────────────────────────────────────────────

def clean_json(raw: str) -> dict:
    raw = raw.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip().rstrip("```").strip()
    return json.loads(raw)


async def call_llm(system_prompt: str, user_message: str) -> str:
    async with httpx.AsyncClient(timeout=60) as client:
        response = await client.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": GROQ_MODEL,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message}
                ],
                "temperature": 0.2,
                "max_tokens": 2000
            }
        )
        data = response.json()
        if "error" in data:
            raise Exception(f"Groq error: {data['error']}")
        return data["choices"][0]["message"]["content"]


# ─── Request Models ───────────────────────────────────────────────────────────

class GoalRequest(BaseModel):
    user_id: str
    exam_type: str
    goal: str
    weak_subjects: str
    strong_subjects: str
    skill_level: str
    deadline: str
    fixed_commitments: List[dict]
    available_hours_weekday: float
    available_hours_weekend: float
    interruption_frequency: str

class MissedTaskRequest(BaseModel):
    user_id: str
    missed_task_ids: List[str]
    date: Optional[str] = None

class SimulationRequest(BaseModel):
    user_id: str
    scenario: str

class ProgressRequest(BaseModel):
    user_id: str
    status: str
    completed_task_ids: Optional[List[str]] = []


# ─── Endpoints ────────────────────────────────────────────────────────────────

@app.post("/api/goal/setup")
async def setup_goal(req: GoalRequest):
    exam_key = req.exam_type.lower().strip()
    syllabus = EXAM_SYLLABUS.get(exam_key)
    if syllabus is None:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported exam_type '{req.exam_type}'. Valid: {list(EXAM_SYLLABUS.keys())}"
        )

    system = """You are an expert exam preparation coach for Indian competitive exams.
Break the student's goal into structured milestones using the EXACT syllabus topics provided.
Each task must reference a real syllabus topic — never say "improve fundamentals" or "general study".
Weight weak subjects with 40% MORE hours than strong subjects.
Return ONLY valid JSON — no markdown, no explanation.
Schema exactly:
{
  "domain": "string",
  "exam_type": "string",
  "total_estimated_hours": number,
  "milestones": [
    {
      "id": "m1",
      "title": "string",
      "description": "string",
      "estimated_hours": number,
      "subject_focus": "string",
      "topics": ["topic1", "topic2"],
      "order": number
    }
  ]
}"""

    user_msg = (
        f"Exam: {req.exam_type}\n"
        f"Goal: {req.goal}\n"
        f"Skill level: {req.skill_level}\n"
        f"Exam date: {req.deadline}\n"
        f"Weak subjects (need more time): {req.weak_subjects}\n"
        f"Strong subjects (need less time): {req.strong_subjects}\n"
        f"OFFICIAL SYLLABUS TO USE:\n{json.dumps(syllabus, indent=2)}\n\n"
        f"Generate milestones that cover the full syllabus. "
        f"Each milestone must list specific syllabus topics in the 'topics' field. "
        f"Prioritise weak subjects in earlier milestones."
    )

    raw = await call_llm(system, user_msg)
    decomposition = clean_json(raw)

    interruption_buffer = {"low": 0.05, "medium": 0.15, "high": 0.25}.get(
        req.interruption_frequency, 0.15
    )

    today = date.today()
    exam_date = date.fromisoformat(req.deadline)
    total_days = max((exam_date - today).days, 1)
    weekdays_count = int(total_days * 5 / 7)
    weekends_count = total_days - weekdays_count

    total_available = (
        weekdays_count * req.available_hours_weekday +
        weekends_count * req.available_hours_weekend
    ) * (1 - interruption_buffer)

    estimated = decomposition.get("total_estimated_hours", 0)
    overload = total_available < estimated
    overload_pct = round(((estimated - total_available) / max(total_available, 1)) * 100, 1) if overload else 0

    constraint_profile = {
        "total_available_hours": round(total_available, 1),
        "realistic_daily_capacity_weekday": round(req.available_hours_weekday * (1 - interruption_buffer), 2),
        "realistic_daily_capacity_weekend": round(req.available_hours_weekend * (1 - interruption_buffer), 2),
        "overload_risk": overload,
        "overload_percentage": overload_pct,
        "buffer_percentage": interruption_buffer * 100,
        "recommendation": (
            f"Your available {round(total_available)}h is {overload_pct}% short of the estimated {estimated}h needed. "
            f"Consider extending your deadline or increasing daily hours." if overload
            else "Your schedule looks feasible. Stay consistent!"
        )
    }

    plan = generate_schedule(decomposition, constraint_profile, req.fixed_commitments, req.deadline)

    save_memory(req.user_id, "goal_decomposition", decomposition)
    save_memory(req.user_id, "constraint_profile", constraint_profile)
    save_memory(req.user_id, "active_plan", plan)
    save_memory(req.user_id, "user_profile", {
        "exam_type": req.exam_type,
        "goal": req.goal,
        "weak_subjects": req.weak_subjects,
        "strong_subjects": req.strong_subjects,
        "skill_level": req.skill_level,
        "deadline": req.deadline,
        "streak": 0,
        "plan_id": plan["plan_id"]
    })

    return {
        "decomposition": decomposition,
        "constraint_profile": constraint_profile,
        "plan": plan
    }


@app.post("/api/plan/missed-tasks")
async def handle_missed_tasks(req: MissedTaskRequest):
    if not memory_exists(req.user_id, "active_plan"):
        raise HTTPException(status_code=404, detail="No plan found for this user")

    plan = load_memory(req.user_id, "active_plan")
    constraint_profile = load_memory(req.user_id, "constraint_profile")

    updated_plan, summary = reschedule(plan, req.missed_task_ids, constraint_profile)
    save_memory(req.user_id, "active_plan", updated_plan)

    append_progress_log(req.user_id, {
        "date": req.date or str(date.today()),
        "missed_tasks": req.missed_task_ids,
        "action": "rescheduled",
        "summary": summary
    })

    return {"updated_plan": updated_plan, "summary": summary}


# ── /api/plan/simulate → preview only (returns impact analysis, does NOT modify plan) ──
@app.post("/api/plan/simulate")
async def simulate_scenario(req: SimulationRequest):
    if not memory_exists(req.user_id, "active_plan"):
        raise HTTPException(status_code=404, detail="No plan found")

    decomposition = load_memory(req.user_id, "goal_decomposition")
    constraint_profile = load_memory(req.user_id, "constraint_profile")
    profile = load_memory(req.user_id, "user_profile")

    system = """You are a planning analyst for Indian competitive exam preparation.
Given a current plan and a scenario change, predict impact on exam readiness.
Return ONLY valid JSON — no markdown, no preamble.
Schema exactly:
{
  "new_completion_date": "YYYY-MM-DD",
  "days_delayed": number,
  "hours_lost": number,
  "impact_summary": "string (2-3 sentences)",
  "recommendation": "string (actionable advice)"
}"""

    user_msg = (
        f"Exam: {profile.get('exam_type', 'Unknown')}\n"
        f"Exam date: {profile.get('deadline')}\n"
        f"Current available hours total: {constraint_profile['total_available_hours']}\n"
        f"Estimated hours needed: {decomposition['total_estimated_hours']}\n"
        f"Milestones: {json.dumps([m['title'] for m in decomposition['milestones']])}\n"
        f"Scenario: {req.scenario}\n"
        f"Analyze impact on exam readiness and completion timeline."
    )

    raw = await call_llm(system, user_msg)
    result = clean_json(raw)
    return result


# ── /api/plan/apply-scenario → actually modifies the active plan ──
@app.post("/api/plan/apply-scenario")
async def apply_scenario(req: SimulationRequest):
    if not memory_exists(req.user_id, "active_plan"):
        raise HTTPException(status_code=404, detail="No plan found")

    plan = load_memory(req.user_id, "active_plan")
    constraint_profile = load_memory(req.user_id, "constraint_profile")
    profile = load_memory(req.user_id, "user_profile")

    system = """You are a scheduling assistant. Parse the user's scenario into concrete plan changes.
Return ONLY valid JSON — no markdown, no preamble.
Schema exactly:
{
  "block_dates": ["YYYY-MM-DD"],
  "reduce_daily_hours_from": "YYYY-MM-DD or null",
  "reduce_daily_hours_to": "YYYY-MM-DD or null",
  "new_daily_hours_weekday": number or null,
  "new_daily_hours_weekend": number or null,
  "description": "plain English summary of what changed"
}"""

    today = date.today()
    user_msg = (
        f"Today: {today}\n"
        f"Exam date: {profile.get('deadline')}\n"
        f"Scenario: {req.scenario}\n"
        f"Parse into concrete date blocks and capacity changes."
    )

    raw = await call_llm(system, user_msg)
    changes = clean_json(raw)

    block_dates = set(changes.get("block_dates", []))
    pulled_tasks = []

    for week in plan["weekly_schedule"]:
        for day in week["days"]:
            if day["date"] in block_dates:
                pulled_tasks.extend(day["tasks"])
                day["tasks"] = []
                day["total_minutes"] = 0
                day["is_buffer_day"] = False

    updated_cap_weekday = changes.get("new_daily_hours_weekday") or constraint_profile["realistic_daily_capacity_weekday"]
    updated_cap_weekend = changes.get("new_daily_hours_weekend") or constraint_profile["realistic_daily_capacity_weekend"]

    task_pool = list(pulled_tasks)
    placed = 0

    for week in plan["weekly_schedule"]:
        for day in week["days"]:
            if not task_pool:
                break
            if day["date"] in block_dates:
                continue
            is_weekend = day["day_of_week"] in ["Saturday", "Sunday"]
            cap = (updated_cap_weekend if is_weekend else updated_cap_weekday) * 60
            used = day["total_minutes"]
            while task_pool and used + task_pool[0]["duration_minutes"] <= cap:
                task = task_pool.pop(0)
                day["tasks"].append(task)
                used += task["duration_minutes"]
                placed += 1
            day["total_minutes"] = used

    save_memory(req.user_id, "active_plan", plan)

    return {
        "updated_plan": plan,
        "changes_applied": changes,
        "tasks_redistributed": placed,
        "tasks_unplaced": len(task_pool),
        "summary": changes.get("description", "Plan updated based on your scenario.")
    }


@app.post("/api/progress/checkin")
async def progress_checkin(req: ProgressRequest):
    if not memory_exists(req.user_id, "user_profile"):
        raise HTTPException(status_code=404, detail="User not found")

    profile = load_memory(req.user_id, "user_profile")

    if req.status == "done":
        profile["streak"] = profile.get("streak", 0) + 1
    else:
        profile["streak"] = 0

    save_memory(req.user_id, "user_profile", profile)
    append_progress_log(req.user_id, {
        "date": str(date.today()),
        "status": req.status,
        "completed_tasks": req.completed_task_ids,
        "streak": profile["streak"]
    })

    return {"streak": profile["streak"], "status": req.status}


@app.get("/api/plan/{user_id}")
async def get_plan(user_id: str):
    if not memory_exists(user_id, "active_plan"):
        raise HTTPException(status_code=404, detail="No plan found")

    return {
        "plan": load_memory(user_id, "active_plan"),
        "decomposition": load_memory(user_id, "goal_decomposition"),
        "constraint_profile": load_memory(user_id, "constraint_profile"),
        "user_profile": load_memory(user_id, "user_profile")
    }


@app.get("/health")
async def health():
    return {"status": "ok", "model": GROQ_MODEL}