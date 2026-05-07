# Athlete Training Plan Builder Skill

## Purpose

Use this skill to create a structured endurance training plan for an athlete based on:

1. the existing athlete baseline profile,
2. connected activity data when available,
3. the athlete's target event or goal,
4. the available number of weeks,
5. the athlete's current fitness, constraints, equipment, and recovery situation.

The final output must be a new Markdown training plan file using the same weekly syntax as the example below:

```md
# Training Plan: <event / goal>

Horizon: <N> weeks | Goal: <goal> | Priorities: <priority 1> + <priority 2> + <priority 3>

Athlete: <age>, <sex/category>, <height>, <weight>
Benchmarks: <key PBs / FTP / swim pace / threshold data>
Limiters: <main risks / weak disciplines / injury constraints>
Equipment: <important gear / platforms / access>

## Plan Rules
...

## Intensity Legend
...

## Week 1 | Phase 1: <phase name>

Estimated volume: <x.x to y.y h>.

| Discipline | Time |
|---|---:|
| Swim | <time> |
| Bike | <time> |
| Run | <time> |
| Strength | <time> |
| Extras | <time> |

Focus: <one sentence>

Sessions to place on any suitable days:

### Swim
- <session name> | <duration> | <intensity / focus>

### Bike
- <session name> | <duration> | <intensity / power / HR / focus>

### Run
- <session name> | <duration> | <intensity / pace / HR / focus>

### Strength
- <session name> | <duration> | <focus>

### Extras
- <session name> | <duration> | <focus>
```

Do not output a PDF unless the user explicitly asks for one. The default artifact is a `.md` file.

---

## Core Behavior

Before asking the athlete anything, inspect all available context and connected data first. Use existing files, memory, Strava or other activity exports, device metrics, calendar constraints, and prior conversation context when available. Do not ask questions that can be answered from available data.

Ask only the minimum number of questions needed to build a safe and useful plan. The target is 8 to 12 questions. The hard maximum is 15 questions unless the user explicitly asks for a deep intake.

Avoid asking for exact details that are not necessary. For example, do not ask for every PB if recent activity data already gives reliable benchmarks. Do not ask for every single piece of equipment if the activity data and profile already show the relevant setup.

If a value is missing but not critical, make a conservative assumption and mark it clearly in the plan under `Assumptions`. If a value is safety-critical, ask before creating the plan.

The plan must be practical, not theoretical. Every week should contain concrete sessions, volumes, intensities, and discipline-specific focus.

---

## Inputs To Collect

### Step 1: Extract Existing Data First

Look for the following before asking questions:

- basic profile: age, sex/category, height, weight, location/timezone,
- target event or target distance,
- race date or deadline,
- recent training consistency,
- recent weekly volume and frequency,
- longest recent run, ride, swim, and brick,
- PBs and test results,
- current VO2max, FTP, threshold HR, threshold pace, max HR, resting HR,
- current fatigue, sleep, stress, job/activity level,
- injuries, medications, limitations, recurring pain,
- equipment and training access,
- platforms used: Strava, Coros, Garmin, Rouvy, Zwift, MyWhoosh, TrainerRoad, Wahoo, TrainingPeaks, etc.

### Step 2: Ask The Sweet Spot Intake

Ask these questions in one compact message. Remove any question that is already answered from available context.

```text
1. What are you preparing for?
   Event name / distance / discipline:
   Race date or target deadline:
   Main goal: finish / specific time / PB / qualify / build base:

2. How many weeks should the plan cover?
   Start date:
   End date / race week:

3. What is your realistic weekly availability?
   Hours per week:
   Max sessions per week:
   Long-session day(s):
   Days that must stay easy or free:

4. What is your current training pattern?
   Average weekly hours over the last 4-8 weeks:
   Current sessions per week by discipline:
   Longest recent run / ride / swim / brick:

5. What benchmarks should I use?
   Run PBs / recent races:
   Bike FTP or power zones:
   Swim pace or longest continuous swim:
   Threshold HR / pace / power if known:

6. What is the biggest limiter right now?
   Examples: swim technique, bike endurance, run durability, injury risk, fueling, recovery, open water, hills, heat.

7. Any injuries, pain, health issues, or medications that affect training?

8. Recovery and lifestyle:
   Average sleep:
   Stress: low / medium / high:
   Job/activity level: sitting / mixed / physical:
   Current fatigue: low / medium / high:

9. Equipment and access:
   Bike / trainer / power meter / HR strap:
   Pool / open water / gym / treadmill access:
   Apps/platforms used:

10. Plan preferences:
   Preferred intensity distribution:
   Strength training yes/no and how often:
   Do you want exact days assigned or only weekly session blocks?
   Any sessions you hate or cannot do?
```

If the athlete already has a reliable baseline profile, reduce the intake to only:

```text
1. What are you preparing for, and when is it?
2. How many weeks should the plan cover?
3. How many hours/sessions per week can you realistically train?
4. Which days are best for long sessions, and which days should stay free/easy?
5. What is the main goal and biggest limiter?
6. Any new injuries, fatigue, travel, work constraints, or equipment changes since the baseline profile?
```

---

## Plan Construction Rules

### 1. Use The Athlete's Goal To Select The Plan Type

Common plan types:

- 5K / 10K running plan,
- half marathon plan,
- marathon plan,
- sprint triathlon,
- Olympic triathlon,
- Ironman 70.3,
- full Ironman,
- cycling FTP / endurance block,
- swimming technique/endurance block,
- general base-building block,
- return-to-training block.

For multi-sport plans, include all relevant disciplines. For single-sport plans, include optional strength and mobility if useful.

### 2. Use A Phase Structure

Pick phases based on available weeks.

For 4-6 weeks:

- Phase 1: Setup / rhythm,
- Phase 2: Specific build,
- Phase 3: Taper / test / race.

For 8-12 weeks:

- Phase 1: Base,
- Phase 2: Build,
- Phase 3: Specific build,
- Phase 4: Taper / race.

For 13-20 weeks:

- Phase 1: Intro / base,
- Phase 2: Build,
- Phase 3: Specific build,
- Phase 4: Peak,
- Phase 5: Taper / race week.

### 3. Progress Volume Conservatively

Use recent volume as the anchor. Do not jump weekly volume aggressively because apparently tendons are not cloud infrastructure and cannot autoscale.

Default rules:

- increase weekly volume gradually,
- include a deload about every 3-4 weeks,
- keep the final 1-2 weeks as taper for races,
- reduce volume if current fatigue, injury risk, or stress is high,
- keep long runs and long rides progressive,
- do not stack multiple hard days without recovery.

### 4. Intensity Distribution

Default endurance plan distribution:

- around 80-90% easy / Z1-Z2,
- no more than 2 hard sessions per week for most amateur athletes,
- in triathlon, usually bike is the safest place for structured intensity,
- run intensity should be conservative if injury risk is unknown,
- swim intensity should prioritize technique if swim is a limiter.

For Ironman 70.3 style plans, a good default is:

- run by HR or RPE,
- bike by power if FTP exists,
- swim by RPE, pace, or technique focus,
- long bike + brick progression,
- race fueling practice during long rides and bricks.

### 5. Respect The Athlete's Limiters

If swim is the limiter:

- increase frequency before intensity,
- include technique sessions,
- include easy endurance sessions,
- include open water practice when race-relevant,
- avoid making swim workouts look like punishment written by a bored dolphin.

If bike is the limiter:

- prioritize Z2 durability,
- include sweet spot or threshold sparingly,
- include aero position practice if relevant,
- include fueling practice on long rides.

If run durability is the limiter:

- keep most runs easy,
- progress long runs carefully,
- use strides instead of heavy interval work early,
- avoid sudden speed volume.

If fueling/cramps are a known limiter:

- add fueling practice notes to long bike, long run, and brick sessions,
- include sodium/hydration testing notes,
- do not prescribe exact medical sodium needs unless the athlete already has tested values.

### 6. Safety Filters

Before finalizing the plan, check:

- Does the plan fit the athlete's stated weekly hours?
- Does it respect injury and fatigue status?
- Are hard sessions separated enough?
- Is there a deload pattern?
- Is there a taper if there is a race?
- Are long sessions appropriate for the athlete's recent longest sessions?
- Are intensity zones based on known metrics or clearly marked as estimated?
- Are assumptions listed clearly?

If the athlete reports pain, injury, illness, medication side effects, unexplained chest pain, dizziness, fainting, or worrying symptoms, do not pretend to be a sports doctor in a hoodie. Recommend medical/professional review and adjust the plan conservatively.

---

## Required Output Files

When the intake is complete, create or output two Markdown artifacts:

1. `<athlete-name-or-goal>-training-plan.md`
   - the full week-by-week training plan,
   - same syntax as the template below,
   - practical sessions grouped by discipline,
   - exact volumes and intensity guidance.

2. Optional but recommended: `<athlete-name-or-goal>-plan-assumptions.md`
   - assumptions,
   - missing data,
   - risks,
   - what to retest,
   - how to update the plan after 2-4 weeks.

If the user only asks for one file, create only the full training plan file.

---

## Training Plan Markdown Template

Use this exact structure unless the user asks for a different layout.

```md
# Training Plan: <Goal / Event>

Horizon: <N> weeks | Goal: <specific goal> | Priorities: <priority 1> + <priority 2> + <priority 3>

Athlete: <age>, <sex/category>, <height>, <weight>
Background: <brief training background>
Benchmarks: <PBs, FTP, threshold data, swim pace if known>
Limiters: <injuries, weak disciplines, fatigue, schedule limits>
Equipment: <key equipment and access>

## Assumptions

- <assumption 1>
- <assumption 2>
- <assumption 3>

## Plan Rules

- Most training stays easy unless the session explicitly says otherwise.
- Hard sessions are limited to <number> per week.
- Long sessions are protected. If fatigue rises, reduce optional endurance or extras first.
- Strength is adjusted around key endurance sessions.
- Race-specific fueling, gear, pacing, and transitions are practiced before race week.

## Intensity Legend

- EZ: very easy, Z1-Z2, conversational effort.
- EN: endurance, steady Z2.
- LR: long run, mostly Z2.
- LRide: long ride, mostly Z2.
- SS: sweet spot, usually around 80-92% FTP or controlled hard aerobic effort.
- THR: threshold, usually around 95-105% FTP or threshold effort.
- TP: tempo, controlled Z3.
- INT: interval session above threshold, used sparingly.
- Brick: bike plus run directly after.
- RPE: rating of perceived exertion from 1 to 10.

## Zones / Targets

### Run

- Z1 / Recovery: <HR / pace / RPE>
- Z2 / Easy endurance: <HR / pace / RPE>
- Z3 / Tempo: <HR / pace / RPE>
- Z4 / Threshold: <HR / pace / RPE>
- Z5 / VO2: <HR / pace / RPE>

### Bike

- FTP: <value or estimated>
- Z1 Recovery: <watts>
- Z2 Endurance: <watts>
- Z3 Tempo: <watts>
- Z4 Threshold: <watts>
- Z5 VO2: <watts>

### Swim

- Easy: <pace or RPE>
- Endurance: <pace or RPE>
- Threshold / CSS: <pace or RPE, if known>
- Technical focus: <main technical limiter>

## Optional Session Templates

Add this section only if the plan uses repeated placeholder sessions.

### Swim TECH

Warm-up: <distance/time>
Drills: <drills>
Main set: <set>
Cool-down: <distance/time>
Focus: <technical cue>

### Swim EASY ENDURANCE

Warm-up: <distance/time>
Main set: <set>
Cool-down: <distance/time>
Focus: <endurance cue>

### Strength / FBW

Main focus: <focus>
Avoid: <movements to avoid if relevant>
Keep it easy before key endurance days.

---

# Plan <N> weeks

Each week contains sessions to place on suitable days. Place hard days with recovery between them. If the athlete wants exact days, add a calendar layout after the weekly block.

## Week 1 | Phase 1: <Phase Name>

Estimated volume: <x.x to y.y h>.

| Discipline | Time |
|---|---:|
| Swim | <x.x h> |
| Bike | <x.x h> |
| Run | <x.x h> |
| Strength | <x.x h> |
| Extras | <x.x h> |

Focus: <one sentence describing the purpose of the week>.

Sessions to place on any suitable days:

### Swim
- <Session> | <duration or distance> | <intensity / focus>

### Bike
- <Session> | <duration> | <intensity / power target / focus>

### Run
- <Session> | <duration> | <intensity / HR / pace / focus>

### Strength
- <Session> | <duration> | <focus>

### Extras
- <Session> | <duration> | <focus>

## Week 2 | Phase 1: <Phase Name>

Estimated volume: <x.x to y.y h>.

| Discipline | Time |
|---|---:|
| Swim | <x.x h> |
| Bike | <x.x h> |
| Run | <x.x h> |
| Strength | <x.x h> |
| Extras | <x.x h> |

Focus: <one sentence>.

Sessions to place on any suitable days:

### Swim
- <Session> | <duration or distance> | <intensity / focus>

### Bike
- <Session> | <duration> | <intensity / power target / focus>

### Run
- <Session> | <duration> | <intensity / HR / pace / focus>

### Strength
- <Session> | <duration> | <focus>

### Extras
- <Session> | <duration> | <focus>
```

Continue the same structure for all weeks.

---

## Example: Ironman 70.3 Plan Style

Use this style when preparing a half-Ironman plan.

```md
# Training Plan: IRONMAN 70.3 <Race Name>

Horizon: 16 weeks | Goal: sub 6:00 | Priorities: swim technique + bike endurance + run durability

Athlete: 23, M, 180 cm, 78 kg
Background: running background, 2 completed marathons, triathlon-specific training in progress
Benchmarks: 5K 21:45 | 10K 44:18 | HM 1:47:12 | Marathon ~3:54 | FTP ~193 W | VO2max 59
Limiters: swim endurance/open water, bike race pacing, late-race cramps/fueling
Equipment: road bike, smart trainer, HR strap, GPS watch, wetsuit, pool, gym

## Plan Rules

- Around 85% of training stays easy / Z2.
- Max 2 harder sessions per week.
- Run is controlled mostly by HR/RPE.
- Bike is controlled mostly by power.
- Swim is controlled mostly by RPE and technique quality.
- Long rides and bricks include fueling practice.
- If fatigue rises, cut optional EN or extras before cutting key long Z2 or swim technique.

## Intensity Legend

- EZ: very easy, Z1-Z2, conversational effort.
- EN: endurance, steady Z2.
- LR: long run, mostly Z2.
- LRide: long ride, mostly Z2.
- SS: sweet spot, around 80-92% FTP.
- THR: threshold, around 95-105% FTP.
- TP: tempo run, controlled Z3.
- Brick: bike plus run directly after.
- RPE: perceived effort from 1 to 10.

## Week 1 | Phase 1: Intro

Estimated volume: 12.0 to 13.0 h.

| Discipline | Time |
|---|---:|
| Swim | 3.0 to 3.5 h |
| Bike | 4.5 to 5.0 h |
| Run | 2.5 to 3.0 h |
| Strength | 1.0 to 1.5 h |
| Extras | 0.5 h |

Focus: Build weekly rhythm, protect easy intensity, and establish swim consistency.

Sessions to place on any suitable days:

### Swim
- Swim lesson / TECH | 60 min | Technique, easy
- Swim lesson / TECH | 60 min | Technique, easy
- Swim EASY ENDURANCE | 40 to 50 min | RPE 2-4/10

### Bike
- SS 3x8' | 70 min | 80-90% FTP, controlled
- EN 60' | 60 min | Z2
- LRide 1:45 | 105 min | Z2, fueling practice
- Brick Bike 45' | 45 min | Z2

### Run
- Brick Run 15' | 15 min | EZ
- EZ 45' | 45 min | Z2
- LR 70 to 80' | 70 to 80 min | Z2

### Strength
- FBW | 60 to 90 min | General strength, no ego lifting

### Extras
- Mobility / prehab | 30 min | Hips, calves, thoracic spine
```

---

## Quality Checklist Before Returning The Plan

Before returning the final `.md` file, verify:

- The plan has a clear title, horizon, goal, and priorities.
- The athlete profile is summarized at the top.
- Assumptions are listed.
- Every week has a phase, estimated volume, discipline time table, focus, and sessions grouped by discipline.
- Sessions include duration and intensity.
- The plan includes deloads.
- Race plans include taper and race week.
- The plan respects current training volume and weekly availability.
- The plan accounts for known limiters.
- The plan does not prescribe unsafe jumps in volume or intensity.
- The plan is Markdown, not PDF.

---

## Tone And Style

Be concise and direct. Do not produce coaching fluff. The athlete should be able to open the `.md` file and immediately know what to do each week.

Use plain language. Keep the plan practical. Prefer specific sessions over vague advice.

